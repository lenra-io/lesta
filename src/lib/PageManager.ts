import i18next from 'i18next'
import { Configuration } from '../config/configurator.js'
import PathManager from './PathManager.js'
import { init } from './i18n.js'
import { loadProperties } from './properties.js'
import pugPageLister from './pugPageLister.js'
import Page from './resources/Page.js'
import PageLangRedirection from './resources/PageLangRedirection.js'
import Resource from './resources/Resource.js'
import TranslatedPage from './resources/TranslatedPage.js'

const X_DEFAULT = 'x-default';

/**
 * @callback pageLister List the website pages
 * @param configuration The configuration
 * @returns 
 */
export type PageLister = (configuration: Configuration) => Promise<Page[]>;

/**
 * The page render options
 * @property {Page[]} pages The website pages
 * @property {{[key: string], Page}} pageMap The website pages map
 * @property {{path: string, href: string, basicPath: string}} currentPage The current page
 * @property {string} language The page language
 * @property {string[]} languages The website languages
 */
export interface RenderOptions {
    paths: string[];
    pages?: Page[];
    pageMap?: { [key: string]: Page };
    currentPage?: Page;
    language?: string;
    languages?: string[];
}

export default class PageManager extends PathManager {
    /**
     * @type {Page[]}
     */
    #_pages: Page[];

    pageLister: PageLister;

    /**
     * @param {PageLister} pageLister The website page lister
     */
    constructor(pageLister: PageLister = pugPageLister) {
        super();
        this.pageLister = pageLister;
    }

    /**
     * Gets the managed paths
     * @param {import('../config/configurator').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    async getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<Resource[]> {
        await init(configuration);
        this.#_pages = await this.pageLister(configuration);

        // manage translation paths depending on the strategy
        if (configuration.languages.length > 0) {
            const defaultLanguage = configuration.enableDefaultLanquage ? configuration.languages[0] : X_DEFAULT;
            const languages = configuration.enableDefaultLanquage ? configuration.languages : [X_DEFAULT, ...configuration.languages];
            return mapPagesResources(this.#_pages, configuration.translationStrategy, defaultLanguage, languages);
        }
        return this.#_pages;
    }

    /**
     * Builds the content of the given file
     * @param configuration 
     * @param page
     * @param options 
     */
    async build(configuration: Configuration, page: Page, options: any): Promise<string> {
        let language = configuration.languages[0];
        if (page instanceof TranslatedPage) {
            language = page.lang;
        }

        const pageMap = Object.fromEntries(
            this.#_pages
                .filter(p => p.path.endsWith('.html'))
                .map(p => [p.href, p])
        );
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

        return await page.render(configuration, options);
    }
}

function mapPagesResources(pages: Page[], strategy: string, defaultLanguage: string, languages: string[]): Resource[] {
    return languages.map(lang => {
        if (lang === defaultLanguage) {
            return pages.map(p =>
                lang === X_DEFAULT
                    ? new PageLangRedirection(p.path, p)
                    : new TranslatedPage(p.path, p, lang)
            );
        }
        return pages.map(p =>
            new TranslatedPage(getPathForLang(p.path, lang, strategy), p, lang)
        );
    }).flat(1);
}

export function getPathForLang(path: string, lang: string, strategy: string): string {
    if (strategy === 'subdir') return `${lang}/${path}`;
    return path.replace(/(^.*[^/]+)([.][a-z0-9]+)$/, `$1.${lang}$2`);
}