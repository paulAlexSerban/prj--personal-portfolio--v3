---
name: Blog Site Tailwind Migration
overview: Audit the blog-site's custom CSS and migrate it to Tailwind. Tailwind v4 is already installed and wired (astro.config + global.css); the real layout styling still lives in a parallel hand-written BEM stylesheet (src/styles/layout.css). This plan removes that dual-system smell by inlining utilities into markup with zero visual change, and (optionally, behind a go/no-go) expresses the shared shared/ui .md-content typography in Tailwind.
todos:
  - id: net-baseline
    content: G1.O1.P1 — Capture visual-parity baseline + checklist (manual net) (S1)
    status: pending
  - id: chrome-components
    content: G1.O2.P1 — Inline-utility migration of chrome components (S1–S6)
    status: pending
  - id: pages
    content: G1.O2.P2 — Inline-utility migration of pages (S7–S10)
    status: pending
  - id: mdx-components
    content: G1.O3.P1 — Inline-utility migration of blog-local MDX classes (S1–S2)
    status: pending
  - id: teardown
    content: G1.O2.P3 — Delete layout.css, relocate :empty::before, remove import (S11)
    status: pending
  - id: shared-typography
    content: G1.O4.P1 — OPTIONAL/cross-package — express shared .md-content via @apply (S1–S2)
    status: pending
isProject: false
---

# Plan: Audit custom CSS & implement Tailwind — `frontend/sites/blog-site`

## Decisions locked

- **Style:** inline utilities in markup; delete `layout.css` rules as migrated.
- **Scope:** include the shared `shared/ui` typography (`.md-content`) — blast radius includes the quiz web app + Storybook (isolated to optional G1.O4).
- **Net:** manual before/after screenshot diff (no automated tests).

## Context Ledger

**Known (verified)**

- Tailwind v4 is already installed and wired: `@tailwindcss/vite` in `frontend/sites/blog-site/astro.config.mjs:4,15`; deps in `package.json:28,32`.
- Tailwind is already imported with workspace scanning: `src/styles/global.css:3-5` (`@import 'tailwindcss' source(none)`, `@source '../src'`, `@source '../../../../shared/ui/src'`).
- Design tokens are exposed as Tailwind theme utilities in `shared/ui/src/styles/theme.css:3-55` (`@theme inline`).
- The blog's actual layout styling is hand-written BEM in `frontend/sites/blog-site/src/styles/layout.css:1-250` (~30 selectors), imported at `global.css:7`.
- BEM classes consumed by `SiteHeader.astro:19-35`, `SiteFooter.astro:10-24`, `HeroBanner.astro:15-19`, `PostCard.astro:26-33`, `TagList.astro:13-19`, `BaseLayout.astro:43`, and pages `index.astro:42-50`, `{post,snippet,booknote}/index.astro:18`, `tags/[tag].astro:48-50`, `post/[slug].astro:54,61`.
- Post bodies render through `@mdx-js/mdx evaluate()` as real React components (`post/[slug].astro:36-55`); `rehype-highlight` emits `hljs-*` spans. Body tags + hljs tokens have NO authoring site for inline classes — styled only by `.md-content <tag>` descendant selectors in shared `theme.css:288-521`.
- MDX component classes are authored in `.tsx`: `mdx-link-list` (`LinkList.tsx:25`), `mdx-heading-separator`/`mdx-heading-sub` (`Heading.tsx:14-17`) — styled only in blog `layout.css:222-249`; `mdx-callout`/`mdx-figure` (`Callout.tsx:10`, `Figure.tsx:9`) — styled in shared `theme.css:400-427`.
- No safety net: zero tests in blog-site (`package.json:7-12` is `dev/build/preview/typecheck` only); no Playwright/visual-regression anywhere.

**Assumed**

- Blog renders only in light mode (no `.dark` toggle in blog markup) — parity check uses the light palette only.
- A clean `pnpm --filter ...frontend--blog-site build` currently succeeds.

## Findings Register

| ID | Finding | Evidence | Severity | Blast radius | Effort | Recommended action |
|---|---|---|---|---|---|---|
| F1 | Dual styling systems: Tailwind active and a parallel ~250-line BEM stylesheet is the real layout source | `global.css:3-7`, `layout.css:1-250` | Medium (consistency) | All chrome + 5 pages, blog-local | M | Migrate blog-local BEM → utilities; delete migrated rules |
| F2 | `.md-content` typography + hljs token theme target `set:html`/MDX-evaluated output (no markup hooks) and are shared | `theme.css:288-521`, used at `post/[slug].astro:54` | Low | Cross-package (quiz app) | — | Express token-backed rules via `@apply`; leave non-mappable raw (optional G1.O4) |
| F3 | 3 MDX-local classes styled only in blog CSS, emitted from `.tsx` | `Heading.tsx:14-17`, `LinkList.tsx:25` ↔ `layout.css:222-249` | Low | blog-local | S | Inline utilities in the `.tsx` |
| F4 | `.mdx-callout`/`.mdx-figure` emitted by blog `.tsx` but styled in shared theme.css | `Callout.tsx:10`, `Figure.tsx:9` ↔ `theme.css:400-427` | Low | Cross-package | — | Leave as-is — utility conversion would orphan shared CSS |
| F5 | No test/visual-regression net protects the surface being changed | `package.json:7-12` | Medium (for this work) | blog-site CI | S | Add manual baseline + checklist before any edit |
| F6 | Google-fonts `@import` is an external import, not custom component CSS | `global.css:1` | Info | — | — | Leave; out of scope |

## Token map (executor reference — use these exact roots)

| CSS var | Utility root | Note |
|---|---|---|
| `--ink-black` | `ink` (`text-ink/bg-ink/border-ink`) | |
| `--aged-white` | `aged` | |
| `--charcoal` | `charcoal` | |
| `--slate` | `slate-ink` | NOT `slate` (built-in blue-gray) |
| `--press-black` | `press` | |
| `--newsprint` | `newsprint` | |
| `--column-rule` | `rule` (`border-rule`) | |
| `--highlight` | `highlight` (`bg-highlight`) | |
| `--font-display` | `font-display` | |

Tokens defined at `shared/ui/src/styles/theme.css:44-54`. Tailwind scans blog `src` and `shared/ui/src` (`global.css:4-5`).

## Trade-off Decisions

| Decision | Options (incl. leave-as-is) | Cost | Benefit | Chosen | Named force |
|---|---|---|---|---|---|
| Migrate `layout.css` BEM | leave-as-is; inline utilities; `@apply` layer | inline churns 9 files | single styling paradigm, matches installed stack | inline utilities | Tailwind already chosen+installed; parallel BEM is a half-migrated state — consistency cost |
| Touch shared `.md-content` | leave-as-is; migrate | cross-package risk; no markup hooks | none meaningful | migrate (optional, isolated) per user `include_shared` | Weak (consistency only) — flagged droppable |
| Safety net | Playwright; HTML; manual | manual = no automation | zero infra | manual (user choice) | Unprotected surface (F5) |

### Explicitly NOT doing / leaving as-is

- Shared hljs hex palette, KaTeX, grain gradients, `:first-letter` dropcap, `@keyframes` — no utility equivalent; converting is churn.
- `.mdx-callout`/`.mdx-figure` shared styles (F4).
- Re-theming / visual redesign — request is "implement Tailwind", output must stay visually identical.
- shadcn/ui primitives in the static blog — no interactive force (YAGNI).
- Migrating quiz app or other surfaces beyond the shared `.md-content` rules.

---

## Delivery Plan

### G1 — Blog renders entirely through Tailwind utilities/`@apply`, output visually identical

- Intent: remove the parallel BEM stylesheet (F1) so Tailwind is the single paradigm, with zero visual change.
- Gates: TDD N/A (manual net, F5); BDD N/A (no behavior change); Manual: per-phase before/after screenshot diff, pixel-identical @375px+1280px, light mode; Deliverable: `layout.css` deleted; `pnpm --filter ...frontend--blog-site build` exits 0.

#### G1.O1 — Establish the manual parity net  [refactor-prep]

##### G1.O1.P1 — Baseline capture · Depends-on: none · Rollback: delete baseline dir

- **G1.O1.P1.S1 — Capture baseline screenshots + parity checklist**
  - References: build (`package.json:9`) + `astro preview`; pages `index`, `post/index`, `tags/[tag]`, two `post/[slug]` (one with quiz slot per `post/[slug].astro:57-66`, one without; one containing code block + `<Callout>` + `<Figure>` + `<Heading hasSeparator>`/`<LinkList>`). Artifact dir `.parity-baseline/` [NEW].
  - Manual: screenshots @375px + 1280px, light mode + `CHECKLIST.md`. Done-when: every page/breakpoint has a baseline image.

#### G1.O2 — Migrate blog-local chrome + pages → inline utilities  [refactor]

##### G1.O2.P1 — Chrome components · Depends-on: G1.O1.P1.S1 · Rollback: revert PR

- **S1 — `SiteHeader.astro`** (`:19-35` ↔ `layout.css:1-46`). Nav states: `hover:text-ink hover:font-bold aria-[current=page]:text-ink aria-[current=page]:font-bold`.
- **S2 — `SiteFooter.astro`** (`:10-24` ↔ `layout.css:54-81`).
- **S3 — `HeroBanner.astro`** (`:15-19` ↔ `layout.css:83-100`). Title: `font-display text-[clamp(2rem,5vw,3rem)] leading-[1.1]`.
- **S4 — `PostCard.astro`** (`:26-33` ↔ `layout.css:142-178`).
- **S5 — `TagList.astro`** (`:13-19` ↔ `layout.css:180-201`).
- **S6 — `BaseLayout.astro` `.site-main`** (`:43` ↔ `layout.css:48-52`): `max-w-[72rem] mx-auto px-6 pt-8 pb-16`.

##### G1.O2.P2 — Pages · Depends-on: G1.O2.P1.S4 · Rollback: revert PR

- **S7 — `index.astro`** (`:42-50` ↔ `layout.css:102-140`). Grid: `grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-5 list-none m-0 p-0`.
- **S8 — `{post,snippet,booknote}/index.astro`** (`:18` ↔ `layout.css:102-140`).
- **S9 — `tags/[tag].astro`** (`:48-50` ↔ `layout.css:102-140`).
- **S10 — `post/[slug].astro`** (`:54,61` ↔ `layout.css:203-220`). Keep `class="md-content"`; `post-detail` → `mt-4`; quiz box → `mt-12 p-6 border-2 border-dashed border-rule bg-highlight min-h-16` (retain `id`/`data-*`).

##### G1.O2.P3 — Teardown · Depends-on: all O2.P1/P2 + O3 · Rollback: revert PR

- **S11 — Delete `src/styles/layout.css`; relocate ONLY `.quiz-widget-slot:empty::before` (`layout.css:215-220`) into `global.css` `@layer components`; remove `@import './layout.css'` (`global.css:7`).** Done-when: build green; `rg` finds no BEM classes except the relocated pseudo.

#### G1.O3 — Migrate blog-local MDX component classes  [refactor] · Depends-on: G1.O1.P1.S1

- **S1 — `LinkList.tsx`** (`:25` ↔ `layout.css:222-235`): `list-none my-4 p-0`; items `my-[0.35em]`; links `text-ink font-bold`.
- **S2 — `Heading.tsx`** (`:14-17` ↔ `layout.css:237-249`): separator `border-b border-dashed border-rule pb-[0.35em] mb-3`; sub `block text-[0.85em] font-normal text-slate-ink mt-1`.

#### G1.O4 — Express shared `.md-content` typography via `@apply`  [refactor] — OPTIONAL / cross-package · Depends-on: G1.O2.P3.S11

- **S1 — Capture shared-consumer baseline**: quiz app key screens + Storybook md-content stories (`shared/ui/src/components/blocks/*.stories.tsx`).
- **S2 — Rewrite token-backed `.md-content` declarations with `@apply`** (`theme.css:288-427`): headings `@apply font-display font-bold`; links `@apply underline underline-offset-2`; inline code `@apply font-mono bg-highlight border border-rule`; blockquote `@apply border-l-[3px] border-ink italic text-charcoal`; callouts `@apply border-2 border-ink bg-highlight`. Leave raw (no equivalent): hljs palette (`:461-521`), KaTeX (`:442-459`), grain gradients, dropcap (`:264-272`), keyframes (`:273-285`), `em` dimensions. Done-when: blog + quiz app + Storybook match baseline; `shared--ui typecheck` + both builds green.

## Dependency Graph

```
O1.P1.S1
  → O2.P1.S1..S6, O3.P1.S1..S2
O2.P1.S4 → O2.P2.S7..S10
(all O2.P1.*, O2.P2.*, O3.*) → O2.P3.S11
O2.P3.S11 → O4.P1.S1 → O4.P1.S2
```

## Red-Team Notes

- Riskiest: `O4.P1.S2` edits shared `theme.css` (quiz app + Storybook), guarded only by manual screenshots. Isolated/last/single-file/revertible. Recommendation: consider dropping O4 — `.md-content` can't be fully inlined and large chunks stay raw regardless.
- Refactor theatre avoided: did not convert hljs/KaTeX/keyframes/dropcap/grain to `@apply`.
- Pattern theatre avoided: no shadcn/ui pulled into the static blog (YAGNI).
- Behavior honesty: all steps structure/visual-neutral; only class attributes change; `:empty::before` preserved verbatim (relocated).
- Junior trap: `--slate` → `text-slate-ink`, not `text-slate`.
- Irreversible steps: none.
