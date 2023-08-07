import i18next from "i18next";
import { Configuration } from "../../config/configurator.js";
import { RenderOptions } from "../PageManager.js";
import { ContentResource } from "./ContentResource.js";

export type pageRenderer = (page: Page, configuration: Configuration, options: RenderOptions) => Promise<string>;

/**
 * @class
 * The website page definition
 */
export default class Page extends ContentResource {
    href: string;
    _basicPath: string;
    view: string;
    langViews: { [key: string]: string };
    properties: any;

    /**
     * @param {string} path The path to access the page
     * @param {string} view The view file to render the page
     * @param {Object.<string, string>} langViews The language specific views
     * @param {any} properties The page custom properties
     */
    constructor(path: string, view: string, langViews: { [key: string]: string }, properties: any, renderer: pageRenderer) {
        super(path, renderer);
        this.href = path.replace(/(^|\/)index.html$/, `$1`);
        this._basicPath = path.replace(/[.]html$/, '');
        this.view = view;
        this.langViews = langViews;
        this.properties = properties;
    }

    async render(configuration: Configuration, options: RenderOptions): Promise<string> {
        if (!options.language) options.language = configuration.languages[0];
        const basicPath = this.path.replace(/[.]html$/, '');
        options = {
            ...options,
            currentPage: this,
            languages: configuration.languages
        };
        await i18next.changeLanguage(options.language);
        i18next.setDefaultNamespace(basicPath);

        return super.render(configuration, options);
    }

    get basicPath(): string {
        return this._basicPath;
    }
}