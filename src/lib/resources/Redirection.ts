import Resource from "./Resource.js";

export default abstract class Redirection extends Resource {
    /**
     * @param path The path to access the redirection
     */
    constructor(path: string) {
        super(path);
    }
}