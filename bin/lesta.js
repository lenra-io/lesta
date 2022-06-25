#! /usr/bin/env node

import * as defaultConfigurator from '../config/configurator.js';
import Website from '../lib/Website.js';
import { join } from 'path';

const args = process.argv.slice(2);

run(args[0] || 'express');

async function run(generator) {
    // import lesta.conf.js that can override the elements
    const customConfigurator = await import(join(cwd, 'lesta.configurator.js')).catch({});
    const configurator = {...defaultConfigurator};

    // TODO: merge configurations

    const managers = configurator.getManagers();
    const website = new Website(managers);

    if (!generator in configurator.generators) throw new Error(`The '${generator}' generator is not found`, Object.keys(configurator.generators));
    const gen = configurator.generators[generator];
    console.log("Starting generation");
    await website.generate(gen);
    buildPromise.then(() => console.log("Website generated"));
}
