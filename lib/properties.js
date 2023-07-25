import { loadJsonFile } from './utils.js';

export const commonConf = 'properties';

/**
 * Load the project properties
 * @param {string} propertiesPath The properties file path
 * @returns The properties map
 */
export async function loadProperties(propertiesPath) {
    return loadJsonFile(propertiesPath).catch(e => ({}));
}
