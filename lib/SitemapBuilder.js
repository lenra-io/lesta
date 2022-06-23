import Builder from './Builder.js';

/**
 * Build sitemap files
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {Page[]} pages The page list
 * @returns {Promise<void>} A promise resolved when the sitemap files are built
 */
export default class SitemapBuilder extends Builder {
    /**
     * Gets the builder managed paths
     * @param {import('../src/utils.js').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    getManagedPaths(configuration) {
        return Promise.resolve(['sitemap.txt']);
    }

    /**
     * Builds the content of the given file
     * @param {import('../src/utils.js').Configuration} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    build(configuration, path, { paths }) {
        if (path != 'sitemap.txt') throw new Error("Not implemented");
        return Promise.resolve(
            paths
                // TODO: manage disabled content
                .filter(path => path.endsWith('.html'))
                .map(path => `!BASE_URL!/${path}\n`)
                .join('')
        );
    }
}