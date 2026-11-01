import { compileMarkdown, type CompileMarkdownOptions } from './src/markdown.ts';
import { detectContentFormat, preprocessMdx } from './src/mdx.ts';
import { browserSanitizeHtml } from './src/sanitize-browser.ts';
import { setSanitizer } from './src/sanitize.ts';

setSanitizer(browserSanitizeHtml);

export interface CompileContentOptions extends CompileMarkdownOptions {
    /** When true, run MDX component preprocessing before markdown compile. Auto-detected when omitted. */
    mdx?: boolean;
}

/**
 * Browser entry. Same API as `index.ts`, but sanitizing uses the page DOM
 * and never imports `node:module` or jsdom.
 */
export function compileContent(src: string, opts: CompileContentOptions = {}): string {
    const useMdx = opts.mdx ?? detectContentFormat(src) === 'mdx';
    const preprocessed = useMdx ? preprocessMdx(src) : src;
    return compileMarkdown(preprocessed, opts);
}

export { detectContentFormat, preprocessMdx } from './src/mdx.ts';
export { MARKDOWN_COMPILER_VERSION, compileMarkdown, type CompileMarkdownOptions } from './src/markdown.ts';
export { sanitizeHtml } from './src/sanitize.ts';
export { ALLOWED_ATTR, ALLOWED_TAGS } from './src/allowlist.ts';
export { extractRelativeImagePaths, questionAssetUrl, rewriteImagePaths } from './src/assets.ts';
