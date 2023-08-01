import PathManager from './PathManager';

/**
 * @typedef robotsCrawler
 * @property {'Allow' | 'Disallow'} type The crawler type
 * @property {string} path The crawler path
 */
export interface RobotsCrawler {
    // The crawler type
    type: 'Allow' | 'Disallow';
    path: string;
}

/**
 * @typedef robotsRule
 * @property {string} userAgent The rule user agent filter
 * @property {RobotsCrawler[]} crawlers The rule crawlers
 */
export interface RobotsRule {
    userAgent: string;
    crawlers: RobotsCrawler[];
}

/**
 * @typedef RobotsConfiguration
 * @property {RobotsRule[]} rules The robots.txt rules
 */

export interface RobotsConfiguration {
    rules: RobotsRule[]
}

/**
 * Build robots.txt file
 * @param {import('../config/configurator').Configuration} configuration The configuration
 * @param {Page[]} pages The page list
 * @returns {Promise<void>} A promise resolved when the robots.txt file is built
 */
export default class RobotsManager extends PathManager {
    /**
     * Gets the managed paths
     * @param {import('../config/configurator').Configuration} configuration 
     * @returns {Promise<string[]>}
     */
    getManagedPaths(configuration: import('../config/configurator').Configuration): Promise<string[]> {
        return Promise.resolve(['robots.txt']);
    }

    /**
     * Builds the content of the given file
     * @param {import('../config/configurator').Configuration & {robots: RobotsConfiguration}} configuration 
     * @param {string} path 
     * @param {*} options 
     */
    async build(configuration: import('../config/configurator').Configuration & { robots: RobotsConfiguration }, path: string, options: any) {
        if (path != 'robots.txt') throw new Error("Not implemented");
        let content = configuration.robots.rules
            .map(rule => 'User-agent: ' + rule.userAgent + '\n' +
                rule.crawlers.map(crawler => `${crawler.type}: ${crawler.path}`).join('\n') +
                '\n\n'
            ).join('');

        content += 'Sitemap: !BASE_URL!/sitemap.txt\n';
        return Promise.resolve(content);
    }
}