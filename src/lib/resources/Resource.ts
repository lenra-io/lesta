export default abstract class Resource {
    path: string;

    /**
     * @param path The path to access the resource
     */
    constructor(path: string) {
        this.path = path;
    }
}