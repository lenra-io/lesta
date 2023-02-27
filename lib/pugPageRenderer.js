import * as pug from 'pug';
import Page from './Page.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { mergeDeep } from './utils.js';
import fm from 'front-matter';

/**
 * Render a pug website page
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @param {Page} page The page
 * @param {string} language The page language
 * @param {any} translation The language translation
 * @param {any} renderOptions The page render options. Not used
 * @returns {Promise<string>}
 */
export default function pugPageRenderer(configuration, page, language, translation, renderOptions) {
    return new Promise((resolve, reject) => {
        const viewsDirPath = join(process.cwd(), configuration.viewsDir);
        const basicPath = page.path.replace(/[.]html$/, '');
        if (!('page' in translation)) translation.page = {};
        const pageTranslation = mergeDeep({},
            translation.page[basicPath],
            page.properties,
            (page.properties && page.properties.translations && language in page.properties.translations) ? page.properties.translations[language] : {}
        );
        const sourceFile = join(viewsDirPath, page.getView(language));
        const fmResult = fm(readFileSync(sourceFile, 'utf8'));
        const options = mergeDeep({filename: sourceFile}, renderOptions, translation, { currentPage: { path: page.path, href: page.href, ...pageTranslation, basicPath }, fileExists: existsSync });
        pug.render(fmResult.body, options, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });
}