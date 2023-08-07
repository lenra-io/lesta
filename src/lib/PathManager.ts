import { Configuration } from '../config/configurator.js'
import Resource from './resources/Resource.js';

export default abstract class PathManager {
    /**
     * Gets the managed paths
     * @param {Configuration} configuration
     * @returns
     */
    abstract getManagedPaths(configuration: Configuration): Promise<Resource[]>
}