import fm from 'front-matter';
import { existsSync, readFileSync } from 'fs';
import i18next from 'i18next';
import { join, relative } from 'path';
import * as pug from 'pug';
import { Configuration } from '../config/configurator.js';
import { RenderOptions } from './PageManager.js';
import Page from './resources/Page.js';
import { getFilesRecursively, mergeDeep } from './utils.js';

const languageFileRegex = /^(([a-z]{2})\/(.+)|(.+)[.]([a-z]{2}))([.]pug)$/;

/**
 * Return a page list based on pug files in the views directory
 * @param {Configuration} configuration The configuration
 * @returns {Promise<Page[]>}
 */
export default async function pugPageLister(configuration: Configuration): Promise<Page[]> {
    const viewsDirPath: string = join(process.cwd(), configuration.viewsDir);
    const files: string[] = await getFilesRecursively(viewsDirPath, true);
    const relativeFiles: string[] = files.map(file => relative(viewsDirPath, file));
    const langViews: { [key: string]: { [key: string]: string } } = {};
    const matchFiles = relativeFiles.map(file => ({
        file,
        match: file.match(languageFileRegex)
    }));
    matchFiles.filter(({ match }) => match)
        .forEach(({ file, match }) => {
            const lang = match[2] || match[5];
            const f = (match[3] || match[4]) + match[6];
            if (!langViews[f]) langViews[f] = {};
            langViews[f][lang] = file;
        });
    return matchFiles.filter(({ match }) => !match)
        .map(({ file }) => {
            const sourceFile: string = join(viewsDirPath, file);
            const fmResult: any = fm(readFileSync(sourceFile, 'utf8'));
            const path: string = file.replace(/[.]pug$/, '.html');
            return new Page(
                path,
                file,
                langViews[file] || {},
                {
                    ...fmResult.attributes
                },
                pugPageRenderer
            )
        })
}


/**
 * Render a pug website page
 * @param configuration The configuration
 * @param page The page
 * @param renderOptions The page render options. Not used
 * @returns
 */
function pugPageRenderer(page: Page, configuration: Configuration, renderOptions: RenderOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        const viewsDirPath = join(process.cwd(), configuration.viewsDir);
        const sourceFile = join(viewsDirPath, page.view);
        const fmResult = fm(readFileSync(sourceFile, 'utf8'));
        const options = mergeDeep(
            {
                filename: sourceFile
            },
            renderOptions,
            {
                fileExists: existsSync,
                t: i18next.t
            }
        );
        pug.render(fmResult.body, options, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });
}