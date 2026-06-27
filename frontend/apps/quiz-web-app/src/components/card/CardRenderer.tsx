import { useCallback, useEffect, useMemo, useRef } from "react";
import { compileMarkdown } from "./markdown";

/**
 * Renders a markdown string to sanitized HTML, then lazily upgrades any math
 * (`$…$`, `$$…$$`) and fenced code blocks with KaTeX + highlight.js.
 *
 * Content (question stems, explanations/answers) is authored as **markdown**
 * (and will move to MDX). The `html` prop name is kept for API stability but the
 * input is markdown.
 */
export function CardRenderer({
  html,
  compiledHtml,
  reveal = true,
  dropcap = false,
  inline = false,
  className = "",
}: {
  html: string;
  /** Precompiled sanitized HTML from export (fast path). Falls back to client compile. */
  compiledHtml?: string;
  reveal?: boolean;
  dropcap?: boolean;
  /** Render as inline markdown (no block <p> wrapping) — for short labels. */
  inline?: boolean;
  className?: string;
}) {
  const safe = useMemo(
    () => compiledHtml ?? compileMarkdown(html, { inline, reveal }),
    [compiledHtml, html, reveal, inline],
  );

  const elRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);

  // After the sanitized HTML is in the DOM, lazily render math/code. The import
  // is code-split so KaTeX/highlight.js never enter the initial bundle.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (!el.querySelector(".math") && !el.querySelector("pre code")) return;
    let cancelled = false;
    void import("@/lib/richText").then((m) => {
      if (!cancelled && elRef.current) m.enhance(elRef.current);
    });
    return () => {
      cancelled = true;
    };
  }, [safe]);

  if (inline) {
    return (
      <span
        ref={setRef}
        className={`md-content md-inline ${className}`}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  return (
    <div
      ref={setRef}
      className={`md-content ${dropcap ? "dropcap" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
