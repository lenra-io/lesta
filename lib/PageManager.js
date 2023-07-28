import { extractPathLanguage, init } from './i18n.js';
import PathManager from './PathManager.js'
import Page from './Page.js';
import pugPageLister from './pugPageLister.js';
import pugPageRenderer from './pugPageRenderer.js';
import { loadProperties } from './properties.js';
import i18next from 'i18next';

/**
 * @callback pageLister List the website pages
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @returns {Promise<Page[]>}
 */

/**
 * @callback pageRenderer Render a website page
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @param {Page} page The page to render
 * @param {RenderOptions} renderOptions The page render options
 * @returns {Promise<string>}
 */

/**
 * @typedef {Object} RenderOptions The page render options
 * @property {Page[]} pages The website pages
 * @property {{[key: string], Page}} pageMap The website pages map
 * @property {{path: string, href: string, basicPath: string}} currentPage The current page
 * @property {string} language The page language
 * @property {string[]} languages The website languages
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
        await init(configuration);
        this.#_pages = await this.pageLister(configuration);

        // manage translation paths depending on the strategy
        if (configuration.languages.length > 0) {
            switch (configuration.translationStrategy) {
                case 'subdir':
                    return configuration.languages.flatMap((lang, i) => {
                        if (i == 0 && configuration.enableDefaultLanquage) return this.#_pages.map(p => p.path);
                        return this.#_pages.map(p => `${lang}/${p.path}`);
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
            pathLanguage.language = configuration.languages[0];
        }

        const pageMap = Object.fromEntries(
            this.#_pages
                .filter(p => p.path.endsWith('.html'))
                .map(p => [p.href, p])
        );
        const page = this.#_pages.find(p => p.path == pathLanguage.path);
        const properties = await loadProperties(configuration.propertiesPath);
        const basicPath = page.path.replace(/[.]html$/, '');
        options = {
            ...options,
            pages: this.#_pages,
            pageMap,
            ...properties,
            currentPage: {
                path: page.path,
                href: page.href,
                basicPath
            },
            language: pathLanguage.language,
            languages: configuration.languages
        };
        await i18next.changeLanguage(pathLanguage.language);
        i18next.setDefaultNamespace(basicPath);

        return await this.pageRenderer(configuration, page, options);
    }
}