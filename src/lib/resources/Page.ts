import Resource from "./Resource.js";

/**
 * @class
 * The website page definition
 */
export default class Page extends Resource {
    href: string;
    view: string;
    langViews: { [key: string]: string };
    properties: any;

    /**
     * @param {string} path The path to access the page
     * @param {string} view The view file to render the page
     * @param {Object.<string, string>} langViews The language specific views
     * @param {any} properties The page custom properties
     */
    constructor(path: string, view: string, langViews: { [key: string]: string }, properties: any) {
        super(path);
        this.href = path.replace(/(^|\/)index.html$/, `$1`);
        this.view = view;
        this.langViews = langViews;
        this.properties = properties;
    }

    /**
     * Gets the view corresponding to the given language
     * @param {string} language The language of the view
     * @returns 
     */
    getView(language: string): string {
        return this.langViews[language] || this.view;
    }
}