import { getConfiguration } from '../src/utils.js';
import PathManager from './PathManager.js';

/**
 * @callback generator Serve a website
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {PathManager[]} managers The elements managers
 * @returns {Promise<void>} A promise resolved when the generation is done (or up for a server)
 */


export default class Website {
    #_inited;
    #_initing;
    /**
     * @param {PathManager[]} managers The website elements managers
     */
    constructor(managers) {
        this.#_inited = false;
        this.#_initing = false;
        this.managers = managers;
    }

    async init() {
        if (this.#_inited) throw new Error("The website has already been inited");
        if (this.#_initing) throw new Error("The website is already initing");
        this.#_initing = true;
        this.configuration = await getConfiguration();
        this.#_inited = true;
        this.#_initing = false;
    }

    /**
     * Generates a website with a given generator
     * @param {generator} generator The website generator
     */
    async generate(generator) {
        if (!this.#_inited) await this.init();
        await generator(this.configuration, this.managers);
    }
}