---
name: Blog Site Design Improvements (v1 review fixes)
overview: Resolve the six findings (F1–F6) from the v1 design review spike — invisible tags, cards with no bottom edge, missing card CTA, hidden dark toggle, too-small masthead tagline, and an over-wide grid min-column. All are intentional visual improvements (work type improve) on an unprotected (no tests) surface; net is build + typecheck + manual visual review against the spike.
todos:
  - id: postcard-batch
    content: G1.O1.P1 — Fix PostCard (F1 tags + F2 bottom edge + F3 Read CTA) (S1–S2)
    status: pending
  - id: header-batch
    content: G1.O2.P1 — Fix SiteHeader (F4 toggle visibility + F5 deck size) (S1)
    status: pending
  - id: grid-batch
    content: G1.O3.P1 — Fix grid min-column width across 5 pages (F6) (S1)
    status: pending
isProject: false
---

# Plan: Blog design improvement — F1–F6 from the v1 design review

Source of findings: `_docs/architectural-knowledge-management/architectural-decision-log/adr-006--ssg-w-mdx/spikes/04 - design review - blog site v1 render.md`

## Context Ledger

**Known (verified)**
- `TagList.astro:14,19` — tags have no persistent border/background; `rounded-md` is a no-op (`--radius: 0` at `shared/ui/src/styles/theme.css:58`); `hover:bg-highlight` only on hover.
- `PostCard.astro:33-41` — `card-ruled` top border, `rule-thin my-4` before tags, no bottom edge, no CTA.
- `SiteHeader.astro:20-32` — dateline row + dark toggle all at `text-[10px]`; toggle lost in noise.
- `SiteHeader.astro:42` — deck tagline `deck` class only (inherits base size, ~13px rendered).
- Grid `minmax(25rem,1fr)` at: `index.astro:53`, `post/index.astro:18`, `snippet/index.astro:18`, `booknote/index.astro:18`, `tags/[tag].astro:52`.
- `PostCard` used by: hub + 3 listings + tag archive. `TagList` used by: `PostCard.astro:40`, `HeroBanner.astro:16`.
- No tests in `blog-site`.

**Assumed**
- Review viewport ~900–1000px (2-col grid in screenshot). `minmax(25rem,1fr)` ≈ 2 cols max at 72rem.

## Current-State Audit
- **Safety-net:** unprotected (zero tests). Changes are visual; net = `astro build` exit 0 + `astro check && tsc --noEmit` clean + manual review.
- **Blast radius:** F1 → all cards + heroes; F2/F3 → 5 listing contexts; F4/F5 → global chrome; F6 → 5 pages.
- **Baseline (improve):** metric = visual discoverability/legibility of interactive elements, measured manually vs spike 04. Target = all six findings visually resolved in build output.

## Findings Register (from spike 04)

| ID | Finding | Evidence | Severity | Effort | Action |
|---|---|---|---|---|---|
| F1 | Tags invisible (no border/bg, `rounded-md` no-op) | `TagList.astro:19` | High | XS | Persistent border + bg |
| F2 | Cards have no bottom edge | `PostCard.astro:33` | High | XS | `border-b border-rule pb-4` |
| F3 | Cards have no CTA | `PostCard.astro:39-41` | Med | XS | "Read →" kicker link |
| F4 | Dark toggle 10px, undiscoverable | `SiteHeader.astro:23-32` | Med | S | Move to nav row @11px |
| F5 | Masthead deck tagline too small | `SiteHeader.astro:42` | Med | XS | `text-sm` |
| F6 | Grid min-col 25rem too wide | 5 grid sites | Low | XS | `minmax(18rem,1fr)` |

## Trade-off Decisions

| Decision | Options (incl. leave-as-is) | Cost | Benefit | Chosen | Named force |
|---|---|---|---|---|---|
| Tags | leave invisible; border+bg; dot-joined kicker text | dot-join drops archive links | border+bg keeps links + legibility | border+bg | Tags are the `/tags/*` nav mechanism; invisible = broken |
| Card bottom | leave open; `border-b border-rule pb-4` | none | visual terminus | inline `border-b` on PostCard | F2: cards bleed together |
| Card CTA | leave; Stamp button; kicker text link | Stamp too heavy for browse | matches quiz card foot | kicker "Read →" | F3: no action terminus |
| Toggle | leave 10px; move to nav row @11px | one layout line | discoverable | move to nav row | F4: unreachable at 10px |
| Deck | leave 13px; `text-sm`; remove | slight space | readable tagline | `text-sm` | F5: primary description invisible |
| Grid | leave 25rem; 18rem; `md:grid-cols-2` | none | responsiveness | `minmax(18rem,1fr)` | F6: 25rem too wide |

### Explicitly NOT doing
- Not changing `card-ruled` in shared `theme.css` (would hit the quiz app) — F2 applied inline on the PostCard `<article>`.
- Not extracting `TagPill`/`CardFooter` components — single call-site pattern, would be pattern theatre.
- Not removing the dateline row — it's publication metadata; only the toggle moves.

---

## Delivery Plan

### G1 — Every v1 design finding resolved; all pages build + typecheck clean
- Gates: TDD N/A (no test infra, visual change); BDD N/A; Manual: review vs spike 04 at 375/800/1100px, light+dark; Deliverable: `astro build` exit 0 + typecheck clean.

#### G1.O1 — Fix PostCard (F1+F2+F3)  [improve]
##### G1.O1.P1 — PostCard batch · Depends-on: none · Rollback: revert PR
- **S1 — Restore tag treatment** `TagList.astro:19`: replace `inline-block px-2 py-[0.15rem] text-[0.8rem] text-ink no-underline hover:bg-highlight rounded-md` → `inline-block border border-rule bg-highlight px-2 py-[0.15rem] text-[0.8rem] text-ink no-underline hover:border-ink`. Done-when: tags visibly bordered without hover; links resolve.
- **S2 — Card bottom edge + CTA** `PostCard.astro:33,40`: `<article class="card-ruled">` → `<article class="card-ruled border-b border-rule pb-4">`; after `<TagList>` add `<a href={href} class="kicker mt-3 inline-block text-[10px] hover:underline">Read →</a>` (reuse existing `href` from line 29). Done-when: visible bottom rule + working Read link on all 5 contexts.

#### G1.O2 — Fix SiteHeader (F4+F5)  [improve]
##### G1.O2.P1 — SiteHeader batch · Depends-on: none · Rollback: revert PR
- **S1 — Move toggle to nav row; bump deck** `SiteHeader.astro`: remove toggle button from dateline row (leaving "Writing Edition" alone); add the toggle as last child of the nav row `<div>` after `<nav>`, change its `text-[10px]`→`text-[11px]`; change deck `class="deck mt-1 text-center"` → `class="deck mt-2 text-center text-sm"`. Toggle script (`getElementById('theme-toggle')`) unaffected. Done-when: toggle visible @11px in nav row, toggles + persists; tagline readable; no-FOUC intact.

#### G1.O3 — Fix grid width (F6)  [improve]
##### G1.O3.P1 — Grid batch · Depends-on: none · Rollback: revert PR
- **S1 — `minmax(25rem,1fr)` → `minmax(18rem,1fr)`** in `index.astro:53`, `post/index.astro:18`, `snippet/index.astro:18`, `booknote/index.astro:18`, `tags/[tag].astro:52`. Done-when: 3 cols ≥1100px, 2 at ~800px, 1 at <600px.

## Dependency Graph
```
G1.O1.P1.S1  (TagList)     — independent
G1.O1.P1.S2  (PostCard)    — independent
G1.O2.P1.S1  (SiteHeader)  — independent
G1.O3.P1.S1  (grid pages)  — independent
```
All steps independently revertible; any order safe.

## Red-Team Notes
- Riskiest: moving the dark toggle (G1.O2.P1.S1). The `is:inline` script finds it by `id`, position-independent → low risk. Net: manual toggle+persist check.
- Refactor theatre avoided: no renames/extractions; every change moves a discoverability/legibility metric.
- Coverage theatre avoided: no DOM-structure tests added on a visual change.
- Pattern theatre avoided: no `TagPill`/`CardFooter` components (single call-site).
- Irreversible: none.
- Junior trap: "Read →" reuses existing `href` (PostCard.astro:29) — do not re-derive.
