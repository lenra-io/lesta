import PathManager from './PathManager.js'

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
    getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<string[]> {
        return Promise.resolve(['sitemap.txt']);
    }

    /**
     * Builds the content of the given file
     * @param {import('../config/configurator').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    build(configuration: import('../config/configurator').Configuration, path: string, { paths }: { paths: string[] }): Promise<string> {
        if (path != 'sitemap.txt') throw new Error("Not implemented");
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