import { Configuration } from "../config/configurator.js"
import { join, relative, dirname, extname } from "path";
import { mkdirSync } from 'fs';
import { copyFile, writeFile } from 'fs/promises';
import { minify } from 'minify';
import { cssMinify } from './cssMinify.js'
import { getFilesRecursively, mergeDeep } from '../lib/utils.js'
import PathManager from "./PathManager.js"

export interface NginxConfiguration {
  rewriteRules: RewriteRule[];
  additionalContentSecurityPolicies?: Policies;
  gzipTypes: string[];
  expires: string;
  additionalLocationConfigs?: { [key: string]: string[] };
}

export interface RewriteRule {
  from: string;
  to: string;
  flag?: "last" | "break" | "redirect" | "permanent";
}

type Policies = { [k: string]: string[] };

const cwd = process.cwd();
const siteRuleRegex = /.*[.*].*/;
/**
 * Build a website for Nginx server
 * @param configuration The configuration
 * @param managers The content managers
 * @returns A promise resolved when the built is done
 */
export default async function nginxBuilder(configuration: Configuration, managers: PathManager[]) {
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
          return cssMinify(file)
            .then(content => writeFile(destinationPath, content));
        default:
          return copyFile(file, destinationPath);
      }
    });

  const managerResourceMap = await Promise.all(
    managers.map(async manager => ({
      manager,
      resourceMap: await manager.getManagedPaths(configuration)
    }))
  );
  const paths = managerResourceMap.flatMap(({ resourceMap }) => Object.keys(resourceMap));
  const options = { paths };

  // Build the managers paths
  promises.push.apply(promises,
    managerResourceMap.flatMap(({ manager, resourceMap }) =>
      Object.entries(resourceMap)
        .map(([path, resource]) => {
          const destPath = join(wwwPath, path);
          mkdirSync(dirname(destPath), { recursive: true });
          return manager.build(configuration, resource, options)
            .then(content =>
              path.endsWith('.html') ? minify.html(content) : content
            )
            .then(content => writeFile(destPath, content))
        })
    )
  );

  // TODO: Generate the Nginx conf
  promises.push(writeFile(join(buildPath, 'nginx.conf'), generateNginxConf(configuration)));

  return await Promise.all(promises).then(() => { });
}



/**
 * Generate the nginx configuration file
 * @param configuration The configuration
 * @returns 
 */
function generateNginxConf(configuration: Configuration) {
  const buffer = [];
  let tabLevel = 0;

  // Manage proxy protocol
  addLine(buffer, tabLevel++, 'map $http_x_forwarded_proto $initial_scheme {');
  addLine(buffer, tabLevel, 'default $scheme;');
  addLine(buffer, tabLevel, 'https https;');
  addLine(buffer, --tabLevel, '}');

  // Detect user's prefered language
  const detectLang = configuration.languages.length > 1 && (!configuration.translationStrategy || !configuration.enableDefaultLanquage);
  const redirectToLangPage = detectLang && !configuration.enableDefaultLanquage;
  if (detectLang) {
    addLine(buffer, tabLevel++, 'map $http_accept_language $lang {');
    addLine(buffer, tabLevel, `default ${configuration.languages[0]}`);
    const acceptLangs = configuration.languages.slice();
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

    if (configuration.nginx.additionalLocationConfigs) {
      Object.entries(configuration.nginx.additionalLocationConfigs).forEach(([location, configs]) => {
        addLine(buffer, tabLevel++, `location ${location} {`);
        configs.forEach(conf => addLine(buffer, tabLevel, conf));
        addLine(buffer, --tabLevel, '}');
      });
    }

    // location block
    {
      addLine(buffer, tabLevel++, 'location / {');

      addLine(buffer, tabLevel, `expires ${configuration.nginx.expires};`);

      // TODO: manage i18n strategy redirection
      if (redirectToLangPage) {
        console.log("Define redirection to lang page");
      }


      configuration.nginx.rewriteRules
        .map(rule => `rewrite ${rule.from} ${rule.to} ${rule.flag || ''};`)
        .forEach(line => addLine(buffer, tabLevel, line));

      addLine(buffer, tabLevel, 'rewrite ^/(.*/)?index.html$ /$1 permanent;');
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

  if (tabLevel != 0) throw new Error('The tab level at the end of the file is not at 0: ' + tabLevel);
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
  const policies: Policies = {};
  mergeDeep(policies, defaultSecurityPolicies, additionalPolicies);
  return Object.entries(policies)
    .map(([key, values]) => [key, values.map(v => siteRuleRegex.test(v) ? v : `'${v}'`).join(' ')])
    .map(([key, values]) => `${key} ${values}; `)
    .join(' ');
}