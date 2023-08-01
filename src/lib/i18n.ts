import { readdir } from 'fs/promises';
import { join } from 'path';
import i18next from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { loadJsonFile } from './utils';
import { Configuration } from '../config/configurator.js';

const langFileRegex = /^([a-z]{2})[.]json$/;
export const defaultNamespace = 'translation';

/**
 * @typedef strategy
 * @property {RegExp} findLanguageRegex
 * @property {number} findLanguagePosition
 */

/**
 * @type {Record<string, strategy>}
 */
const translationStrategies: Record<string, any> = {
    suffix: {
        findLanguageRegex: /^(.+)[.]([a-z]{2})([.]html)$/,
        findLanguagePosition: 2
    },
    subdir: {
        findLanguageRegex: /^([a-z]{2})\/(.+)([.]html)$/,
        findLanguagePosition: 1
    }
};

export async function init(configuration: Configuration): Promise<void> {
    const defaultLanguage = configuration.languages[0];
    await i18next
        .use(resourcesToBackend((language: string, namespace: string) => {
            const path = join(configuration.i18nDir, `${language}/${namespace}.json`);
            console.log("Loading language file", path, "for language", language, "and namespace", namespace, "...");
            return loadJsonFile(path);
        }))
        .init({
            fallbackLng: defaultLanguage,
            // debug: true,
            supportedLngs: configuration.languages,
            defaultNS: defaultNamespace,
            ns: await getManagedNamespaces(configuration.i18nDir, defaultLanguage),
            saveMissing: true,
            updateMissing: true,
            appendNamespaceToMissingKey: true,
            saveMissingTo: 'current',
            missingKeyHandler: (lngs: string[], namespace: string, key: string, res: any) => {
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
export async function getManagedLanguages(i18nDir: string): Promise<string[]> {
    return readdir(i18nDir)
        .then(files => files
            .map(file => file.match(langFileRegex))
            .filter(match => match)
            .map(match => match[1])
        );
}

/**
 * Get the managed languages
 * @param {string} i18nDir The translation files base directory
 * @returns {Promise<Array<string>>}
 */
export async function getManagedNamespaces(i18nDir: string, language: string): Promise<string[]> {
    return readdir(join(i18nDir, language))
        .then(files => files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace(/[.]json$/, ''))
        );
}

/**
 * Extract initial path and language from a request path
 * @param {Configuration} configuration 
 * @param {string} path The request path
 * @returns {{path: string, language: (string | undefined)}}
 */
export function extractPathLanguage(configuration: Configuration, path: string): { path: string, language?: string } {
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