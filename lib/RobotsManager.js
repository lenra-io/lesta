import PathManager from './PathManager.js';

/**
 * @typedef robotsCrawler
 * @property {'Allow' | 'Disallow'} type The crawler type
 * @property {string} path The crawler path
 */

/**
 * @typedef robotsRule
 * @property {string} userAgent The rule user agent filter
 * @property {robotsCrawler[]} crawlers The rule crawlers
 */

/**
 * @typedef RobotsConfiguration
 * @property {robotsRule[]} rules The robots.txt rules
 */

/**
 * Build robots.txt file
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {Page[]} pages The page list
 * @returns {Promise<void>} A promise resolved when the robots.txt file is built
 */
export default class RobotsManager extends PathManager {
    /**
     * Gets the managed paths
     * @param {import('../src/utils.js').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
     getManagedPaths(configuration) {
        return Promise.resolve(['robots.txt']);
    }

    /**
     * Builds the content of the given file
     * @param {import('../src/utils.js').Configuration & {robots: RobotsConfiguration}} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    async build(configuration, path, options) {
        if (path!='robots.txt') throw new Error("Not implemented");
        let content = configuration.robots.rules
        .map(rule => 'User-agent: ' + rule.userAgent + '\n' +
            rule.crawlers.map(crawler => `${crawler.type}: ${crawler.path}`).join('\n') + 
            '\n\n'
        ).join('');

        content += 'Sitemap: !BASE_URL!/sitemap.txt\n';
        return Promise.resolve(content);
    }
}