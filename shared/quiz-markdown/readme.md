# Quiz Markdown (`shared/quiz-markdown/`)

Compiles question content (Markdown, and a small allow-listed slice of MDX) into
**safe, sanitized HTML**. One pipeline, used in two places: at export time (Node)
and as a fallback in the browser.

**Package:** `@prj--personal-portfolio--v3/shared--quiz-markdown`

## Why it exists

Question stems, option labels, and explanations are authored in Markdown (`##`,
fenced code, lists, inline `code`, `$math$`). They must never be rendered as raw
HTML, or a malicious payload in content could run in the user's browser. This
package is the **single trusted place** that converts authored text to HTML and
strips anything dangerous — so `shared--quiz-export` and the quiz app can't drift
apart on what's allowed.

```
authored text ──► MDX preprocess ──► markdown (+ math/cloze) ──► DOMPurify sanitize ──► safe HTML
                  (Callout/Figure)    (marked, GFM)              (allow-list)
```

## Main API

```ts
import { compileContent } from '@prj--personal-portfolio--v3/shared--quiz-markdown';

const html = compileContent(source, { inline: false }); // MDX auto-detected
```

`compileContent(src, opts)` runs the full pipeline:

1. **MDX preprocess** (only if the source uses an allow-listed component) — turns
   `<Callout type="tip">…</Callout>` and `<Figure src="…" caption="…" />` into
   plain HTML. Any other JSX is left alone (and later escaped).
2. **Markdown** — `marked` with GFM, plus placeholders for math (`$…$`, `$$…$$`)
   and cloze deletions so they survive sanitization.
3. **Sanitize** — `isomorphic-dompurify` against a shared allow-list of tags and
   attributes.

`inline: true` parses a single line without wrapping `<p>` (used for MC/MS option
labels like `` `O(n log n)` ``).

## How it works (source map)

| File               | Role                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`         | `compileContent()` — the public entry; ties the steps together.                                                                     |
| `src/mdx.ts`       | `detectContentFormat()`, `preprocessMdx()` — the allow-listed `<Callout>` / `<Figure>` transforms.                                  |
| `src/markdown.ts`  | `compileMarkdown()` — `marked` (GFM) + math + cloze.                                                                                |
| `src/sanitize.ts`  | `sanitizeHtml()` — DOMPurify with the shared allow-list.                                                                            |
| `src/allowlist.ts` | `ALLOWED_TAGS` / `ALLOWED_ATTR` — **the one source of truth** for what HTML survives (also exported via the `./allowlist` subpath). |
| `src/assets.ts`    | Helpers to find and rewrite relative image paths (used by the export's asset copy).                                                 |

## Important invariant

The DOMPurify allow-list lives **here only**. Both the export and the frontend
import it; never fork or re-declare it elsewhere, or compiled HTML and
client-rendered HTML will diverge (and you risk an XSS gap).

## How to run it

```bash
pnpm --filter @prj--personal-portfolio--v3/shared--quiz-markdown test       # incl. hostile-payload sanitizer tests
pnpm --filter @prj--personal-portfolio--v3/shared--quiz-markdown typecheck
```

## Where it sits

- **Depends on:** `marked`, `isomorphic-dompurify` (no DB / framework deps).
- **Consumed by:** `shared--quiz-export` (export-time compile → precompiled HTML in JSON); `frontend--quiz-web-app` (client fallback when a JSON file predates the compiled fields).

## Related docs

- `_docs/02 plans/quiz-web-app-enhancements-plan.md` — Phase 1 (Markdown), Phase 2 (math/code), Phase 6 (this shared compiler + MDX).
- `_docs/01 spikes/types-of-questions.md` — question/MDX authoring formats.
- `shared/AGENTS.md` — all shared packages.
