import { minify } from "minify";
import { relative } from "path";

export async function cssMinify(file) {
    return Promise.resolve(minify.css(`@import "${relative(process.cwd(), file)}";`, {
        css: {
            rebase: false
        },
        img: {
            maxSize: 1
        }
    }));
}