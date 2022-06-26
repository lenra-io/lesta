import { existsSync, statSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

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
  const promises = files.map(f => join(dir, f))
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