import { extractPathLanguage, init } from './i18n.js'
import PathManager, { ResourceMap } from './PathManager.js'
import Page from './resources/Page.js'
import pugPageLister from './pugPageLister.js'
import pugPageRenderer from './pugPageRenderer.js'
import { loadProperties } from './properties.js'
import i18next from 'i18next';
import { Configuration } from '../config/configurator.js'
import TranslatedPage from './resources/TranslatedPage.js'
import Redirection from './resources/Redirection.js'

const X_DEFAULT = 'x-default';

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
    async getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<ResourceMap> {
        await init(configuration);
        this.#_pages = await this.pageLister(configuration);

        // manage translation paths depending on the strategy
        if (configuration.languages.length > 0) {
            const defaultLanguage = configuration.enableDefaultLanquage ? configuration.languages[0] : X_DEFAULT;
            const languages = configuration.enableDefaultLanquage ? configuration.languages : [X_DEFAULT, ...configuration.languages];
            return mapPagesResources(this.#_pages, configuration.translationStrategy, defaultLanguage, languages);
        }
        return Object.fromEntries(this.#_pages.map(p => [p.path, p]));
    }

    /**
     * Builds the content of the given file
     * @param {import('../config/configurator').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    async build(configuration: import('../config/configurator').Configuration, page: Page, options: any): Promise<string> {
        let language = configuration.languages[0];
        if (page instanceof TranslatedPage) {
            language = page.lang;
        }

        const pageMap = Object.fromEntries(
            this.#_pages
                .filter(p => p.path.endsWith('.html'))
                .map(p => [p.href, p])
        );
        // const page = this.#_pages.find(p => p.path == pathLanguage.path);
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
            language: language,
            languages: configuration.languages
        };
        await i18next.changeLanguage(language);
        i18next.setDefaultNamespace(basicPath);

        return await this.pageRenderer(configuration, page, options);
    }
}

function mapPagesResources(pages: Page[], strategy: string, defaultLanguage: string, languages: string[]): ResourceMap {
    return Object.fromEntries(languages.map(lang => {
        if (lang === defaultLanguage) {
            return pages.map(p => {
                const resource = lang === X_DEFAULT ? new Redirection(p.path) : new TranslatedPage(p.path, p, lang);
                return [p.path, resource]
            });
        }
        return pages.map(p => {
            const path = getPathForLang(p.path, lang, strategy);
            return [path, new TranslatedPage(path, p, lang)]
        });
    }).flat(1));
}

function getPathForLang(path: string, lang: string, strategy: string): string {
    if (strategy === 'subdir') return `${lang}/${path}`;
    return path.replace(/(^.*[^/]+)([.][a-z0-9]+)$/, `$1.${lang}$2`);
}