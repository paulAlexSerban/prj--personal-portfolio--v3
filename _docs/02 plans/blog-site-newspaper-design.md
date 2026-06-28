---
name: Blog Site Newspaper Design (THE REVIEW)
overview: Review the quiz web app's "THE REVIEW" newspaper design, codify its repeated patterns as shared CSS classes in shared/ui, normalize (brush-up) the quiz app chrome to consume them, then implement the full newspaper treatment in blog-site (masthead titled "Paul Serban", top-ruled cards, kicker/deck section headers, Stamp CTAs, smallcaps footer) plus a dark-mode toggle matching the quiz app.
todos:
  - id: shared-classes
    content: G1.O1.P2 — Add .kicker/.deck/.card-ruled to shared/ui theme.css (S1)
    status: pending
  - id: quiz-normalize
    content: G1.O1.P3 — Normalize quiz Masthead + PageLayout to tokens/classes (S1–S2)
    status: pending
  - id: blog-masthead
    content: G1.O2.P1 — Blog masthead (Paul Serban) + bg-newsprint shell (S1–S2)
    status: pending
  - id: blog-cards
    content: G1.O2.P2 — Top-ruled PostCard + kicker/deck section headers + HeroBanner (S1–S3)
    status: pending
  - id: blog-footer
    content: G1.O2.P3 — Footer smallcaps tagline (S1)
    status: pending
  - id: blog-dark
    content: G1.O3.P1 — Dark variant + no-FOUC inline script + masthead toggle (S1–S3)
    status: pending
isProject: false
---

# Plan: Unify "THE REVIEW" design across quiz app and blog; blog gains masthead + dark toggle

## Decisions locked
- Scope: **both apps** (brush-up quiz chrome where weak + full blog redesign).
- Depth: **full newspaper treatment** on the blog.
- Dark mode: **full toggle** like the quiz app.
- Branding: blog masthead titled **"Paul Serban"** + tagline (newspaper styling).

## Context Ledger

**Known**
- Quiz "THE REVIEW" language: masthead (grain, `clamp(3rem,9vw,6rem)` display title, dateline, double rule, smallcaps nav) — `frontend/apps/quiz-web-app/src/components/layout/Masthead.tsx:7-58`; shell `bg-newsprint`, centered smallcaps footer — `PageLayout.tsx:7-17`; section pattern (smallcaps kicker + `text-4xl font-display` title + italic deck), top-ruled cards (`border-t-[3px] pt-4`), `rule-thin`, Stamp CTAs — `routes/index.tsx:66-209`.
- Design-system classes in `shared/ui/src/styles/theme.css:186-286` (`grain`, `smallcaps`, `rule`/`rule-double`/`rule-thin`, `stamp`/`stamp-ghost`, `dropcap`, `inkbleed`) — already imported by the blog (`global.css:6`) but unused.
- Semantic color/font tokens exist (`theme.css:44-54`): `--color-ink/aged/charcoal/slate-ink/newsprint/rule/highlight`, `--font-display/body/mono` → utilities `text-ink`, `bg-newsprint`, `font-display`, etc.
- `stampClasses()` returns a class string (`shared/ui/src/components/ui/Stamp.tsx:7-11`) but lives in the React barrel — blog uses the raw `stamp`/`stamp-ghost` classes instead (no JS).
- Quiz dark mode: `.dark` on `documentElement` (`lib/theme.ts:14-17`), enabled by `@custom-variant dark` + `tw-animate-css` (`quiz-web-app/src/styles.css:6-8`); `.dark` palette in `theme.css:102-150`.
- Blog `global.css` lacks `@custom-variant dark` + `tw-animate-css` (`global.css:1-17`). Blog is static Astro SSG (no React islands needed for chrome).

**Assumed**
- Blog reuses the shared "THE REVIEW" design system (not a separate look).
- No blog test suite; net is build/typecheck + manual review. Quiz has vitest (logic only).

## Findings Register (design gaps blog vs quiz reference)

| ID | Finding | Evidence | Severity | Effort | Action |
|---|---|---|---|---|---|
| D1 | Blog header plain; quiz has full masthead | `SiteHeader.astro` vs `Masthead.tsx:7-58` | High | M | Port masthead |
| D2 | Blog cards boxed; quiz top-ruled | `PostCard.astro:26-33` vs `index.tsx:139-175` | High | M | Restyle PostCard |
| D3 | Blog lacks kicker/deck header pattern | `index.astro`,`HeroBanner.astro` vs `index.tsx:66-76` | Med | S | Add pattern |
| D4 | Blog plain links; quiz Stamp CTAs | `index.astro:45` vs `index.tsx:182-206` | Med | S | Use stamp classes |
| D5 | Blog footer plain; quiz smallcaps tagline | `SiteFooter.astro` vs `PageLayout.tsx:11-15` | Low | S | Restyle footer |
| D6 | Quiz uses verbose inline `style` font + `text-[var(--…)]` vs tokens | `Masthead.tsx:8-27`,`PageLayout.tsx:8-12`,`index.tsx:68-160` | Low | S | Normalize (brush-up) |
| D7 | Blog missing `@custom-variant dark` + `tw-animate-css` | `global.css:1-17` | Low | S | Add for dark mode |

## Trade-offs / NOT doing
- Bound "brush-up" to evidenced verbosity (D6) + shared chrome; **do not** rewrite all 12 quiz routes (no force beyond cosmetics).
- Share patterns via 3 `@layer components` classes (`.kicker`,`.deck`,`.card-ruled`) — 9+ call sites across both apps; not single-use.
- No React islands for blog chrome (pure CSS). No quiz behavior/logic changes.

---

## Delivery Plan

### G1 — One newspaper design system consumed by both surfaces; blog gets masthead + dark mode

#### G1.O1 — Codify shared classes + normalize quiz chrome  [refactor]

##### G1.O1.P1 — Quiz visual baseline (net)
- **S1** — Capture quiz screenshots (`/`,`/browse`,`/sets`,`/stats`,`/settings`) @375/1280, light+dark → `.parity-baseline-quiz/` [NEW]. (Manual; human step.)

##### G1.O1.P2 — Shared component classes · Depends-on: P1.S1
- **S1** — Add to `shared/ui/src/styles/theme.css` `@layer components`: `.kicker` (small-caps + `text-slate-ink`), `.deck` (`italic text-charcoal`), `.card-ruled` (`border-t-[3px] border-ink pt-4`). Reversible: revert PR. Done-when: `shared--ui` typecheck green.

##### G1.O1.P3 — Route quiz chrome through vocabulary · Depends-on: P2.S1
- **S1** — Normalize `Masthead.tsx:8-34`: inline display-font `style`→`font-display`; `text-[var(--ink-black)]`→`text-ink`; `text-[var(--slate)]`→`text-slate-ink`; `smallcaps text-[var(--slate)]`→`kicker`. Visual-neutral. Done-when: matches baseline + vitest green.
- **S2** — Normalize `PageLayout.tsx:8-15`: `bg-[var(--newsprint)]`→`bg-newsprint`, `text-[var(--ink-black)]`→`text-ink`, footer `smallcaps`→`kicker`. Done-when: matches baseline.
- Remaining quiz routes: leave-as-is (incremental adoption).

#### G1.O2 — Blog adopts the newspaper design  [expand/improve]

##### G1.O2.P1 — Masthead + shell · Depends-on: O1.P2.S1
- **S1** — `SiteHeader.astro` → masthead: `grain`, dateline row (`kicker`), centered "Paul Serban" `font-display font-black text-[clamp(2.5rem,8vw,5rem)]` + tagline `deck`, `rule-double`, smallcaps nav (`kicker`), `border-b-[3px] border-ink`. Preserve nav links + active state.
- **S2** — `BaseLayout.astro` body → `bg-newsprint text-ink min-h-screen`.

##### G1.O2.P2 — Cards & headers · Depends-on: O1.P2.S1
- **S1** — `PostCard.astro` → `card-ruled` + `kicker` meta + `font-display text-2xl` title + `deck` excerpt + `rule-thin`.
- **S2** — `index.astro` + listings + `tags/[tag].astro` section headers → `kicker` + `font-display text-4xl` + `deck`; "View all" → `stamp stamp-ghost text-sm px-3 py-1.5`.
- **S3** — `HeroBanner.astro` → kicker/headline/deck.

##### G1.O2.P3 — Footer
- **S1** — `SiteFooter.astro` → centered `kicker` tagline + `border-t-2 border-ink`.

#### G1.O3 — Blog dark mode toggle  [expand] · Depends-on: O2.P1.S1
- **S1** — `global.css`: add `@custom-variant dark (&:is(.dark *));` + `@import 'tw-animate-css';`; add `tw-animate-css` to blog `package.json`.
- **S2** — `BaseLayout.astro` `<head>`: `<script is:inline>` reading `localStorage.theme`/`prefers-color-scheme`, toggling `documentElement.classList` pre-paint (no FOUC). Mirrors `lib/theme.ts:7-17`.
- **S3** — Theme toggle `<button class="kicker">` in masthead with inline script flipping `.dark` + persisting `localStorage.theme`.

## Dependency Graph
```
O1.P1.S1 → O1.P2.S1 → O1.P3.S1, O1.P3.S2
O1.P2.S1 → O2.P1.S1 → O2.P1.S2
O1.P2.S1 → O2.P2.S1, O2.P2.S2, O2.P2.S3
O2.P3.S1 (independent)
O3.P1.S1 → O3.P1.S2 ; (O2.P1.S1, O3.P1.S2) → O3.P1.S3
```

## Red-Team Notes
- Riskiest: O1.P3 touches the shipped quiz app; net = vitest (unaffected) + visual baseline; the refactor is value-for-value class swaps (identical computed styles). Descopable if desired (blog still works).
- "Brush-up" bounded to evidenced verbosity (D6) + chrome; refused a 12-route rewrite (refactor theatre).
- Pattern theatre avoided: only 3 shared classes, each 9+ call sites.
- Behavior honesty: O1 = visual-neutral refactor; O2/O3 = intentional new look (expand/improve). Irreversible: none.
