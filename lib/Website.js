import { getConfiguration } from '../src/utils.js';
import Builder from './Builder.js';
import expressServer from './ExpressServer.js';
import nginxGenerator from './nginxGenerator.js';
import Page from './Page.js';
import PageBuilder from './PageBuilder.js';
import RobotsBuilder from './RobotsBuilder.js';
import SitemapBuilder from './SitemapBuilder.js';

/**
 * @callback server Serve a website
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {Builder[]} builders The elements builders
 * @returns {Promise<void>} A promise resolved when the server is up
 */


export default class Website {
    #_inited;
    #_initing;
    /**
     * @param {Builder[]} builders The website elements builders
     */
    constructor(...builders) {
        this.#_inited = false;
        this.#_initing = false;
        this.builders = builders;
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
     * Generates a website with a given server
     * @param {server} server The website server
     */
    async generate(server) {
        if (!this.#_inited) await this.init();
        await server(this.configuration, this.builders);
    }
}