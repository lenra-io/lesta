import express, { Express, Request, Response } from 'express';
import { join } from 'path';
import { Configuration } from '../config/configurator.js';
import PathManager from './PathManager.js';
import { ContentResource } from './resources/ContentResource.js';
import PageLangRedirection from './resources/PageLangRedirection.js';
import { getPathForLang } from './PageManager.js';

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
            let resource;
            for (const m of managers) {
                const resources = await m.getManagedPaths(configuration);
                const managedPaths = resources.map(r => r.path);
                if (managedPaths.includes(path)) {
                    if (manager != null) throw new Error(`The '${path}' path have been found in two resources: ${manager} and ${m}`);
                    manager = m;
                    resource = resources.find(r => r.path === path);
                }
                paths.push(...managedPaths);
            }
            if (!manager) {
                res.sendStatus(404);
                return;
            }
            if (resource instanceof ContentResource) {
                let content = await resource.render(configuration, { paths });
                // Replace server variables
                const baseUrl = `${req.protocol}://${req.headers.host}`;
                const currentUrl = `${baseUrl}${req.originalUrl}`;
                res.send(content
                    .replace(/!DOMAIN!/g, req.headers.host)
                    .replace(/!BASE_URL!/g, baseUrl)
                    .replace(/!CURRENT_URL!/g, currentUrl)
                    .replace(/!IMAGE_URL!/g, `${currentUrl}.jpg`));
            }
            else if (resource instanceof PageLangRedirection) {
                // determine user preferred language
                const lang = req.acceptsLanguages(configuration.languages);
                const translatedPath = getPathForLang(resource.path, lang, configuration.translationStrategy);
                console.log("Redirecting to", translatedPath);
                res.redirect(translatedPath);
            }
            else {
                throw new Error(`Unknown resource type: ${resource}`);
            }
        })

        app.listen(configuration.port, '0.0.0.0', () => {
            console.log(`Website up at http://localhost:${configuration.port}`);
            resolve();
        });
    });
}