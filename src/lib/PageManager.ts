import { extractPathLanguage, init } from './i18n';
import PathManager from './PathManager'
import Page from './Page';
import pugPageLister from './pugPageLister';
import pugPageRenderer from './pugPageRenderer';
import { loadProperties } from './properties';
import i18next from 'i18next';
import { Configuration } from '../config/configurator';

/**
 * @callback pageLister List the website pages
 * @param configuration The configuration
 * @returns 
 */
export type pageLister = (configuration: Configuration) => Promise<Page[]>;

/**
 * @callback pageRenderer Render a website page
 * @param configuration The configuration
 * @param page The page to render
 * @param renderOptions The page render options
 * @returns
 */
export type pageRenderer = (configuration: Configuration, page: Page, renderOptions: RenderOptions) => Promise<string>;

/**
 * The page render options
 * @property {Page[]} pages The website pages
 * @property {{[key: string], Page}} pageMap The website pages map
 * @property {{path: string, href: string, basicPath: string}} currentPage The current page
 * @property {string} language The page language
 * @property {string[]} languages The website languages
 */
export interface RenderOptions {
    pages: Page[];
    pageMap: { [key: string]: Page };
    currentPage: { path: string, href: string, basicPath: string };
    language: string;
    languages: string[];
}

export default class PageManager extends PathManager {
    /**
     * @type {Page[]}
     */
    #_pages: Page[];

    pageLister: pageLister;
    pageRenderer: pageRenderer;

    /**
     * @param {pageLister} pageLister The website page lister
     * @param {pageRenderer} pageRenderer The website page renderer
     */
    constructor(pageLister: pageLister = pugPageLister, pageRenderer: pageRenderer = pugPageRenderer) {
        super();
        this.pageLister = pageLister;
        this.pageRenderer = pageRenderer;
    }

    /**
     * Gets the managed paths
     * @param {import('../config/configurator').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    async getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<string[]> {
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
     * @param {import('../config/configurator').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    async build(configuration: import('../config/configurator').Configuration, path: string, options: any): Promise<string> {
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