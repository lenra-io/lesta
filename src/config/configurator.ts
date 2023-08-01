import expressServer from '../lib/expressServer.js'
import nginxBuilder from '../lib/nginxBuilder.js'
import { NginxConfiguration } from '../lib/nginxBuilder.js'
import PathManager from '../lib/PathManager.js'
import RobotsManager from '../lib/RobotsManager.js'
import { RobotsConfiguration } from '../lib/RobotsManager.js'
import SitemapManager from '../lib/SitemapManager.js'
import { loadJsonFile, mergeDeep } from '../lib/utils.js'
import { join } from 'path';
import { generator } from '../lib/Website.js'
import PageManager from '../lib/PageManager.js'

export interface Configurator {
    /**
     * Returns the website configuration
     * @returns {Promise<Configuration>}
     */
    getConfiguration(): Promise<Configuration>;

    /**
     * Returns the website path managers
     * @returns {PathManager[]}
     */
    getManagers(): PathManager[];
    /**
     * Returns the default configuration
     */
    generators: GeneratorMap;
}


export const defaultConfigurator: Configurator = {
    getManagers: function (): PathManager[] {
        return [new PageManager(), new RobotsManager(), new SitemapManager()];
    },
    getConfiguration: async function (): Promise<Configuration> {
        const cwd = process.cwd();
        const defaultConfig = await loadJsonFile(new URL('../config/default-config.json', import.meta.url));
        const packageConfig = await loadJsonFile(join(cwd, 'package.json'))
            .then(packageContent => packageContent.lesta)
            .catch(e => { });
        return mergeDeep({}, defaultConfig, packageConfig);
    },
    generators: {
        express: expressServer,
        nginx: nginxBuilder
    }
}

type GeneratorMap = { [key: string]: generator };

/**
 * @typedef Configuration
 * @property {string} propertiesPath The project properties file path. This file will be loaded as a JSON object and will be available in the page content.
 * @property {string} staticDir The static files base directory. The content of this directory will be copied as it is.
 * @property {string} i18nDir The internationalisation files base directory. The directory can contain a file by managed language (example: 'en.js' for english). It can also contain a 'common.js' file to define properties common to all languages
 * @property {string} viewsDir The view files base directory
 * @property {string} buildDir The build target directory
 * @property {string[]} languages The list of managed languages by priority. The first one is the default language
 * @property {boolean} enableDefaultLanquage Define if the first language is the default. If true, the page path will use this default language. If false, the base path will use the user language priority
 * @property {'suffix' | 'subdir' | null} translationStrategy Define the strategy to manage page translation
 *  * suffix: will add the language as suffix of file name before the extension. For exemple, `index.html` page path for english language will be `index.en.html`
 *  * subdir: will make the pages accessible in a subdirectory for the language. For exemple, `index.html` page path for english language will be in `en/index.html`
 *  * null: the page path will be the same for all languages
 * @property {integer} port The listen server port
 * @property {import('../lib/RobotsManager.js').RobotsConfiguration} robots The robots.txt manager configuration
 * @property {import('../lib/nginxBuilder.js').NginxConfiguration} nginx The nginx generator configuration
 */
export interface Configuration {
    propertiesPath: string;
    staticDir: string;
    i18nDir: string;
    viewsDir: string;
    buildDir: string;
    languages: string[];
    enableDefaultLanquage: boolean;
    translationStrategy: 'suffix' | 'subdir' | null;
    port: number;
    robots: RobotsConfiguration;
    nginx: NginxConfiguration;
}