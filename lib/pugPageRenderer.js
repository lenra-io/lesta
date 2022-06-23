import * as pug from 'pug';
import * as Path from 'path';
import Page from './Page.js';
import { existsSync } from 'fs';

/**
 * Render a pug website page
 * @param {import('../src/utils.js').Configuration} configuration The configuration
 * @param {Page} page The page
 * @param {string} language The page language
 * @param {any} translation The language translation
 * @param {any} _renderOptions The page render options. Not used
 * @returns {Promise<string>}
 */
export default function pugPageRenderer(configuration, page, language, translation, _renderOptions) {
    return new Promise((resolve, reject) => {
        const viewsDirPath = Path.join(process.cwd(), configuration.viewsDir);
        const basicPath = page.path.replace(/[.]html$/, '');
        if (!('page' in translation)) translation.page = {};
        const pageTranslation = translation.page[basicPath] || {};
        const options = { ...translation, currentPage: { ...page, ...pageTranslation, basicPath }, fileExists: existsSync };
        pug.renderFile(Path.join(viewsDirPath, page.getView(language)), options, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });
}