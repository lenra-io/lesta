const fs = require('fs-extra');
const Path = require('path');

/**
 * Get the view file for the given path and language
 * @param {string} viewsDir The views base directory
 * @param {string} path The view path
 * @param {string?} lang The language for specific views
 * @returns {string?}
 */
function getViewFile(viewsDir, path, lang) {
    let p;
    if (lang) {
        p = Path.join(viewsDir, `${path}.${lang}.pug`);
        if (fs.existsSync(p)) return p;
    }
    p = Path.join(viewsDir, `${path}.pug`);
    if (fs.existsSync(p)) return p;
    return null;
}

exports.getViewFile = getViewFile;