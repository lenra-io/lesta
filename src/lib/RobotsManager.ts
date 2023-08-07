import { Configuration } from '../config/configurator';
import PathManager from './PathManager.js';
import { SITEMAP_FILE } from './SitemapManager.js';
import FileResource from './resources/File.js';
import Resource from './resources/Resource.js';

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

const ROBOTS_FILE = 'robots.txt';
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
    getManagedPaths(configuration: Configuration): Promise<Resource[]> {
        return Promise.resolve([new FileResource(ROBOTS_FILE, build.bind(null, configuration))]);
    }
}

/**
 * Builds the content of the given file
 * @param configuration 
 * @param _options 
 */
function build(configuration: Configuration, _options: any) {
    let content = configuration.robots.rules
        .map(rule => 'User-agent: ' + rule.userAgent + '\n' +
            rule.crawlers.map(crawler => `${crawler.type}: ${crawler.path}`).join('\n') +
            '\n\n'
        ).join('');

    content += `Sitemap: !BASE_URL!/${SITEMAP_FILE}\n`;
    return Promise.resolve(content);
}