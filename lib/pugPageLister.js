import { getFilesRecursively } from '../lib/utils.js';
import Page from './Page.js';
import * as Path from 'path';
import { readFileSync } from 'fs';
import fm from 'front-matter';

const languageFileRegex = /^(([a-z]{2})\/(.+)|(.+)[.]([a-z]{2}))([.]pug)$/

/**
 * Return a page list based on pug files in the views directory
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @returns {Promise<Page[]>}
 */
export default async function pugPageLister(configuration) {
    const viewsDirPath = Path.join(process.cwd(), configuration.viewsDir);
    const files = await getFilesRecursively(viewsDirPath, true);
    const relativeFiles = files.map(file => Path.relative(viewsDirPath, file));
    const langViews = {};
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
            const sourceFile = Path.join(viewsDirPath, file);
            const fmResult = fm(readFileSync(sourceFile, 'utf8'));
            const path = file.replace(/[.]pug$/, '.html');
            return new Page(
                path,
                file,
                langViews[file] || {},
                {
                    ...fmResult.attributes
                }
            )
        })
}