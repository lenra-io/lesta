/**
 * @class
 * The website page definition
 */
export default class Page {
    /**
     * @param {string} path The path to access the page
     * @param {string} view The view file to render the page
     * @param {Object.<string, string>} langViews The language specific views
     * @param {any} properties The page custom properties
     */
    constructor(path, view, langViews, properties) {
        this.path = path;
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
    getView(language) {
        return this.langViews[language] || this.view;
    }
}