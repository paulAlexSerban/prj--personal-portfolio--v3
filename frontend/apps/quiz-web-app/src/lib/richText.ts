// Heavy, lazily-loaded rich-text enhancers. CardRenderer dynamically imports
// this module so KaTeX + highlight.js (and their CSS) are code-split out of the
// initial bundle and only fetched when content actually contains math/code.
// Once fetched they are precached by the PWA service worker for offline use.
import katex from "katex";
import "katex/dist/katex.min.css";
import hljs from "highlight.js/lib/common";

/**
 * Render math placeholders and highlight code blocks inside an already-sanitized
 * DOM subtree. KaTeX and highlight.js write trusted markup directly into the
 * live nodes (never through DOMPurify), so their output is not re-sanitized.
 */
export function enhance(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".math").forEach((el) => {
    if (el.dataset.rendered) return;
    const tex = el.textContent ?? "";
    try {
      katex.render(tex, el, {
        displayMode: el.classList.contains("math-block"),
        throwOnError: false,
        output: "htmlAndMathml",
      });
      el.dataset.rendered = "1";
    } catch {
      // Leave the raw TeX text visible as a graceful fallback.
    }
  });

  root.querySelectorAll<HTMLElement>("pre code").forEach((el) => {
    if (el.dataset.highlighted) return;
    try {
      hljs.highlightElement(el);
    } catch {
      // Non-fatal: leave the plain code block as-is.
    }
  });
}
