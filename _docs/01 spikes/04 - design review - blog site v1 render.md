# Design Review — Blog Site v1 Render

**Date:** 2026-06-28  
**Reference screenshot:** `localhost:4321` hub page, full-width, light mode  
**Reviewer:** AI design audit (brutally honest)  
**Purpose:** This spike reviews the first rendered state of the blog-site newspaper design to produce a prioritised findings list. These findings drive the next refactor pass for both the blog and the quiz app.

---

## Verdict: direction correct, execution has 6 specific problems

The overall newspaper aesthetic is present: the grain masthead, the newsprint background, the display-font section headers with 3 px rules, and the two-column card layout all read as "THE REVIEW" family. These are not problems.

The problems are specific and fixable without a design rethink.

---

## Findings (priority order)

### F1 — Tags are visually invisible [HIGH]

**What the screen shows:** Tags render as plain lowercase text (`#active-recall · #bloom-s-taxonomy…`) with no border, no background, no visual weight. They look like a continuation of the excerpt body copy.

**Why it happened:** `TagList.astro:19` uses `hover:bg-highlight` (only on hover) + `rounded-md` (which is `border-radius: 0` because the design system sets `--radius: 0`) and no persistent border or background. The result is unbordered, backgroundless links that are indistinguishable from surrounding text.

**Impact:** Tags are a primary navigation mechanism (they link to tag archives). Making them invisible breaks discoverability. Also visually, the card has no visual terminus — it just trails off into grey text.

**Fix required:**
- Restore a persistent visual treatment: thin border (`border border-rule`) + light background (`bg-highlight`) that is always visible, not just on hover.
- Remove `rounded-md` — it does nothing here and implies a design system (Tailwind default radii) that this design explicitly does not use (`--radius: 0` throughout).
- Pattern to use (from `shared/ui/theme.css` — the original `tag-list` treatment): `border border-rule bg-highlight px-2 py-[0.15rem] text-[0.8rem] text-ink no-underline hover:border-ink`.

---

### F2 — Card grid has no visual separation between cards in the same column [HIGH]

**What the screen shows:** Cards in the same column run together — you can tell where one ends and another begins only by the `card-ruled` top border on the next card, but the gap between cards is a flat 20px of newsprint background. When card heights differ dramatically (one card is 3 lines, the adjacent one is 7 lines), the asymmetry is jarring.

**Impact:** The page looks like a dense block of text in the left column + a sparser block in the right column. Readers cannot quickly parse how many cards are present.

**Fix required:**
- Add `border-b border-rule` to `PostCard.astro` (a bottom rule to close each card). This creates a visible terminus even on short cards.  
- Alternatively (quiz app pattern): use `gap-y-8` and rely on `card-ruled` alone, but ensure each card has `min-h-[6rem]` so short cards still read as cards.
- The gap (`gap-5` = 20px) is fine; the problem is the card has no visual bottom edge.

---

### F3 — Cards have no CTA / action [MEDIUM]

**What the screen shows:** Each card ends at the tags row (which is already invisible — F1). The quiz app's cards end with a `rule-thin` + Stamp button ("Open Set" / "Add"). The blog cards have the `rule-thin` but nothing after it.

**Impact:** The card feels unfinished. There is no affordance for "read this post." The title is the only link, but it's not visually called out as an action. Users have to know to click the headline.

**Fix required:**
- After `<TagList>`, add a "Read →" text link (not a full Stamp — this is browse context, not primary CTA): `<a href={href} class="kicker text-[10px] mt-1 inline-block hover:underline">Read →</a>`.
- This follows the quiz card's "Open Set" pattern: a small, kicker-styled directional link at the card foot.

---

### F4 — Masthead top row is 10 px text, effectively invisible [MEDIUM]

**What the screen shows:** The top dateline row (`paulserban.eu` / `Writing Edition` / dark toggle button) is 10 px. On a normal monitor this is smaller than browser UI chrome. Zoomed out it is invisible. The dark toggle button, being the same size and colour as the dateline text, is undetectable as a control.

**Impact:** The dark mode toggle cannot be found without knowing it exists. "Writing Edition" branding is wasted — no reader notices it. At full page zoom the masthead *looks* good (big display title, double rule, nav) but the top row adds density noise rather than content.

**Fix required (two options — pick one):**
- **A (preferred):** Remove the dateline top row entirely. Move the dark toggle to the nav row (right side) at a larger size (`text-[11px]` matching the nav, with the bordered button treatment). The kicker branding line above the title is already sufficient.
- **B:** Keep the top row but bump to `text-[11px] md:text-xs`, and visually separate the toggle from the text labels with a `|` divider or a gap that makes the button obviously interactive.

---

### F5 — Masthead deck tagline is too small to register [MEDIUM]

**What the screen shows:** "Writing, snippets & book notes" renders below the title in `deck` style (italic + charcoal). At the rendered size it is barely distinguishable from a body paragraph. It does not feel like a masthead subheading — it feels like stray copy.

**Impact:** The tagline should tell first-time visitors what the blog is. As rendered it is skipped.

**Fix required:**
- Size to `text-base` minimum (currently it inherits base which at screen distance is ~12–13 px rendered). The quiz app's dateline kickers are small by design because they convey metadata; the site description is primary copy and needs weight.
- Consider: `text-base italic text-slate-ink tracking-wide` and increase the `mt-` before the double rule so the whole masthead stack breathes.

---

### F6 — Section grid min column width is too wide for this content [LOW]

**What the screen shows:** `minmax(25rem, 1fr)` is used on the hub page. At the page's max-width (72rem with 1.5rem padding each side = ~69rem content), 25rem min forces 2 columns only (2 × 25 = 50rem), leaving ~19rem of flex space. At slightly narrower widths it collapses to 1 column abruptly. More importantly: some pinned cards are only 2–3 lines (short snippet titles) next to 5–7 line posts, making the two-column grid look unbalanced.

**Impact:** Minor visual imbalance; also the grid switch from 2→1 column happens too late on tablet.

**Fix required:**
- Change `minmax(25rem, 1fr)` → `minmax(18rem, 1fr)` on the hub (restores the 3-column possibility) — OR —
- Use `md:grid-cols-2` explicitly (quiz app pattern), which gives predictable 2-column at ≥768 px and single-column below. More honest about the intent.

---

## What is working — do not change

| Element | Why it works |
|---|---|
| Grain masthead background | Creates immediate newspaper feel |
| `card-ruled` top-border pattern | Clean columnar separation |
| 3 px section header rule | Strong visual anchor for each content type |
| Newsprint page background | Low-contrast, comfortable, typographically correct |
| Display font for titles | Correct typographic hierarchy |
| `stamp stamp-ghost` "View all" button | Correct use of the design token; reads as secondary CTA |
| Footer kicker tagline | Quiet, appropriate |

---

## Proposed fix priority for the refactor pass

| ID | Fix | Effort | Blast radius |
|---|---|---|---|
| F1 | Restore tag visual treatment | XS — `TagList.astro` only | All pages with tags |
| F2 | Add card bottom edge | XS — `PostCard.astro` only | All listing pages |
| F3 | Add "Read →" card foot link | XS — `PostCard.astro` only | All listing pages |
| F4 | Relocate/resize dark toggle | S — `SiteHeader.astro` | Global |
| F5 | Increase masthead deck size | XS — `SiteHeader.astro` | Global |
| F6 | Fix grid min-width | XS — `index.astro` + listing pages | Hub + listings |

**Recommended execution order:** F1 → F2 → F3 (PostCard batch) → F5 → F4 (SiteHeader batch) → F6 (pages batch). Each batch is a single revertible PR.

---

## Note on quiz app

The quiz app's equivalent chrome (`Masthead.tsx`, `PageLayout.tsx`) does not share F1–F6 because:
- Its "cards" (`index.tsx:139`) use `border-t-[3px] pt-4` + `rule-thin` + Stamp CTA — the full pattern the blog is still missing (F2, F3).
- Its tags are `smallcaps dot-joined text` (not links), so F1 does not apply.
- Its dateline top row (`Masthead.tsx:11-22`) is also 10 px — this IS worth noting as a shared issue for future parity, but it's less critical in the quiz because the top row is purely metadata (no interactive element hidden there).

The quiz app does NOT need a matching refactor pass for F1–F6. Only the blog does.
