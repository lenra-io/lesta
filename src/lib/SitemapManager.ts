import { Configuration } from '../config/configurator';
import { RenderOptions } from './PageManager.js';
import PathManager from './PathManager.js';
import { contentRenderer } from './resources/ContentResource.js';
import FileResource from './resources/File.js';
import Resource from './resources/Resource.js';

export const SITEMAP_FILE = 'sitemap.txt';

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
    getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<Resource[]> {
        return Promise.resolve([new FileResource(SITEMAP_FILE, build.bind(null, configuration))]);
    }
}

/**
 * Builds the content of the given file
 * @param configuration 
 * @param _options 
 */
function build(configuration: Configuration, options: RenderOptions) {
    return Promise.resolve(
        options.paths
            // TODO: manage disabled content
            .filter(path => path.endsWith('.html'))
            .map(path => path.replace(/(^|\/)index.html$/, "$1"))
            .map(path => `!BASE_URL!/${path}\n`)
            .join('')
    );
}