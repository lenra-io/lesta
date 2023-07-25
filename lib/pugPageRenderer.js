import * as pug from 'pug';
import Page from './Page.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { mergeDeep } from './utils.js';
import fm from 'front-matter';
import i18next from 'i18next';

/**
 * Render a pug website page
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @param {Page} page The page
 * @param {string} language The page language
 * @param {any} translation The language translation
 * @param {any} renderOptions The page render options. Not used
 * @returns {Promise<string>}
 */
export default function pugPageRenderer(configuration, page, language, renderOptions) {
    return new Promise((resolve, reject) => {
        const viewsDirPath = join(process.cwd(), configuration.viewsDir);
        const basicPath = page.path.replace(/[.]html$/, '');
        const sourceFile = join(viewsDirPath, page.getView(language));
        const fmResult = fm(readFileSync(sourceFile, 'utf8'));
        const options = mergeDeep({ filename: sourceFile }, renderOptions, { currentPage: { path: page.path, href: page.href, basicPath }, language, languages: configuration.languages, fileExists: existsSync, t: i18next.t });
        pug.render(fmResult.body, options, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });
}