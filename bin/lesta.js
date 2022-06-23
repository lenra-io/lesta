#! /usr/bin/env node

import expressServer from '../lib/ExpressServer.js';
import nginxGenerator from '../lib/nginxGenerator.js';
import Website from '../lib/Website.js';

const args = process.argv.slice(2);

run(args[0] || serve);

async function run(command) {
    const website = new Website(new PageBuilder(), new RobotsBuilder(), new SitemapBuilder());

    console.log("Starting generation");
    switch (command) {
        case 'express':
            await website.generate(expressServer);
            break;
        case 'nginx':
            await website.generate(nginxGenerator);
            break;
        default:
            return console.log("Not managed command", command);
    }
    buildPromise.then(() => console.log("Website generated"));
}
