import * as pug from 'pug';
import Page from './resources/Page.js'
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { mergeDeep } from './utils.js'
import fm from 'front-matter';
import i18next from 'i18next';
import { Configuration } from '../config/configurator.js'

/**
 * Render a pug website page
 * @param {Configuration} configuration The configuration
 * @param {Page} page The page
 * @param {any} translation The language translation
 * @param {any} renderOptions The page render options. Not used
 * @returns {Promise<string>}
 */
export default function pugPageRenderer(configuration: Configuration, page: Page, renderOptions: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const viewsDirPath = join(process.cwd(), configuration.viewsDir);
        const sourceFile = join(viewsDirPath, page.getView(renderOptions.language));
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