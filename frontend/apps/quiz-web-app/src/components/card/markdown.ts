import { marked } from "marked";
import type { TokenizerAndRendererExtension } from "marked";
import DOMPurify from "dompurify";

// Tags allowed through after markdown compilation. Covers GFM output
// (headings, lists, tables, code blocks, blockquotes) plus our cloze/math
// placeholders. KaTeX/highlight.js output is injected into the *already
// sanitized* DOM at runtime (see richText.ts), so their rich markup never
// passes through DOMPurify here.
const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "del",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "span",
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Math placeholders. We only *tokenize* here and emit elements carrying the raw
// TeX as text content; the heavy KaTeX render happens lazily at runtime. Using a
// tokenizer (rather than post-processing HTML) prevents marked from mangling TeX
// internals like `_`, `*`, or `\` as markdown.
const blockMath: TokenizerAndRendererExtension = {
  name: "blockMath",
  level: "block",
  start(src) {
    return src.indexOf("$$");
  },
  tokenizer(src) {
    const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
    if (match) {
      return { type: "blockMath", raw: match[0], text: match[1].trim() };
    }
    return undefined;
  },
  renderer(token) {
    return `<div class="math math-block">${escapeHtml(token.text as string)}</div>`;
  },
};

const inlineMath: TokenizerAndRendererExtension = {
  name: "inlineMath",
  level: "inline",
  start(src) {
    const i = src.indexOf("$");
    return i < 0 ? undefined : i;
  },
  tokenizer(src) {
    // `$…$` with no `$$`, no leading/trailing whitespace inside, and the closing
    // `$` not immediately followed by a digit (avoids matching prices like `$5`).
    const match = /^\$(?!\$)((?:\\.|[^$\\])+?)\$(?!\d)/.exec(src);
    if (match && match[1].trim().length > 0) {
      return { type: "inlineMath", raw: match[0], text: match[1] };
    }
    return undefined;
  },
  renderer(token) {
    return `<span class="math math-inline">${escapeHtml(token.text as string)}</span>`;
  },
};

marked.use({ gfm: true, breaks: false, extensions: [blockMath, inlineMath] });

/** Replace Anki-style cloze deletions. Hidden until `reveal`. */
function renderCloze(html: string, reveal: boolean): string {
  return html.replace(/\{\{c\d+::([^}]+)\}\}/g, (_, inner) =>
    reveal ? `<b class="cloze-filled">${inner}</b>` : `<span class="cloze-blank">[…]</span>`,
  );
}

export interface CompileOptions {
  /** Render as inline markdown (no block `<p>` wrapping) — for short labels. */
  inline?: boolean;
  /** Whether cloze deletions are revealed. */
  reveal?: boolean;
}

/**
 * Compile a markdown string to sanitized HTML.
 *
 * Pipeline: markdown → HTML (marked, GFM + math placeholders) → cloze
 * substitution → DOMPurify sanitize. Math and code blocks are emitted as inert
 * placeholders; {@link enhance} renders them lazily at runtime.
 */
export function compileMarkdown(src: string, opts: CompileOptions = {}): string {
  const { inline = false, reveal = true } = opts;
  const compiled = inline
    ? (marked.parseInline(src ?? "", { async: false }) as string)
    : (marked.parse(src ?? "", { async: false }) as string);
  const withCloze = renderCloze(compiled, reveal);
  return DOMPurify.sanitize(withCloze, { ALLOWED_TAGS, ALLOWED_ATTR });
}
