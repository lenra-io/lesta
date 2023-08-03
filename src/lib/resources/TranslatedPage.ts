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
        super(path, page.langViews[lang], page.langViews, page.properties);
        this.page = page;
        this.lang = lang;
    }
}