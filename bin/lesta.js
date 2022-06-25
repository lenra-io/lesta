#! /usr/bin/env node

import * as defaultConfigurator from '../config/configurator.js';
import expressServer from '../lib/ExpressServer.js';
import nginxBuilder from '../lib/nginxBuilder.js';
import PageManager from '../lib/PageManager.js';
import RobotsManager from '../lib/RobotsManager.js';
import SitemapManager from '../lib/SitemapManager.js';
import Website from '../lib/Website.js';

const args = process.argv.slice(2);

run(args[0] || 'express');

async function run(generator) {
    // TODO: import lesta.conf.js that can override the elements
    const managers = getManagers();
    const website = new Website(managers);

    if (!generator in generators) throw new Error(`The '${generator}' generator is not found`, Object.keys(generators));
    const gen = generators[generator];
    console.log("Starting generation");
    await website.generate(gen);
    buildPromise.then(() => console.log("Website generated"));
}
