import Resource from "./Resource.js";

export default class FileResource extends Resource {
    /**
     * @param path The path to access the file
     */
    constructor(path: string) {
        super(path);
    }
}