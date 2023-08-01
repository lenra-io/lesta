import { Configuration } from '../config/configurator.js'
import PathManager from './PathManager.js'

/**
 * Serve a website
 * @param configuration The configuration
 * @param managers The elements managers
 * @returns A promise resolved when the generation is done (or up for a server)
 */
export type generator = (configuration: Configuration, managers: PathManager[]) => Promise<void>;

export default class Website {
    /**
     * @param {import('../config/configurator').Configuration} configuration The website configuration
     * @param {PathManager[]} managers The website elements managers
     */
    constructor(
        public configuration: import('../config/configurator').Configuration,
        public managers: PathManager[]
    ) { }

    /**
     * Generates a website with a given generator
     * @param {generator} generator The website generator
     */
    async generate(generator: generator) {
        await generator(this.configuration, this.managers);
    }
}