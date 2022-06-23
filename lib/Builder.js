export default class Builder {
    /**
     * Gets the builder managed paths
     * @param {import('../src/utils.js').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    getManagedPaths(configuration) {
        return Promise.resolve([]);
    }

    /**
     * Builds the content of the given file
     * @param {import('../src/utils.js').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     * @returns {Promise<string>}
     */
    build(configuration, path, options) {
        throw new Error("Not implemented");
    }
}