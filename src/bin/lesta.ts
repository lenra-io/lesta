#!/usr/bin/env node

import Website from '../lib/Website.js'
import { join } from 'path';
import { existsSync } from 'fs';
import { Configurator, defaultConfigurator } from '../config/configurator.js'

const args: string[] = process.argv.slice(2);
const cwd: string = process.cwd();

run(args[0] || 'express');

/**
 * 
 * @param {string} generator 
 */
async function run(generator: string): Promise<void> {
    const customConfPath: string = join(cwd, 'lesta.config.js');
    const customConfigurator: Configurator = existsSync(customConfPath) ? await import(customConfPath) : {};
    const configurator: Configurator = {
        generators: { ...defaultConfigurator.generators, ...(customConfigurator.generators || {}) },
        getConfiguration: customConfigurator.getConfiguration || defaultConfigurator.getConfiguration,
        getManagers: customConfigurator.getManagers || defaultConfigurator.getManagers
    };

    const managers: any = configurator.getManagers();
    const website: Website = new Website(await configurator.getConfiguration(), managers);

    if (!(generator in configurator.generators)) throw new Error(`The '${generator}' generator is not found: ${Object.keys(configurator.generators)}`);
    const gen: any = configurator.generators[generator];
    console.log("Starting generation");
    await website.generate(gen);
    console.log("Website generated");
}