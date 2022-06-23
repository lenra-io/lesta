import { existsSync, statSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import * as Path from 'path';

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge source objects in a target one.
 * @param target The target of the merge
 * @param ...sources The objects to merge in the target
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      }
      else if (Array.isArray(target[key]) && Array.isArray(source[key])) {
        [].push.apply(target[key], source[key])
      }
      else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * @typedef Configuration
 * @property {string} staticDir The static files base directory. The content of this directory will be copied as it is.
 * @property {string} i18nDir The internationalisation files base directory. The directory can contain a file by managed language (example: 'en.js' for english). It can also contain a 'common.js' file to define properties common to all languages
 * @property {string} viewsDir The view files base directory
 * @property {string} buildDir The build target directory
 * @property {string[]} languages The list of managed languages by priority. The first one is the default language
 * @property {boolean} enableDefaultLanquage Define if the first language is the default. If true, the page path will use this default language. If false, the base path will use the user language priority
 * @property {'suffix' | 'subdir' | null} translationStrategy Define the strategy to manage page translation
 *  * suffix: will add the language as suffix of file name before the extension. For exemple, `index.html` page path for english language will be `index.en.html`
 *  * subdir: will make the pages accessible in a subdirectoriy for the language. For exemple, `index.html` page path for english language will be `en/index.html`
 *  * null: the page path will be the same for all languages
 * @property {integer} port The listen server port
 * @property {import('../lib/RobotsBuilder.js').robotsConfiguration} robots The robots.txt builder configuration
 */

/**
 * Get the merged configuration
 * @returns {Promise<Configuration>}
 */
export async function getConfiguration() {
  const cwd = process.cwd();
  const configPromises = [
    loadJsonFile(new URL('../config/default-config.json', import.meta.url)),
    loadJsonFile(Path.join(cwd, 'package.json'))
      .then(packageContent => packageContent.lswf || {}),
    loadJsonFileIfExists(Path.join(cwd, 'lswf.config.json'))
      .then(cfg => cfg || {})
  ];
  const configs = await Promise.all(configPromises);
  return mergeDeep.apply(null, [{}, ...configs]);
}

export async function loadJsonFile(path) {
  const data = await readFile(path, 'utf8');
  return JSON.parse(data);
}

export async function loadJsonFileIfExists(path) {
  if (!existsSync(path)) return null;
  return await loadJsonFile(path);
}

/**
 * Get all files in the given directory recursively
 * @param {string} dir The directory
 * @returns {Promise<string[]>}
 */
export async function getFilesRecursively(dir) {
  const files = await readdir(dir);
  const promises = files.map(f => Path.join(dir, f))
    .map(p => {
      const stat = statSync(p);
      if (stat.isDirectory())
        return getFilesRecursively(p);
      const ret = [];
      if (stat.isFile())
        ret.push(p);
      return Promise.resolve(ret);
    });
  return (await Promise.all(promises)).flat();
}