import { marked } from 'marked';
import type { TokenizerAndRendererExtension } from 'marked';
import { sanitizeHtml } from './sanitize.ts';

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const blockMath: TokenizerAndRendererExtension = {
    name: 'blockMath',
    level: 'block',
    start(src) {
        return src.indexOf('$$');
    },
    tokenizer(src) {
        const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (match) return { type: 'blockMath', raw: match[0], text: match[1].trim() };
        return undefined;
    },
    renderer(token) {
        return `<div class="math math-block">${escapeHtml(token.text as string)}</div>`;
    },
};

const inlineMath: TokenizerAndRendererExtension = {
    name: 'inlineMath',
    level: 'inline',
    start(src) {
        const i = src.indexOf('$');
        return i < 0 ? undefined : i;
    },
    tokenizer(src) {
        const match = /^\$(?!\$)((?:\\.|[^$\\])+?)\$(?!\d)/.exec(src);
        if (match && match[1].trim().length > 0) {
            return { type: 'inlineMath', raw: match[0], text: match[1] };
        }
        return undefined;
    },
    renderer(token) {
        return `<span class="math math-inline">${escapeHtml(token.text as string)}</span>`;
    },
};

marked.use({ gfm: true, breaks: false, extensions: [blockMath, inlineMath] });

function renderCloze(html: string, reveal: boolean): string {
    return html.replace(/\{\{c\d+::([^}]+)\}\}/g, (_, inner) => (reveal ? `<b class="cloze-filled">${inner}</b>` : `<span class="cloze-blank">[…]</span>`));
}

export interface CompileMarkdownOptions {
    inline?: boolean;
    reveal?: boolean;
}

/** Compile markdown (post-MDX-preprocess) to sanitized HTML. */
export function compileMarkdown(src: string, opts: CompileMarkdownOptions = {}): string {
    const { inline = false, reveal = true } = opts;
    const compiled = inline ? (marked.parseInline(src ?? '', { async: false }) as string) : (marked.parse(src ?? '', { async: false }) as string);
    const withCloze = renderCloze(compiled, reveal);
    return sanitizeHtml(withCloze);
}
