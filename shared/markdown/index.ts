import { compileMarkdown, type CompileMarkdownOptions } from './src/markdown.ts';
import { detectContentFormat, preprocessMdx } from './src/mdx.ts';

export interface CompileContentOptions extends CompileMarkdownOptions {
    /** When true, run MDX component preprocessing before markdown compile. Auto-detected when omitted. */
    mdx?: boolean;
}

/**
 * Full content pipeline: optional MDX preprocess → markdown → cloze → sanitize.
 * Used at export time (Node) and as a client fallback when precompiled HTML is absent.
 */
export function compileContent(src: string, opts: CompileContentOptions = {}): string {
    const useMdx = opts.mdx ?? detectContentFormat(src) === 'mdx';
    const preprocessed = useMdx ? preprocessMdx(src) : src;
    return compileMarkdown(preprocessed, opts);
}

export { detectContentFormat, preprocessMdx } from './src/mdx.ts';
export { compileMarkdown, type CompileMarkdownOptions } from './src/markdown.ts';
export { sanitizeHtml } from './src/sanitize.ts';
export { ALLOWED_ATTR, ALLOWED_TAGS } from './src/allowlist.ts';
export { extractRelativeImagePaths, questionAssetUrl, rewriteImagePaths } from './src/assets.ts';
