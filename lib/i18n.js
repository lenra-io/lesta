import { readdir } from 'fs/promises';
import * as Path from 'path';
import i18next from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { loadJsonFile } from './utils.js';

const langFileRegex = /^([a-z]{2})[.]json$/;
export const defaultNamespace = 'translation';

/**
 * @typedef strategy
 * @property {RegExp} findLanguageRegex
 * @property {number} findLanguagePosition
 */

/**
 * @type {Object.<string, strategy>}
 */
const translationStrategies = {
    suffix: {
        findLanguageRegex: /^(.+)[.]([a-z]{2})([.]html)$/,
        findLanguagePosition: 2
    },
    subdir: {
        findLanguageRegex: /^([a-z]{2})\/(.+)([.]html)$/,
        findLanguagePosition: 1
    }
};

export async function init(configuration) {
    await i18next
        .use(resourcesToBackend((language, namespace) => {
            const path = Path.join(configuration.i18nDir, `${language}/${namespace}.json`);
            return loadJsonFile(path);
        }))
        .init({
            lng: 'en',
            fallbackLng: 'en',
            // debug: true,
            supportedLngs: configuration.languages,
            defaultNS: defaultNamespace,
            saveMissing: true,
            updateMissing: true,
            appendNamespaceToMissingKey: true,
            saveMissingTo: 'current',
            missingKeyHandler: (lngs, namespace, key, res) => {
                console.log(`Missing key '${key}' for language '${lngs[0]}' in namespace '${namespace}'`);
                throw new Error(`Missing key '${key}' for language '${lngs[0]}' in namespace '${namespace}'`);
            }
        });
}

/**
 * Get the managed languages
 * @param {string} i18nDir The translation files base directory
 * @returns {Promise<Array<string>>}
 */
export async function getManagedLanguages(i18nDir) {
    return readdir(i18nDir)
        .then(files => files
            .map(file => file.match(langFileRegex))
            .filter(match => match)
            .map(match => match[1])
        );
}

/**
 * Extract initial path and language from a request path
 * @param {import('./utils.js').Configuration} configuration 
 * @param {string} path The request path
 * @returns {{path: string, language: (string | undefined)}}
 */
export function extractPathLanguage(configuration, path) {
    const defaultReturn = { path };
    if (!configuration.translationStrategy) return defaultReturn;
    const strategy = translationStrategies[configuration.translationStrategy];
    if (!strategy) throw new Error(`Not managed strategy '${configuration.translationStrategy}'`);
    const match = path.match(strategy.findLanguageRegex);
    if (!match) return defaultReturn;
    const parts = match.slice(1);
    let [language] = parts.splice(strategy.findLanguagePosition - 1, 1);
    return {
        path: parts.join(''),
        language
    };
}
