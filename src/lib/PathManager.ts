import { Configuration } from '../config/configurator.js'

export default abstract class PathManager {
    /**
     * Gets the managed paths
     * @param {Configuration} configuration
     * @returns
     */
    abstract getManagedPaths(configuration: Configuration): Promise<string[]>

    /**
     * Builds the content of the given file
     * @param {Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     * @returns
     */
    abstract build(configuration: Configuration, path: string, options: any): Promise<string>;
}