import { compileMarkdown, type CompileMarkdownOptions } from './src/markdown.ts';
import { detectContentFormat, preprocessMdx } from './src/mdx.ts';
import { nodeSanitizeHtml } from './src/sanitize-node.ts';
import { setSanitizer } from './src/sanitize.ts';

setSanitizer(nodeSanitizeHtml);

export interface CompileContentOptions extends CompileMarkdownOptions {
    /** When true, run MDX component preprocessing before markdown compile. Auto-detected when omitted. */
    mdx?: boolean;
}

/**
 * Full content pipeline: optional MDX preprocess -> markdown -> cloze -> sanitize.
 * Used at export time (Node). The browser entry installs the page-DOM sanitizer instead.
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
