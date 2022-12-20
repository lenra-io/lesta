import { mkdirSync } from 'fs';
import { copyFile, writeFile } from 'fs/promises';
import { minify } from 'minify';
import { dirname, extname, join, relative } from 'path';
import { getMergedTranslations } from './i18n.js';
import { getFilesRecursively, mergeDeep } from '../lib/utils.js';
import PathManager from './PathManager.js';

const cwd = process.cwd();
const siteRuleRegex = /.*[.*].*/;
/**
 * Build a website for Nginx server
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @param {PathManager[]} managers The content managers
 * @returns {Promise<void>} A promise resolved when the built is done
 */
export default async function nginxBuilder(configuration, managers) {
    const staticPath = join(cwd, configuration.staticDir);
    const buildPath = join(cwd, configuration.buildDir);
    const wwwPath = join(buildPath, 'www');
    mkdirSync(wwwPath, { recursive: true });

    // copy static directory
    const promises = (await getFilesRecursively(staticPath))
        .map(file => {
            const relativePath = relative(staticPath, file);
            const destinationPath = join(wwwPath, relativePath);
            const destinationDir = dirname(destinationPath);
            const ext = extname(file).toLowerCase();
            if (/^.*\/\.[^/]+$/.test(file)) return;
            mkdirSync(destinationDir, { recursive: true });
            switch (ext) {
                case '.html':
                case '.js':
                    return minify(file)
                        .then(content => writeFile(destinationPath, content));
                case '.css':
                    const content = minify.css(`@import "${relative(process.cwd(), file)}";`, {
                        css: {
                            rebase: false
                        },
                        img: {
                            maxSize: 1
                        }
                    });
                    return writeFile(destinationPath, content);
                default:
                    return copyFile(file, destinationPath);
            }
        });

    const managerPaths = await Promise.all(
        managers.map(async manager => ({
            manager,
            managedPaths: await manager.getManagedPaths(configuration)
        }))
    );
    const paths = managerPaths.flatMap(({ managedPaths }) => managedPaths);
    const translations = await getMergedTranslations(configuration.i18nDir, configuration.languages);
    const options = { paths, translations };

    // Build the managers paths
    promises.push.apply(promises,
        managerPaths.flatMap(({ manager, managedPaths }) =>
            managedPaths.map(path =>
                manager.build(configuration, path, options)
                    .then(content =>
                        path.endsWith('.html') ? minify.html(content) : content
                    )
                    .then(content => writeFile(join(wwwPath, path), content))
            )
        )
    );

    // TODO: Generate the Nginx conf
    promises.push(writeFile(join(buildPath, 'nginx.conf'), generateNginxConf(configuration)));

    return await Promise.all(promises);
}



/**
 * Generate the nginx configuration file
 * @param {import('../config/configurator.js').Configuration & {nginx: NginxConfiguration}} configuration The configuration
 * @returns 
 */
function generateNginxConf(configuration) {
    const buffer = [];
    var tabLevel = 0;

    // Manage proxy protocol
    addLine(buffer, tabLevel++, 'map $http_x_forwarded_proto $initial_scheme {');
    addLine(buffer, tabLevel, 'default $scheme;');
    addLine(buffer, tabLevel, 'https https;');
    addLine(buffer, --tabLevel, '}');

    // Detect user's prefered language
    const detectLang = configuration.languages.length > 1 && (!configuration.translationStrategy || !configuration.enableDefaultLanquage);
    const redirectToLangPage = detectLang && !configuration.enableDefaultLanquage;
    console.log('detectLang', detectLang, configuration.languages, configuration.translationStrategy, configuration.enableDefaultLanquage)
    if (detectLang) {
        addLine(buffer, tabLevel++, 'map $http_accept_language $lang {');
        addLine(buffer, tabLevel, `default ${configuration.languages[0]}`);
        var acceptLangs = configuration.languages.slice();
        while (acceptLangs.length > 0) {
            const lang = acceptLangs.shift();
            const beforeLanguagesRegex = acceptLangs.length > 0 ? `^(((?!(${acceptLangs.join('|')})).)+,)*` : '';
            addLine(buffer, tabLevel, `~${beforeLanguagesRegex}${lang}.* ${lang};`);
        }
        addLine(buffer, --tabLevel, '}');
    }

    // Server block
    {
        addLine(buffer, tabLevel++, 'server {');
        addLine(buffer, tabLevel, `listen 0.0.0.0:${configuration.port};`);
        // TODO: manage server name and aliases
        addLine(buffer, tabLevel, `server_name myserver;`);
        // TODO: manage path with conf
        addLine(buffer, tabLevel, `root /app/;`);

        // TODO: manage charset with conf
        addLine(buffer, tabLevel, `charset utf-8;`);
        addLine(buffer, tabLevel, `charset_types text/css application/javascript;`);

        // Handle headers
        addLine(buffer, tabLevel, `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`);
        addLine(buffer, tabLevel, `add_header Content-Security-Policy "${buildContentSecurityPolicyHeader(configuration.nginx.additionalContentSecurityPolicies)}";`);
        addLine(buffer, tabLevel, `add_header Vary "Accept-Encoding";`);
        addLine(buffer, tabLevel, `add_header X-Content-Type-Options "nosniff";`);
        addLine(buffer, tabLevel, `add_header X-Frame-Options "DENY";`);

        // gzip types
        addLine(buffer, tabLevel, `gzip_types ${configuration.nginx.gzipTypes.join(' ')};`);

        // location block
        {
            addLine(buffer, tabLevel++, 'location / {');

            addLine(buffer, tabLevel, `expires ${configuration.nginx.expires};`);

            // TODO: manage i18n strategy redirection
            if (redirectToLangPage) {
                
            }

            configuration.nginx.rewriteRules
                .map(rule => `rewrite ${rule.from} ${rule.to} ${rule.type || ''};`)
                .forEach(line => addLine(buffer, tabLevel, line));

            addLine(buffer, tabLevel, "set $index 'index.html';");

            addLine(buffer, tabLevel, 'try_files $uri $uri$index $uri/$index $index =404;');

            addLine(buffer, tabLevel, "sub_filter_types text/plain;");
            addLine(buffer, tabLevel, "sub_filter_once off;");
            addLine(buffer, tabLevel, "sub_filter '!DOMAIN!'  '$host';");
            addLine(buffer, tabLevel, "sub_filter '!CURRENT_URL!'  '$initial_scheme://$host$request_uri';");
            addLine(buffer, tabLevel, "sub_filter '!BASE_URL!'  '$initial_scheme://$host';");
            addLine(buffer, tabLevel, "sub_filter '!IMAGE_URL!'  '$initial_scheme://$host$uri.jpg';");

            addLine(buffer, --tabLevel, '}');
        }

        addLine(buffer, --tabLevel, '}');
    }

    if (tabLevel != 0) throw new Error('The tab level at the end of the file is not at 0', tabLevel);
    return buffer.join('\n') + '\n';
}

const tabContent = '  ';

/**
 * Adds a line to the given buffer
 * @param {string[]} buffer The line buffer
 * @param {number} tabLevel The number of tabs for the line
 * @param {string} content The line content
 */
function addLine(buffer, tabLevel, content) {
    const tabs = new Array(tabLevel).fill(tabContent).join('');
    buffer.push(tabs + content);
}

/**
 * 
 * @param {any} additionalPolicies Additional policies
 */
function buildContentSecurityPolicyHeader(additionalPolicies) {
    if (!additionalPolicies) additionalPolicies = {};
    const defaultSecurityPolicies = {
        'default-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self']
    };
    const policies = {};
    mergeDeep(policies, defaultSecurityPolicies, additionalPolicies);
    return Object.entries(policies)
        .map(([key, values]) => `${key} ${values.map(v => siteRuleRegex.test(v) ? v : `'${v}'`).join(' ')}; `)
        .join(' ');
}

/**
 * @typedef NginxConfiguration
 * @property {RewriteRule[]} rewriteRules The conf rewrite rules
 * @property {Object.<string, string[]>} additionalContentSecurityPolicies Additional content security policies
 * @property {string[]} gzipTypes The content type list of the files that can be gzipped
 * @property {string} expires Cache expiration duration
 */

/**
 * @typedef RewriteRule
 * @property {string} from The request url regex
 * @property {string} to The rewrite target
 * @property {"last"|"break"|"redirect"|"permanent"|void} flag The rewrite flag
 */
