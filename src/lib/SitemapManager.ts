import { Configuration } from '../config/configurator';
import PathManager, { ResourceMap } from './PathManager.js'
import FileResource from './resources/File.js';

/**
 * Build sitemap files
 * @param {import('../config/configurator').Configuration} configuration The configuration
 * @param {Page[]} pages The page list
 * @returns {Promise<void>} A promise resolved when the sitemap files are built
 */
export default class SitemapManager extends PathManager {
    /**
     * Gets the managed paths
     * @param {import('../config/configurator').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<ResourceMap> {
        const path: string = 'sitemap.txt'
        return Promise.resolve(Object.fromEntries([[path, new FileResource(path)]]));
    }

    /**
     * Builds the content of the given file
     */
    build(configuration: Configuration, file: FileResource, { paths }: { paths: string[] }): Promise<string> {
        if (file.path != 'sitemap.txt') throw new Error("Not implemented");
        return Promise.resolve(
            paths
                // TODO: manage disabled content
                .filter(path => path.endsWith('.html'))
                .map(path => path.replace(/(^|\/)index.html$/, "$1"))
                .map(path => `!BASE_URL!/${path}\n`)
                .join('')
        );
    }
}