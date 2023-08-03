import { Configuration } from '../config/configurator.js'
import Resource from './resources/Resource.js';

export type ResourceMap = { [key: string]: Resource };

export default abstract class PathManager {
    /**
     * Gets the managed paths
     * @param {Configuration} configuration
     * @returns
     */
    abstract getManagedPaths(configuration: Configuration): Promise<ResourceMap>

    /**
     * Builds the content of the given file
     * @param {Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     * @returns
     */
    abstract build(configuration: Configuration, resource: Resource, options: any): Promise<string>;
}