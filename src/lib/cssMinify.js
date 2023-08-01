import { minify } from "minify";

export async function cssMinify() {
    return Promise.resolve(minify.css(`@import "${relative(process.cwd(), file)}";`, {
        css: {
            rebase: false
        },
        img: {
            maxSize: 1
        }
    }));
}