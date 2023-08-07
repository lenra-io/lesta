import { Configuration } from "../../config/configurator.js";
import { RenderOptions } from "../PageManager.js";
import Resource from "./Resource.js";

/**
 * Render a website content resource
 * @param resource The resource to render
 * @param configuration The configuration
 * @param renderOptions The page render options
 * @returns
 */
export type contentRenderer = (resource: ContentResource, configuration: Configuration, options: RenderOptions) => Promise<string>;

export abstract class ContentResource extends Resource {
    renderer: contentRenderer;

    constructor(path: string, renderer: contentRenderer) {
        super(path);
        this.renderer = renderer;
    }

    render(configuration: Configuration, options: RenderOptions): Promise<string> {
        return this.renderer(this, configuration, options);
    }
}