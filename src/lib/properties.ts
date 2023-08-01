import { loadJsonFile } from './utils.js'

export const commonConf: string = 'properties';

/**
 * Load the project properties
 * @param {string} propertiesPath The properties file path
 * @returns The properties map
 */
export async function loadProperties(propertiesPath: string): Promise<Record<string, unknown>> {
    return loadJsonFile(propertiesPath).catch(e => ({}));
}