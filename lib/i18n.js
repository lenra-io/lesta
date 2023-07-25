import { readdir } from 'fs/promises';
import * as Path from 'path';
import { loadJsonFile, mergeDeep } from './utils.js';

const langFileRegex = /^([a-z]{2})[.]json$/;
export const commonConf = 'common';

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
 * Load all the translations managed
 * @param {string} i18nDir The translation files base directory
 * @param {string[]} languages The managed languages
 * @returns {Promise<Map.<string, any>>}
 */
export async function loadTranslations(i18nDir, languages) {
    const map = languages.map(lang => loadTranslation(i18nDir, lang)
        .then(t => ([lang, t]))
    );
    return new Map(await Promise.all(map));
}

/**
 * Load the defined translations for a language
 * @param {string} i18nDir The translation files base directory
 * @param {string} lang The translations language
 * @returns The translation map
 */
export async function loadTranslation(i18nDir, lang) {
    if (!lang) return {}
    return loadJsonFile(Path.join(i18nDir, `${lang}.json`)).catch(e => ({}));
}

/**
 * Extract initial path and language from a request path
 * @param {import('./utils.js').Configuration} configuration 
 * @param {string} path The request path
 * @returns {{path: string, language: (string | undefined)}}
 */
export function extractPathLanguage(configuration, path) {
    const defaultReturn = { path };
    console.log("translationStrategy", configuration.translationStrategy);
    if (!configuration.translationStrategy) return defaultReturn;
    const strategy = translationStrategies[configuration.translationStrategy];
    console.log("strategy", strategy);
    if (!strategy) throw new Error(`Not managed strategy '${configuration.translationStrategy}'`);
    const match = path.match(strategy.findLanguageRegex);
    console.log("match", match);
    if (!match) return defaultReturn;
    const parts = match.slice(1);
    console.log("parts", parts);
    let [language] = parts.splice(strategy.findLanguagePosition - 1, 1);
    return {
        path: parts.join(''),
        language
    };
}

/**
 * Load all the translations managed and merge it with the common one
 * @param {string} i18nDir The translation files base directory
 * @param {string[]} languages The managed languages
 * @returns {Promise<Map.<string, any>>}
 */
export async function getMergedTranslations(i18nDir, languages) {
    const common = await loadTranslation(i18nDir, commonConf);
    const map = languages.map(lang => loadTranslation(i18nDir, lang)
        .then(t => mergeTranslation(languages, lang, common, t))
        .then(t => ([lang, t]))
    );
    map.push([commonConf, mergeTranslation(languages, undefined, common, {})]);
    return new Map(await Promise.all(map));
}

/**
 * Merge translation objects
 * @param {string[]} languages The language list
 * @param {string} language The current language
 * @param {*} common The common properties
 * @param {*} translation The language specific translation
 * @returns 
 */
export function mergeTranslation(languages, language, common, translation) {
    return mergeDeep(
        {},
        common,
        translation,
        {
            language,
            languages,
            otherLanguages: languages.filter(l => l != language)
        }
    );
}