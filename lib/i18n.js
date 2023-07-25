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
            // saveMissing: true,
        });
    i18next.on('missingKey', function (lngs, namespace, key, res) { console.log(key) });
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

// /**
//  * Load all the translations managed
//  * @param {string} i18nDir The translation files base directory
//  * @param {string[]} languages The managed languages
//  */
// export async function loadTranslations(i18nDir, languages) {
//     for (const lang of languages) {
//         await loadTranslation(i18nDir, lang)
//     }
// }

// /**
//  * Load the defined translations for a language
//  * @param {string} i18nDir The translation files base directory
//  * @param {string} lang The translations language
//  */
// export async function loadTranslation(i18nDir, lang, namespace = defaultNamespace) {
//     if (!lang) return;
//     i18next.addResourceBundle(lang, namespace, await loadJsonFile(Path.join(i18nDir, `${lang}/${namespace}.json`)).catch(e => ({})), false, true);
// }

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
