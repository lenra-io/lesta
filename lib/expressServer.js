import express from 'express';
import { join } from 'path';
import PathManager from './PathManager.js';

/**
 * Serve a website using express
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {PathManager[]} managers The content managers
 * @returns {Promise<void>} A promise resolved when the server is up
 */
export default function expressServer(configuration, managers) {
    return new Promise((resolve, reject) => {
        const cwd = process.cwd();
        const staticPath = join(cwd, configuration.staticDir);
        
        const app = express();
    
        app.use(express.static(staticPath, { dotfiles: 'allow' }));
    
        app.get('*', async (req, res) => {
            const path = req.path.replace(/^[/]/, '').replace(/^(.+[/])?$/, '$1index.html');
            console.log("Request", path);
            let manager = null;
            const paths = [];
            for (const m of managers) {
                const managedPaths = await b.getManagedPaths(configuration);
                if (managedPaths.includes(path)) {
                    if (manager!=null) throw new Error(`The '${path}' path have been found in two managers`, manager, b);
                    manager = b;
                }
                paths.push.apply(paths, managedPaths);
            }
            if (!manager) {
                res.sendStatus(404);
                return;
            }
            let content = await manager.build(configuration, path, {request: req, paths});
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