import { describe, it, expect } from "vitest";
import { compileContent, compileMarkdown } from "./markdown";

describe("compileMarkdown — math placeholders", () => {
  it("emits an inline-math placeholder carrying the raw TeX", () => {
    const html = compileMarkdown("The sum $\\sum_{i=1}^n i$ grows.");
    expect(html).toContain('<span class="math math-inline">');
    expect(html).toContain("\\sum_{i=1}^n i");
    expect(html).not.toContain("<em>");
  });

  it("emits a block-math placeholder for $$…$$", () => {
    const html = compileMarkdown("$$\\frac{a}{b}$$");
    expect(html).toContain('<div class="math math-block">');
    expect(html).toContain("\\frac{a}{b}");
  });

  it("escapes HTML-significant characters inside TeX", () => {
    const html = compileMarkdown("$a < b$");
    expect(html).toContain("a &lt; b");
    expect(html).not.toContain("a < b<");
  });

  it("does not treat a bare price like $5 as math", () => {
    const html = compileMarkdown("It costs $5 today.");
    expect(html).not.toContain('class="math');
    expect(html).toContain("$5");
  });
});

describe("compileMarkdown — code blocks", () => {
  it("keeps the language class so the highlighter can target it", () => {
    const html = compileMarkdown("```ts\nconst x: number = 1;\n```");
    expect(html).toContain("<pre>");
    expect(html).toContain('class="language-ts"');
  });

  it("renders inline code", () => {
    const html = compileMarkdown("Use `O(n log n)` here.");
    expect(html).toContain("<code>O(n log n)</code>");
  });
});

describe("compileMarkdown — cloze + inline mode", () => {
  it("hides cloze deletions until revealed", () => {
    const hidden = compileMarkdown("Capital is {{c1::Paris}}.", { reveal: false });
    expect(hidden).toContain("cloze-blank");
    expect(hidden).not.toContain("Paris");

    const shown = compileMarkdown("Capital is {{c1::Paris}}.", { reveal: true });
    expect(shown).toContain("cloze-filled");
    expect(shown).toContain("Paris");
  });

  it("inline mode does not wrap content in a block paragraph", () => {
    const html = compileMarkdown("**bold** label", { inline: true });
    expect(html).toContain("<strong>bold</strong>");
    expect(html).not.toContain("<p>");
  });
});

describe("compileContent — MDX + XSS", () => {
  it("renders Callout components from MDX source", () => {
    const html = compileContent('<Callout type="tip">Remember cycles.</Callout>');
    expect(html).toContain("mdx-callout-tip");
    expect(html).toContain("Remember cycles.");
  });

  it("strips hostile payloads via the shared allow-list", () => {
    const html = compileContent("<script>alert(1)</script><img src=x onerror=alert(1)>");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });
});
