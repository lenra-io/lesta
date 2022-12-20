import { commonConf, extractPathLanguage, loadTranslation, mergeTranslation } from './i18n.js';
import PathManager from './PathManager.js'
import Page from './Page.js';
import pugPageLister from './pugPageLister.js';
import pugPageRenderer from './pugPageRenderer.js';

/**
 * @callback pageLister List the website pages
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @returns {Promise<Page[]>}
 */

/**
 * @callback pageRenderer Render a website page
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @param {Page} page The page to render
 * @param {string | undefined} language The page language
 * @param {any} translation The language translation
 * @param {any} renderOptions The page render options
 * @returns {Promise<string>}
 */

export default class PageManager extends PathManager {
    /**
     * @type {Page[]}
     */
    #_pages;

    /**
     * @param {pageLister} pageLister The website page lister
     * @param {pageRenderer} pageRenderer The website page renderer
     */
    constructor(pageLister = pugPageLister, pageRenderer = pugPageRenderer) {
        super();
        this.pageLister = pageLister;
        this.pageRenderer = pageRenderer;
    }

    /**
     * Gets the managed paths
     * @param {import('../config/configurator.js').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    async getManagedPaths(configuration) {
        this.#_pages = await this.pageLister(configuration);

        // manage translation paths depending on the strategy
        if (configuration.languages.length > 0) {
            switch (configuration.translationStrategy) {
                case 'subdir':
                    return configuration.languages.flatMap((lang, i) => {
                        if (i == 0 && configuration.enableDefaultLanquage) return this.#_pages.map(p => p.path);
                        return this.#_pages.map(p => `/${lang}${p.path}`);
                    });
                case 'suffix':
                    return configuration.languages.flatMap((lang, i) => {
                        if (i == 0 && configuration.enableDefaultLanquage) return this.#_pages.map(p => p.path);
                        return this.#_pages.map(p => p.path.replace(/(^.*[^/]+)([.][a-z0-9]+)$/, `$1.${lang}$2`));
                    });
            }
        }
        return this.#_pages.map(p => p.path);
    }

    /**
     * Builds the content of the given file
     * @param {import('../config/configurator.js').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    async build(configuration, path, options) {
        const pathLanguage = extractPathLanguage(configuration, path);

        if (!pathLanguage.language) {
            if (!configuration.translationStrategy && options.request) {
                pathLanguage.language = options.request.query.lang;
                // TODO: manage favorite language
            }
            pathLanguage.language = pathLanguage.language || configuration.languages[0];
        }

        const page = this.#_pages.find(p => p.path == pathLanguage.path);
        var translation = null;
        options = {...options, pages: this.#_pages, request: undefined};
        if (options.translations) {
            translation = options.translations.get(pathLanguage.language || commonConf);
        }
        else {
            const pCommon = loadTranslation(configuration.i18nDir, commonConf);
            const pTranslation = loadTranslation(configuration.i18nDir, pathLanguage.language);
            translation = mergeTranslation(configuration.languages, pathLanguage.language, await pCommon, await pTranslation);
        }

        return await this.pageRenderer(configuration, page, pathLanguage.language, translation, options);
    }
}