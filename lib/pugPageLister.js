import { getFilesRecursively } from '../lib/utils.js';
import Page from './Page.js';
import * as Path from 'path';

const languageFileRegex = /^(.+)[.]([a-z]{2})([.]pug)$/

/**
 * Return a page list based on pug files in the views directory
 * @param {import('../config/configurator.js').Configuration} configuration The configuration
 * @returns {Promise<Page[]>}
 */
export default async function pugPageLister(configuration) {
    const viewsDirPath = Path.join(process.cwd(), configuration.viewsDir);
    const files = await getFilesRecursively(viewsDirPath);
    const relativeFiles = files.filter(file => !Path.basename(file).startsWith('.'))
        .map(file => Path.relative(viewsDirPath, file));
    const langViews = {};
    const matchFiles = relativeFiles.map(file => ({
        file,
        match: file.match(languageFileRegex)
    }));
    matchFiles.filter(({ match }) => match)
        .forEach(({ file, match }) => {
            const lang = match[2];
            const f = match[1] + match[3];
            if (!langViews[f]) langViews[f] = {};
            langViews[f][lang] = file;
        });
    return matchFiles.filter(({ match }) => !match)
        .map(({ file }) => {
            const path = file.replace(/[.]pug$/, '.html');
            const title = file.replace(/[.]pug$/, '');
            const description = `${title} page`;
            return new Page(
                path,
                file,
                langViews[file] || {}
            )
        })
}