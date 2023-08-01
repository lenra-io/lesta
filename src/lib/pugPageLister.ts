import { getFilesRecursively } from './utils.js'
import Page from './Page.js'
import { join, relative } from 'path';
import { readFileSync } from 'fs';
import fm from 'front-matter';
import { Configuration } from '../config/configurator.js'

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
                }
            )
        })
}