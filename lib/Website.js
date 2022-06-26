import PathManager from './PathManager.js';

/**
 * @callback generator Serve a website
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @param {PathManager[]} managers The elements managers
 * @returns {Promise<void>} A promise resolved when the generation is done (or up for a server)
 */


export default class Website {
    /**
     * @param {import('../config/configurator.js').Configuration} configuration The website configuration
     * @param {PathManager[]} managers The website elements managers
     */
    constructor(configuration, managers) {
        this.configuration = configuration;
        this.managers = managers;
    }

    /**
     * Generates a website with a given generator
     * @param {generator} generator The website generator
     */
    async generate(generator) {
        await generator(this.configuration, this.managers);
    }
}