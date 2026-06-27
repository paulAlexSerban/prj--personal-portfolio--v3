import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Tags we allow through after markdown compilation. Covers GFM output
// (headings, lists, tables, code blocks, blockquotes) plus our cloze/math spans.
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
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

marked.setOptions({ gfm: true, breaks: false });

/** Replace Anki-style cloze deletions. Hidden until `reveal`. */
function renderCloze(html: string, reveal: boolean): string {
  return html.replace(/\{\{c\d+::([^}]+)\}\}/g, (_, inner) =>
    reveal ? `<b class="cloze-filled">${inner}</b>` : `<span class="cloze-blank">[…]</span>`,
  );
}

/** Lightweight inline-math rendering (`$x$` → italic serif). Real KaTeX is a future phase. */
function renderMath(html: string): string {
  return html.replace(/\$([^$]+)\$/g, (_, m) => `<i class="inline-math">${m}</i>`);
}

/**
 * Renders a markdown string to sanitized HTML.
 *
 * Content (question stems, explanations/answers) is authored as **markdown**
 * (and will move to MDX). Pipeline: markdown → HTML (marked, GFM) → cloze/math
 * substitution → DOMPurify sanitize. The `html` prop name is kept for API
 * stability but the input is markdown.
 */
export function CardRenderer({
  html,
  reveal = true,
  dropcap = false,
  inline = false,
  className = "",
}: {
  html: string;
  reveal?: boolean;
  dropcap?: boolean;
  /** Render as inline markdown (no block <p> wrapping) — for short labels. */
  inline?: boolean;
  className?: string;
}) {
  const safe = useMemo(() => {
    const compiled = inline
      ? (marked.parseInline(html ?? "", { async: false }) as string)
      : (marked.parse(html ?? "", { async: false }) as string);
    const withCloze = renderMath(renderCloze(compiled, reveal));
    return DOMPurify.sanitize(withCloze, { ALLOWED_TAGS, ALLOWED_ATTR });
  }, [html, reveal, inline]);

  if (inline) {
    return (
      <span
        className={`md-content md-inline ${className}`}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <div
      className={`md-content ${dropcap ? "dropcap" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
