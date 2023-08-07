import Page from "./Page.js";
import Redirection from "./Redirection.js";

export default class PageLangRedirection extends Redirection {
    page: Page;

    /**
     * @param path The path to access the redirection
     */
    constructor(path: string, page: Page) {
        super(path);
        this.page = page;
    }
}