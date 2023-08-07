import { ContentResource, contentRenderer } from "./ContentResource.js";
import Resource from "./Resource.js";

export default class FileResource extends ContentResource {
    /**
     * @param path The path to access the file
     */
    constructor(path: string, renderer: contentRenderer) {
        super(path, renderer);
    }
}