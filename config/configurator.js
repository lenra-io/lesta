import expressServer from '../lib/ExpressServer.js';
import nginxBuilder from '../lib/nginxBuilder.js';
import PageManager from '../lib/PageManager.js';
import PathManager from '../lib/PathManager.js';
import RobotsManager from '../lib/RobotsManager.js';
import SitemapManager from '../lib/SitemapManager.js';
import { getConfiguration, loadJsonFile, mergeDeep } from '../lib/utils.js';

/**
 * Returns the website path managers
 * @returns {PathManager[]}
 */
export function getManagers() {
    return [new PageManager(), new RobotsManager(), new SitemapManager()];
}

/**
 * @type {Object.<string, import('../lib/Website.js').generator}
 */
export const generators = {
    express: expressServer,
    nginx: nginxBuilder
};


/**
 * @typedef Configuration
 * @property {string} staticDir The static files base directory. The content of this directory will be copied as it is.
 * @property {string} i18nDir The internationalisation files base directory. The directory can contain a file by managed language (example: 'en.js' for english). It can also contain a 'common.js' file to define properties common to all languages
 * @property {string} viewsDir The view files base directory
 * @property {string} buildDir The build target directory
 * @property {string[]} languages The list of managed languages by priority. The first one is the default language
 * @property {boolean} enableDefaultLanquage Define if the first language is the default. If true, the page path will use this default language. If false, the base path will use the user language priority
 * @property {'suffix' | 'subdir' | null} translationStrategy Define the strategy to manage page translation
 *  * suffix: will add the language as suffix of file name before the extension. For exemple, `index.html` page path for english language will be `index.en.html`
 *  * subdir: will make the pages accessible in a subdirectoriy for the language. For exemple, `index.html` page path for english language will be `en/index.html`
 *  * null: the page path will be the same for all languages
 * @property {integer} port The listen server port
 * @property {import('../lib/RobotsManager.js').RobotsConfiguration} robots The robots.txt manager configuration
 */

/**
 * Get the merged configuration
 * @returns {Promise<Configuration>}
 */
export async function getConfiguration() {
    const defaultConfig = {
        "staticDir": "src/static",
        "i18nDir": "src/i18n",
        "viewsDir": "src/views",
        "buildDir": "build",
        "languages": [],
        "enableDefaultLanquage": false,
        "port": 8081,
        "robots": {
            "rules": [
                {
                    "userAgent": "*",
                    "crawlers": [
                        {
                            "type": "Allow",
                            "path": "/"
                        }
                    ]
                }
            ]
        },
        "nginx": {
            "rewriteRules": [],
            "additionalContentSecurityPolicies": {},
            "gzipTypes": [
                "text/plain",
                "text/css",
                "text/js",
                "text/xml",
                "text/javascript",
                "application/javascript",
                "application/x-javascript",
                "application/json",
                "application/xml",
                "application/rss+xml",
                "image/svg+xml"
            ],
            "expires": "10d"
        }
    };
    const cwd = process.cwd();
    const packageConfig = loadJsonFile(join(cwd, 'package.json'))
        .then(packageContent => packageContent.lesta)
        .catch(e => {});
    return mergeDeep({}, defaultConfig, packageConfig);
}