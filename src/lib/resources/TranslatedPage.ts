import { Configuration } from "../../config/configurator.js";
import { RenderOptions } from "../PageManager.js";
import Page from "./Page.js";

export default class TranslatedPage extends Page {
    page: Page;
    lang: string;

    /**
     * @param {string} path The path to access the page
     * @param {string} view The view file to render the page
     * @param {Object.<string, string>} langViews The language specific views
     * @param {any} properties The page custom properties
     */
    constructor(path: string, page: Page, lang: string) {
        super(path, page.langViews[lang], page.langViews, page.properties, page.renderer);
        this.page = page;
        this.lang = lang;
    }

    render(configuration: Configuration, options: RenderOptions): Promise<string> {
        options = {
            ...options,
            language: this.lang
        };
        return super.render(configuration, options);
    }

    get basicPath(): string {
        console.log(this.page.basicPath);
        return this.page.basicPath;
    }
}