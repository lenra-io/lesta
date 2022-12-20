export default class PathManager {
    /**
     * Gets the managed paths
     * @param {import('../config/configurator.js').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    getManagedPaths(configuration) {
        return Promise.resolve([]);
    }

    /**
     * Builds the content of the given file
     * @param {import('../config/configurator.js').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     * @returns {Promise<string>}
     */
    build(configuration, path, options) {
        throw new Error("Not implemented");
    }
}