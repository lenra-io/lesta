import express, { Express, Request, Response } from 'express';
import { join } from 'path';
import PathManager from './PathManager';
import { Configuration } from '../config/configurator.js';

/**
 * Serve a website using express
 * @param configuration The configuration
 * @param managers The content managers
 * @returns A promise resolved when the server is up
 */
export default function expressServer(configuration: Configuration, managers: PathManager[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const cwd = process.cwd();
        const staticPath = join(cwd, configuration.staticDir);

        const app: Express = express();

        app.use(express.static(staticPath, { dotfiles: 'allow' }));

        app.get('*', async (req: Request, res: Response) => {
            const path = req.path.replace(/^\//, '').replace(/^(.+\/)?$/, '$1index.html');
            console.log("Request", path);
            let manager: PathManager | null = null;
            const paths: string[] = [];
            for (const m of managers) {
                const managedPaths = await m.getManagedPaths(configuration);
                if (managedPaths.includes(path)) {
                    if (manager != null) throw new Error(`The '${path}' path have been found in two managers: ${manager} and ${m}`);
                    manager = m;
                }
                paths.push(...managedPaths);
            }
            if (!manager) {
                res.sendStatus(404);
                return;
            }
            let content = await manager.build(configuration, path, { paths });
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
            console.log(`Website up at http://localhost:${configuration.port}`);
            resolve();
        });
    });
}