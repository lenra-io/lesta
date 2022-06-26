#! /usr/bin/env node

import * as defaultConfigurator from '../config/configurator.js';
import Website from '../lib/Website.js';
import { join } from 'path';

const args = process.argv.slice(2);

run(args[0] || 'express');

async function run(generator) {
    const customConfigurator = await import(join(cwd, 'lesta.conf.js')).catch({});
    const configurator = Object.fromEntries(
        Object.keys(defaultConfigurator)
            .map(key => {
                value = key in customConfigurator ? customConfigurator[key] : defaultConfigurator[key];
                if (key=='generators') value = {...defaultConfigurator.generators, ...(customConfigurator.generators || {})};
                return [key, value]
            })
    );

    const managers = configurator.getManagers();
    const website = new Website(await configurator.getConfiguration(), managers);

    if (!generator in configurator.generators) throw new Error(`The '${generator}' generator is not found`, Object.keys(configurator.generators));
    const gen = configurator.generators[generator];
    console.log("Starting generation");
    await website.generate(gen);
    buildPromise.then(() => console.log("Website generated"));
}
