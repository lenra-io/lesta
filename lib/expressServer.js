import express from 'express';
import { join } from 'path';
import Builder from './Builder.js';

/**
 * Serve a website using express
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {Builder[]} builders The content builders
 * @returns {Promise<void>} A promise resolved when the server is up
 */
export default function expressServer(configuration, builders) {
    return new Promise((resolve, reject) => {
        const cwd = process.cwd();
        const staticPath = join(cwd, configuration.staticDir);
        
        const app = express();
    
        app.use(express.static(staticPath, { dotfiles: 'allow' }));
    
        app.get('*', async (req, res) => {
            const path = req.path.replace(/^[/]/, '').replace(/^(.+[/])?$/, '$1index.html');
            console.log("Request", path);
            let builder = null;
            const paths = [];
            for (const b of builders) {
                const managedPaths = await b.getManagedPaths(configuration);
                if (managedPaths.includes(path)) {
                    if (builder!=null) throw new Error(`The '${path}' path have been found in two builders`, builder, b);
                    builder = b;
                }
                paths.push.apply(paths, managedPaths);
            }
            if (!builder) {
                res.sendStatus(404);
                return;
            }
            let content = await builder.build(configuration, path, {request: req, paths});
            // Replace server variables
            const baseUrl = `${req.protocol}://${req.headers.host}`;
            const currentUrl = `${baseUrl}${req.originalUrl}`;
            res.send(content
                .replace(/!DOMAIN!/g, req.headers.host)
                .replace(/!BASE_URL!/g, baseUrl)
                .replace(/!CURRENT_URL!/g, currentUrl)
                .replace(/!IMAGE_URL!/g, `${currentUrl}.jpg`));
        })
    
        app.listen(configuration.port, '0.0.0.0', () => {
            console.log(`Website up at http://localhost:${this.configuration.port}`);
            resolve();
        });
    });
}