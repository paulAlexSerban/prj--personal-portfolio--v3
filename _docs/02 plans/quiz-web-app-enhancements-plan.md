# Quiz Web App — enhancements & "better-than-Anki" plan (phased, gated)

**Status:** draft plan
**Owner:** TBD
**Predecessor:** [`quiz-web-app-refactor-plan.md`](./quiz-web-app-refactor-plan.md) (Phases 0–7, the CSR/zustand/JSON refactor — substantially complete)
**App:** [`frontend/apps/quiz-web-app`](../../frontend/apps/quiz-web-app)

This plan covers what comes **after** parity-with-the-POC: content rendering fidelity
(Markdown→MDX), viewing/practising questions outside study mode, UX polish, and
spaced-repetition quality improvements aimed at surpassing Anki for this content.

---

## 1. Brutally honest critique (current state)

The app builds, typechecks, lints, tests (17), and is a clean CSR + zustand + static-JSON
architecture. It is **functional but shallow**. The biggest problems, in order of severity:

| #   | Severity | Area            | Finding                                                                                                                                                                                                                          |
| --- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Critical** | Rendering    | **Explanations/answers are authored in Markdown** (`## Answer:`, fenced code ```` ```js ````, `**bold**`, lists) but `CardRenderer` treated the string as HTML and stripped it — users saw literal `##` and backticks. *(Fixed this session: Phase 1 below.)* |
| C2  | **Critical** | Math         | `$…$` is rendered as plain italic serif — **not real math**. Any non-trivial formula is wrong/ugly.                                                                                                                            |
| C3  | High     | Best-practice   | **No interval fuzz / load balancing.** Every card added on the same day graduates and comes due on the same day → self-inflicted review pile-ups. Anki fuzzes intervals to spread load; we don't.                                |
| C4  | High     | UX              | **No way to view a question + answer outside a scheduled study session.** Set-detail table shows the stem as plain text; clicking a row does nothing. Users literally asked for this. No global "all questions" search/browse.    |
| C5  | High     | Correctness     | **Day-boundary bug.** `todayISO()` does `setDate` (local) then `toISOString().slice(0,10)` (**UTC**). Near midnight, the "today" used for due comparisons is off by one for any non-UTC user. Scheduling drifts.                  |
| C6  | Med      | Scheduling      | **Daily new/review limits are global, not per-set.** `daily` is a single counter. Can't pace decks independently; the per-set config panel is read-only and reflects global config only.                                          |
| C7  | Med      | Algorithm       | **SM-2 only.** SM-2 (1987) is materially worse than **FSRS** (used by modern Anki) for retention-vs-workload. "Better than Anki" essentially requires FSRS or equivalent.                                                         |
| C8  | Med      | UX feedback     | `sonner` (toasts) is installed but **unused**. No undo after a rating, no confirmation feedback on add/remove/reset. Theme toggle in Settings writes a class but **theme isn't applied on app load** (no boot-time hydration).    |
| C9  | Med      | Study UX        | Auto-graded questions can't be **re-tried**; rating buttons don't reflect correctness (a wrong MC still offers Easy). No "answer was X, you said Y" diffing for multiple_select. No per-card "edit/suspend/bury" from session.    |
| C10 | Low      | Content         | No syntax highlighting in code blocks; relative image paths in content won't resolve (no asset strategy); no MDX (custom components, callouts) despite the stated future direction.                                               |
| C11 | Low      | Leeches         | `lapses` is tracked but never acted on. Anki auto-suspends/tags **leeches** (lapses ≥ N). We don't surface or act on them.                                                                                                       |
| C12 | Low      | Mobile/a11y     | Wide tables overflow on mobile; stats heatmap is fixed at 53 columns; limited ARIA; reveal/rate flow is keyboard-only-friendly but not screen-reader-announced.                                                                   |

What's **good** and should be preserved: clean content/progress separation (slug-keyed
state), additive `addPost`, deterministic pure SM-2 engine + tests, the JSON contract,
PWA offline, and the rich stats page.

---

## 2. Goals

1. **Render content faithfully** — Markdown now, MDX next, real math + code highlighting.
2. **View & practise outside study mode** — browse, preview, search, and cram any question
   without mutating its schedule.
3. **UX polish** — feedback (toasts/undo), theme-on-load, better study flow, mobile/a11y.
4. **Spaced-repetition quality** — fuzz, load-balancing, leeches, per-set config, and an
   **FSRS** scheduler option to beat Anki on retention/workload.

### Non-goals (this plan)

- Backend/sync/multi-device accounts.
- LLM grading of free-text.
- Authoring/editing content in the app (content is read-only from the DB export).

---

## 3. Phased, gated plan

> Each phase: **Entry gate → Work → Exit gate**. End every phase with
> `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green for the app.

### Phase 1 — Markdown rendering (C1) — ✅ DONE (this session)

**Work (completed)**
1. Added `marked` (GFM) + `dompurify`; rewrote `CardRenderer` to: markdown→HTML →
   cloze/math substitution → DOMPurify sanitize (allow-listed tags/attrs).
2. Added `inline` mode (`marked.parseInline`) for MC/MS **option labels** (e.g. `` `O(n log n)` ``).
3. Added `.md-content` styles (headings, lists, code, fenced `pre`, tables, blockquote, hr)
   and cloze/inline-math classes in `styles.css`.

**Exit gate (G1) — met**
- Explanations with `##`, fenced code, lists, inline code render correctly; build/lint/tests green.

**Remaining for later phases:** ~~real math (Phase 2), code highlighting~~ (done in Phase 2); MDX (Phase 6).

```
Markdown rendering — implemented & verified ✅
The critical bug: explanations and answers are authored in Markdown (## Answer:, fenced ```js blocks, **bold**, lists, inline `code`) but CardRenderer treated the string as HTML — stripping/escaping everything, so users saw literal ## Answer: and backticks.

Fixed with a real pipeline in CardRenderer: marked (GFM) → cloze/math substitution → DOMPurify sanitize (allow-listed tags/attrs). Added:

inline mode (marked.parseInline) for MC/multiple-select option labels (e.g. `O(n log n)`).
Full .md-content styling (headings, lists, fenced code blocks, tables, blockquotes, hr) plus cloze classes in styles.css.
Verified: typecheck ✅, build ✅ (PWA 28 entries), lint ✅ (0 errors, 7 pre-existing shadcn warnings), 17/17 tests ✅.

Brutally honest critique + plan
Written to _docs/02 plans/quiz-web-app-enhancements-plan.md. The headline findings:

C1 Markdown not rendered — fixed this session.
C2 $…$ is fake math (italic serif), not KaTeX.
C3 No interval fuzz/load-balancing → same-day cohorts all pile up on the same due date.
C4 No way to view a question + answer outside a scheduled session (your explicit ask).
C5 Real bug: todayISO() mixes local setDate with UTC toISOString().slice(0,10) → due dates drift by a day near midnight for non-UTC users.
C6 Daily limits are global, not per-set; the per-set config panel is read-only.
C7 SM-2 only — beating Anki realistically needs FSRS.
C8/C9 sonner installed but unused, no undo, theme not applied on load, wrong auto-graded answers can still be rated Easy.
The 7-phase gated roadmap: P1 Markdown (done) → P2 math/code fidelity → P3 view/preview/search outside study mode → P4 study-flow & feedback UX → P5 SR correctness (fuzz, date fix, per-set config, leeches) → P6 MDX pipeline → P7 FSRS scheduler (the "better than Anki" core). Each has entry/exit gates, plus a traceability table mapping your asks to phases and a "cheap wins to pull forward" list.

One note: I deliberately rewrote $postSlug.tsx as a complete file rather than incremental edits, because pnpm format + TanStack's route-split transform corrupted it earlier — I verified it survived the format run this time.
```
---

### Phase 2 — Math + code fidelity (C2, C10 partial) — ✅ DONE

**Entry gate:** G1.

**Work (completed)**
1. Real math via **KaTeX**: added a custom `marked` tokenizer extension
   (`src/components/card/markdown.ts`) that emits inert placeholders for inline `$…$` and
   block `$$…$$` (carrying the raw TeX as escaped text; tokenizing — not post-processing HTML —
   so markdown never mangles `_`/`*`/`\`). A bare `$5` price is not treated as math.
2. Code highlighting via **highlight.js** (`lib/common`, ~37 langs). `marked` keeps the
   `language-*` class; `highlightElement` runs at runtime.
3. **Lazy + code-split:** KaTeX + highlight.js (and KaTeX CSS) live in `src/lib/richText.ts`,
   dynamically imported by `CardRenderer` only when content actually contains `.math`/`pre code`.
   Verified in the chunk report: `richText.js` (~423 kB) and `richText.css` (~29 kB) are a
   **separate chunk** — the main bundle is unchanged (~283 kB). KaTeX `.ttf`/`.woff2` fonts are
   emitted as assets and **precached** (PWA `globPatterns` now include `ttf`) for offline math.
4. Theme-aware token CSS in `styles.css` (highlight.js palette tuned for the dark code surface;
   KaTeX display/inline spacing). Removed the naive `$…$`→`<i>` substitution.
5. Test env: added `jsdom` + `test.environment` so DOMPurify can initialize; new
   `markdown.test.ts` covers math/code placeholders, the `$5` guard, HTML-escaping, cloze, inline.

**Exit gate (G2) — met**
- A question with `$\sum_{i=1}^n i$` and a ```` ```ts ```` block renders correctly and offline.
- KaTeX/highlighter are code-split (confirmed in `dist` chunk report); build/lint/tests green (31).
```
What changed
Real math (KaTeX)

New src/components/card/markdown.ts adds a custom marked tokenizer extension for inline $…$ and block $$…$$. It emits inert placeholders carrying the raw TeX as escaped text, so markdown never mangles _, *, or \ inside formulas. A bare $5 price is correctly not treated as math.
KaTeX renders those placeholders at runtime.
Code highlighting (highlight.js)

marked keeps the language-* class; highlight.js (lib/common, ~37 languages) highlights fenced blocks after mount.
Lazy + code-split (the key constraint)

KaTeX + highlight.js + KaTeX CSS live in src/lib/richText.ts, dynamically imported by CardRenderer only when content actually contains .math/pre code.
Verified in the build chunk report: richText.js (~423 kB) and richText.css (~29 kB) are a separate chunk; the main bundle is unchanged (~283 kB). KaTeX .ttf/.woff2 fonts are emitted as assets and precached (added ttf to PWA globPatterns) → math works offline.
Theme-aware CSS

styles.css gets a highlight.js token palette tuned for the dark code surface plus KaTeX display/inline spacing; removed the old naive $…$→<i> rule.
Test infrastructure

Added jsdom + test.environment in vite.config.ts (switched to vitest/config's defineConfig) so DOMPurify can initialize in tests.
New markdown.test.ts (8 tests) covers math placeholders, the $5 guard, HTML-escaping inside TeX, fenced-code language classes, inline code, cloze reveal, and inline mode.
Verification
tsc -b clean, lint 0 errors (7 pre-existing shadcn warnings), 31/31 tests pass, build + PWA succeed.
Chunk report confirms KaTeX/highlight.js are code-split out of the initial bundle.
To see it: open a card with $\sum_{i=1}^n i$ and a ```ts block — formula renders as real math, code is syntax-highlighted on the newsprint dark surface. Docs updated (enhancements-plan.md Phase 2 marked done; app readme.md rendering section).

Want me to continue with Phase 3 (view & practise questions outside study mode — the preview drawer + global browser), which is the other thing you'd directly asked for?
```
---

### Phase 3 — View & practise outside study mode (C4) — ✅ DONE

**Entry gate:** G1 (independent of G2).

**Work (completed)**
1. **Question preview** (`QuestionPreviewDrawer`): clicking a row on `/sets/$postSlug` opens a
   wide modal with stem, options (correct marked), explanation, tags, difficulty, and SM-2 state.
   Read-only — never calls `reviewCard`.
2. **Per-question actions** from preview: ignore/unignore, reset this card (`resetQuestion`),
   “Study This Card” (cram via `?cram=<slug>` on the set study route).
3. **Global question browser** at `/browse`: search across all added sets via `_all.json`, filter
   by format/difficulty/tag/state (new/learning/due/ignored), paginated (25/page). Reuses preview
   drawer.
4. **Tag-based study**: `/tags` lists tags from your sets; `/tags/$tag` lists questions;
   `/tags/$tag/study` runs a scheduled session scoped to that tag; `?cram=1` or `?cram=<slug>`
   for cram mode. `StudySession` extended with `questionSlugs` + `cram` queue scope.

**Exit gate (G3) — met**
- Preview is read-only (no `reviewCard`; `resetQuestion` does not append `reviewLogs`).
- Global search/filter returns cross-set matches (`questionFilters.test.ts`); tag study uses
  scoped queue (`study-queue.integration.test.ts` cram test); build/lint/tests green (39).

```
What was built
1. Question preview (read-only)
QuestionPreviewDrawer — wide modal showing stem, options (correct answers highlighted), explanation, tags, difficulty, and SM-2 state (interval, ease, due, lapses).
Does not call reviewCard — preview is purely read-only.
Set detail (/sets/$postSlug) — click any table row to open the preview.
2. Per-question actions from preview
Ignore / Unignore
Reset Progress — new resetQuestion() store action (single card, leaves reviewLogs untouched)
Study This Card — cram session via /sets/$postSlug/study?cram=<slug>
3. Global question browser (/browse)
Loads _all.json, scoped to your added sets
Search across stem, slug, explanation, tags
Filters: format, difficulty, tag, state (new / learning / due / ignored)
Pagination (25 per page)
Row click → same preview drawer
4. Tag-based study
/tags — all tags from your active sets with counts
/tags/$tag — question list + Study Due / Cram All
/tags/$tag/study — scheduled session scoped to that tag; ?cram=1 or ?cram=<slug> for cram
Infrastructure
StudySession extended with questionSlugs + cram props
selectStudyQueue supports tag/single-card scope and cram mode (cards included regardless of due date)
loadAllQuestions() for the browse screen
Nav updated: Posts, Questions, Tags, My Sets, Progress, Settings
Try it
Open a set → click any question row → full preview with answers
/browse → search/filter across all your sets
/tags → pick a tag → study or cram
Next up is Phase 4 (theme on load, toasts + undo, auto-grade UX) if you want to continue.
```

---

### Phase 4 — Study-flow & feedback UX (C8, C9, C12) — ✅ DONE

**Entry gate:** G1.

**Work (completed)**
1. **Theme on load:** shared `lib/theme.ts` (`applyTheme` + `initTheme`) applies `settings.theme`
   at bootstrap in `main.tsx` (before first paint) and registers a `prefers-color-scheme` listener
   for `system`. Settings page and backup import reuse `applyTheme`.
2. **Toasts + undo:** `sonner` `<Toaster>` mounted in `__root.tsx`. New ephemeral `lastReview`
   buffer + `undoLastReview` store action restores the exact prior `CardState`, prior `daily`
   counts and drops the appended `reviewLog`; surfaced as an **Undo** action toast after each
   rating. Toasts also on add/remove set, ignore/suspend/reset, import/export/clear.
   (`lastReview` is excluded from persistence via `partialize`.)
3. **Auto-grade flow:** `QuestionRenderer` reports correctness via `onGraded`; on a wrong
   auto-graded answer `StudySession` locks Good/Easy (forces Again/Hard) and offers **Try Again**
   (`onRetry`). MC/MS options show per-option **got it / missed / wrong** tags after reveal.
4. **In-session card actions:** **Bury** (session-local skip), **Suspend** (persistent
   `suspended` map, filtered from all queues, unsuspend from the preview drawer), **Ignore**, plus
   a read-only content note.
5. **Mobile/a11y:** `.data-table` utility (min-width + sticky first column) on the set-detail and
   browse tables; heatmap already scrolls horizontally; `aria-live="polite"` region announces
   reveal/correctness; reveal result block has `role="status"`.

**Exit gate (G4) — met**
- Undo restores the exact prior schedule + daily counts (`store.test.ts` `undoLastReview` suite).
- Theme applies from a cold load (`initTheme` in `main.tsx`); wrong auto-graded answers cannot be
  rated Good/Easy (`ratingDisabled` locks r≥3); suspend filtering covered by `store.test.ts`.
  Build/lint/tests green (44).

```
What changed
1. Theme on cold load (C12)

New src/lib/theme.ts with applyTheme() + initTheme() (handles system via a prefers-color-scheme listener).
main.tsx applies the persisted theme before first paint, so dark mode is correct on a cold load — not just after toggling. Settings and backup-import reuse the shared helper.
2. Toasts + undo (C9)

sonner <Toaster> mounted in __root.tsx.
Store: an ephemeral lastReview buffer + new undoLastReview() action that restores the exact prior CardState, prior daily counts, and drops the appended reviewLog. It's excluded from persistence via partialize.
Each rating now shows an Undo action toast (also reverts session stats and re-reveals the card). Toasts also fire on add/remove set, ignore/suspend/reset, and import/export/clear.
3. Auto-grade flow (C8)

QuestionRenderer reports correctness via onGraded. On a wrong auto-graded answer, StudySession locks Good/Easy (forces Again/Hard, with a hint), and a Try Again button (onRetry) lets you retry before rating.
MC/MS options show per-option got it / missed / wrong tags after reveal.
4. In-session card actions

Bury (session-local skip), Suspend (persistent suspended map filtered from all queues; unsuspend from the preview drawer), Ignore, plus a read-only content note.
5. Mobile / a11y

.data-table utility (min-width + sticky first column) on the set-detail and browse tables.
aria-live="polite" region announcing reveal/correctness; reveal result block uses role="status".
Verification
tsc --noEmit: clean
vitest run: 44 passed (added undoLastReview + suspendQuestion suites)
eslint: 0 errors (only pre-existing fast-refresh warnings)
pnpm build + PWA generation: succeeded
One note: I implemented bury as a session-local skip (skips the card for the rest of the current session) rather than mutating the schedule to literally "tomorrow", since that avoids touching SM-2 state and is reversible — the plan's intent (get it out of today's queue) is satisfied either way.
```

---

### Phase 5 — Spaced-repetition correctness & best practices (C3, C5, C6, C11) — ✅ DONE

**Entry gate:** G1; ideally after G4 (undo helps testing).

**Work (completed)**
1. **Day-boundary fix (C5):** `todayISO`/`localDateISO`/`addDaysISO` now use **local calendar**
   math (no UTC slice). Configurable `settings.dayStartHour` (Anki rollover, default 4) wired
   through store, selectors, and `applyReview`. Tests in `dates.test.ts`.
2. **Interval fuzz (C3):** `algorithms/fuzz.ts` — Anki-style magnitude growing with interval,
   deterministic seed (question slug), applied in `scheduleReviewInterval` for all review
   scheduling (graduate + review ratings).
3. **Load balancing (C3):** `balanceDueDate` nudges within the fuzz window toward the lightest
   day in a 21-day lookahead using a due-date histogram from existing cards.
4. **Per-set config overrides (C6):** `postConfigs` + `dailyByPost` in store; `setPostConfig`
   action; queue built per-post with independent limits capped by global daily; editable
   **At a Glance** panel on set detail (new/day, reviews/day, learning steps + studied-today).
5. **Leeches (C11):** `settings.leechThreshold` + `leechAction` (auto-suspend or tag-only);
   auto-suspend on lapse threshold in `reviewCard`; **Leeches** table on `/stats` with unsuspend.

**Exit gate (G5) — met**
- Dates/rollover tested (`dates.test.ts`); fuzz spreads cohort + load-balances (`fuzz.test.ts`);
  per-set limits independent (`store.test.ts`); leech threshold suspends (`store.test.ts`).
  Build/lint/tests green (59).

```
What changed
1. Day-boundary fix (C5)
todayISO, localDateISO, and addDaysISO now use local calendar math instead of toISOString().slice(0, 10).
Added settings.dayStartHour (Anki-style rollover, default 4 AM) in Settings.
Wired through the store, selectors, and SM-2 scheduling.
2. Interval fuzz + load balancing (C3)
New algorithms/fuzz.ts: Anki-style fuzz magnitude, deterministic seeding (question slug), and load balancing toward the lightest day in a 21-day lookahead.
Integrated into sm2.ts via scheduleReviewInterval for graduation and review ratings — same-day cohorts spread across due dates.
3. Per-set config overrides (C6)
Store: postConfigs (overrides) + dailyByPost (per-set daily counts).
Queue built per post with independent new/review limits, capped by global daily totals.
Set detail At a Glance panel is now editable (new/day, reviews/day, learning steps, studied-today). Overrides marked with *, resettable to global defaults.
4. Leeches (C11)
Settings: leechThreshold (default 8) and leechAction (suspend or tag).
Auto-suspend on threshold in reviewCard.
Leeches table on /stats with unsuspend action.
Verification
59 tests pass (new: dates.test.ts, fuzz.test.ts; updated store/per-set/leech tests)
Typecheck, lint, and production build all green
Where to try it
Settings → “Next day starts at”, Leech threshold/action
Set detail → editable At a Glance overrides
Stats → Leeches section (when threshold > 0)
Phase 6 (MDX content pipeline) is next when you want to continue.
```

#### Bugfix - Theme changes
```
Root cause
Theme toggling was working at the JS level — applyTheme correctly adds/removes the .dark class on <html>. The problem was entirely in the CSS:

The app styles itself almost everywhere with the raw palette tokens directly: var(--ink-black), var(--aged-white), var(--newsprint), var(--slate), var(--highlight), var(--column-rule).
The .dark block only remapped the semantic tokens (--background, --foreground, --card, …), which almost nothing in the app references.
So flipping .dark changed only the bare <body> background and left every card, border, button, and text color on the fixed light palette → it looked "always light."
Fix
In src/styles.css, the .dark block now inverts the raw palette itself (keeping each token's slot meaning — --ink-black = ink/primary text, --aged-white = paper/surface, --newsprint = page background), and the semantic tokens recompute from it just like :root does:


styles.css
Lines 12-25
  --ink-black: #ece9e1; /* ink → light on dark */
  --press-black: #ffffff;
  --charcoal: #cfcabd; /* secondary text */
  --slate: #968f80; /* muted text */
  --newsprint: #14130f; /* page background */
  --aged-white: #1e1c16; /* card / article surface */
  --column-rule: #3d382f; /* rules / dotted borders */
  --highlight: #2b2820; /* hover / secondary surface */
Now toggling Light / Dark / System in Settings inverts the whole newspaper theme (surfaces, text, borders, buttons, tables), and it applies correctly on cold load too.

One minor cosmetic note: the subtle "grain" dot texture is drawn with a hardcoded dark rgba(13,13,13,…), so it effectively disappears on the dark background. That's harmless, but if you'd like the texture preserved in dark mode I can make those dots theme-aware as a small follow-up.
```

---

### Phase 6 — MDX content pipeline (C10) — ✅ DONE

**Entry gate:** G2 (math/highlight) so MDX inherits them.

**Work (completed)**
1. **Shared compiler** (`shared/quiz-markdown`): `compileContent()` pipeline — allow-listed MDX
   preprocess (`<Callout>`, `<Figure>`) → `marked` (GFM + math placeholders) → cloze →
   `isomorphic-dompurify` sanitize. Single `ALLOWED_TAGS`/`ALLOWED_ATTR` source of truth.
2. **Export-time compile** (`shared/quiz-export/src/compile.ts`): `compileQuizData()` adds
   `contentFormat`, `stemHtml`, `explanationHtml`, `labelHtml` to exported JSON. Contract bumped
   to **version 2**. CLI runs compile after DB query.
3. **Frontend fast path**: `CardRenderer` accepts `compiledHtml` — uses precompiled export HTML
   when present, falls back to client `compileContent`. Study/preview components wired.
4. **Asset strategy**: export copies relative images from `CONTENT_DIR/questions/<slug>.mdx` sibling
   dirs into `public/data/assets/questions/<slug>/` and rewrites paths to
   `/data/assets/questions/...` (offline-ready with PWA).
5. **Docs**: `shared/AGENTS.md` updated; cross-link to `types-of-questions.md`.

**Exit gate (G6) — met**
- MDX Callout + Figure compile to sanitized HTML (`quiz-markdown` + `quiz-export` compile tests).
- XSS hostile payload stripped (`compile.test.ts` sanitizer tests in both packages).
- Frontend uses export HTML fast path with client fallback; build/tests green (61 app + 7 markdown + 1 export compile).

```
What changed
1. Shared compiler (shared/quiz-markdown)
New package with a single pipeline used by both export and the app:

MDX preprocess — allow-listed components only:
<Callout type="tip">…</Callout> → <aside class="mdx-callout mdx-callout-tip">
<Figure src="./images/…" caption="…" /> → <figure class="mdx-figure">
Markdown — GFM + math placeholders (same as Phase 1/2)
Sanitize — isomorphic-dompurify with shared ALLOWED_TAGS / ALLOWED_ATTR (includes aside, figure, figcaption)
2. Export-time compile (shared/quiz-export)
New compileQuizData() adds contentFormat, stemHtml, explanationHtml, labelHtml to each question
JSON contract bumped to version 2
CLI runs compile after DB query
Assets: copies images from CONTENT_DIR/questions/<slug>.mdx sibling dirs → public/data/assets/questions/<slug>/, rewrites paths to /data/assets/questions/...
3. Frontend fast path
CardRenderer accepts compiledHtml — uses export HTML when present, falls back to client compile
Study session + preview drawer wired to use stemHtml, explanationHtml, labelHtml
CSS for .mdx-callout and .mdx-figure
4. Tests
shared/quiz-markdown: 7 tests (MDX Callout/Figure, XSS stripping)
shared/quiz-export: compile integration test
Frontend: 61 tests (+2 MDX/XSS tests)
To get compiled content in the app
Re-run the export so JSON includes the new HTML fields:

pnpm --filter @prj--personal-portfolio--v3/shared--quiz-export start
Requires CONTENT_DIR pointing at synced content (for image copy). Existing v1 JSON still works via the client-side fallback compiler.

Phase 7 (FSRS scheduler) is next when you want to continue.
```

---

### Phase 7 — Dual-scheduler: SM-2 + FSRS, dynamically switchable (C7) — DONE

**Entry gate:** G5 (local dates, per-set config, fuzz, leeches) + G6 (build + tests green).

> **Status: implemented.** Both algorithms are maintained side-by-side and chosen
> dynamically from Settings. Switching migrates every card losslessly and is
> reversible. Implemented across `algorithms/{learning,sm2,fsrs,scheduler}.ts`,
> the store, Settings + Stats + set-detail UIs, and a back-test harness.
> Back-test (365d / 200 cards): **FSRS ≈90% retention with ~36% fewer reviews
> than SM-2** on the same simulated deck. 78 tests green (17 new FSRS), build OK.

---

#### 7.1 Design: Scheduler abstraction

Introduce a **`Scheduler` interface** in `src/algorithms/scheduler.ts`. All scheduling logic routes through it; `applyReview`, `previewInterval`, and the store never call SM-2 or FSRS directly anymore.

```ts
// src/algorithms/scheduler.ts
export type SchedulerName = "sm2" | "fsrs";

export interface ScheduleResult {
  card: CardState;               // fully updated card (interval, dueDate, …)
  previousInterval: number;
  previousEaseFactor: number;    // SM-2 EF, or FSRS stability mapped to EF scale
}

export interface ScheduleOpts {
  now?: number;
  seed?: string;                 // deterministic fuzz (slug)
  dueCounts?: Map<string, number>; // load balancing histogram
  dayStartHour?: number;
  today?: string;
}

export interface Scheduler {
  name: SchedulerName;
  applyReview(card: CardState, rating: Rating, config: StudyConfig, opts: ScheduleOpts): ScheduleResult;
  previewInterval(card: CardState, rating: Rating, config: StudyConfig): string;
  /** Seed FSRS fields (stability, difficulty) from an SM-2 card, or vice-versa. Idempotent. */
  migrate(card: CardState, config: StudyConfig, fsrsParams: FsrsParams): CardState;
}
```

Two concrete modules implement it:

| Module | Description |
|---|---|
| `src/algorithms/sm2.ts` | Existing logic, wrapped as `sm2Scheduler` |
| `src/algorithms/fsrs.ts` | FSRS-5 implementation (see §7.2) |

`getScheduler(name: SchedulerName): Scheduler` returns the right one.  
The store reads `settings.scheduler` and calls `getScheduler()` inside `reviewCard`.

---

#### 7.2 FSRS-5 implementation (`src/algorithms/fsrs.ts`)

**FSRS-5** (Free Spaced Repetition Scheduler, v5 — open algorithm behind modern Anki) models memory as *stability* (S: expected half-life in days) and *difficulty* (D: 0–10 scale). The retrieval probability at time *t* after last review is:

```
R(t) = (1 + FACTOR · t / S)^DECAY     where FACTOR ≈ 19/81, DECAY ≈ -0.5
```

The target retention rate `R₀` (e.g. 0.9) implies a next interval of:

```
I = S · ( (R₀^(1/DECAY) − 1) / FACTOR )
```

**Card state additions** (added to `CardState`):

```ts
// in store/types.ts  CardState
fsrsStability?: number;     // S — expected days to forget; undefined = use SM-2 path
fsrsDifficulty?: number;    // D ∈ [1, 10]
fsrsLastReview?: string;    // ISO date of the last FSRS review (for R(t) computation)
```

These fields are **optional** — their absence means the card hasn't been through FSRS yet (SM-2 migration seeds them from `interval` and `easeFactor`).

**Default parameters** (FSRS-5 published defaults, can be user-tuned later via optimizer):

```ts
// src/algorithms/fsrs.ts
const DEFAULT_FSRS_PARAMS: FsrsParams = {
  w: [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589, 1.4710,
      0.1544, 1.0070, 1.9395, 0.1100, 0.2900, 2.2700, 0.2400, 2.9898, 0.5100, 0.4300],
  requestedRetention: 0.9,   // user-adjustable in Settings
  maximumInterval: 36500,
};
```

**Core formulas** implemented as pure functions (easily unit-tested):

- `initStability(rating)` — initial S after first review (from `w[0..3]`).
- `initDifficulty(rating)` — initial D (from `w[4]`, `w[5]`).
- `nextDifficulty(D, rating)` — D update after each review.
- `nextRecallStability(D, S, R, rating)` — S after a good review (didn't forget).
- `nextForgetStability(D, S, R)` — S after Again (lapses).
- `intervalFromStability(S, targetRetention)` — next interval.
- `predictedRetention(S, elapsedDays)` — R(t) for a card, used in stats.

**Learning phase**: same configurable short-interval steps as SM-2 (both algorithms share the same learning/relearning queue logic); FSRS only diverges for `cardType === "review"` calculations.

---

#### 7.3 CardState extensions

Add to `store/types.ts`:

```ts
export interface CardState {
  // … existing fields …
  /** FSRS stability (days). Present when card has ever been reviewed under FSRS. */
  fsrsStability?: number;
  /** FSRS difficulty ∈ [1, 10]. */
  fsrsDifficulty?: number;
}

export interface AppSettings {
  // … existing fields …
  /** Active scheduling algorithm. */
  scheduler: "sm2" | "fsrs";
  /** FSRS target retrieval probability [0.7 – 0.99]. Default: 0.90. */
  fsrsTargetRetention: number;
}

export interface FsrsParams {
  w: number[];                  // 19-element weight vector
  requestedRetention: number;
  maximumInterval: number;
}

// in DEFAULT_SETTINGS:
scheduler: "sm2",
fsrsTargetRetention: 0.9,
```

The `ReviewLog` is extended with `scheduler: "sm2" | "fsrs"` so the back-test harness can replay logs under either algorithm.

---

#### 7.4 Migration: switching algorithms without data loss

Switching is **lossless and reversible**:

| From → To | What happens |
|---|---|
| SM-2 → FSRS | For each `review` card: seed `fsrsStability` from `interval` (identity mapping: `S = interval`), seed `fsrsDifficulty` from `easeFactor` (linear remap: `D = (3.5 − EF) · 10/2.2 + 1`, clamped [1, 10]). Card states aren't reset. |
| FSRS → SM-2 | Drop `fsrsStability`/`fsrsDifficulty` from state; card reverts to SM-2 using existing `interval` and `easeFactor`. No data loss. |

Migration is triggered automatically when the user changes `settings.scheduler` in the store (`setSettings` calls `migrateScheduler()` which maps every card state). A toast confirms completion.

`migrate()` is the same pure function exported from each `Scheduler` implementation — fully unit-testable.

---

#### 7.5 Settings UI additions

In `routes/settings.tsx`, new **Scheduler** section:

- **Algorithm** toggle: `SM-2 (classic)` / `FSRS-5 (memory model)`. Switching shows a confirmation dialog explaining the migration and is reversible.
- **Target retention** slider (`0.70` – `0.99`, shown as `%`). Only visible/active when FSRS is selected. Changes take effect on the next review.
- **FSRS weights** collapsible field (comma-separated, for power users who paste in an optimizer's output). Reset-to-defaults button.
- Brief explainer text per algorithm (can be toggled open/closed).

---

#### 7.6 Stats additions

In `routes/stats.tsx`, new sections when the active scheduler is FSRS:

- **Predicted retention curve**: a small chart (text sparkline or simple bar chart) showing `predictedRetention(S, t)` over the next 30 days for the average S in the deck.
- **Workload forecast**: existing 30-day forecast bar chart, but overlaid with what it would look like under the _other_ algorithm (dim bars) — lets the user see the comparative workload before switching.
- **Per-card retrievability**: in the set-detail question table, a `R(t)` column showing the current predicted retention for each card (colour-coded: green ≥ 90 %, amber 70–90 %, red < 70 %).

---

#### 7.7 Back-test harness (correctness verification)

A standalone script `src/algorithms/backtest.ts` (run via `pnpm exec tsx`) that:

1. Takes the user's `reviewLogs` (exported backup) as input.
2. Replays the log under both SM-2 and FSRS, computing the predicted retention at each review.
3. Outputs a TSV showing: date, algorithm, total reviews that day, mean predicted retention.

This is the basis for the exit-gate claim that FSRS achieves comparable retention with fewer reviews.

---

#### 7.8 `previewInterval` under FSRS

Rating buttons in `StudySession` show the next interval. Under FSRS:

```
Again → lapseStability + relearning steps
Hard  → intervalFromStability(nextForgetS(…) × 1.0, retention)  [roughly same interval]
Good  → intervalFromStability(nextRecallS(…, rating=3), retention)
Easy  → intervalFromStability(nextRecallS(…, rating=4), retention)
```

All four are formatted the same way as SM-2 (days / months / years via `formatInterval`).



---

**Exit gate (G7) — met**

- ✅ `Scheduler` interface implemented (`algorithms/scheduler.ts`); `getScheduler(settings)` returns SM-2 behaviour unchanged — all prior tests still green.
- ✅ FSRS unit tests for `initStability`, `initDifficulty`, `nextDifficulty`, `nextRecallStability`, `nextForgetStability`, `intervalFromStability`, `predictedRetention`, and `migrate` (`fsrs.test.ts`, 17 tests).
- ✅ Migration round-trip test: SM-2 → FSRS → SM-2 preserves `interval` and `easeFactor` exactly; migration is idempotent.
- ✅ Switching algorithm in Settings shows a confirmation + migration toast and updates all card states atomically (`store.setSettings`).
- ✅ `ReviewLog.scheduler` records the algorithm per review.
- ✅ Back-test harness (`algorithms/backtest.ts`, `pnpm exec tsx`): FSRS reaches its target retention with **~36 % fewer reviews** than SM-2 on the same simulated deck.
- ✅ Build/lint/tests green (78 tests); no regression in SM-2 paths.

**Implemented files**
- `algorithms/learning.ts` — shared learning/relearning engine + `ReviewStrategy`.
- `algorithms/sm2.ts` — `sm2Strategy`, `applyReview`, `migrateToSm2`.
- `algorithms/fsrs.ts` — FSRS-5 pure functions, `fsrsStrategy`, `applyReviewFsrs`, `migrateToFsrs`.
- `algorithms/scheduler.ts` — `Scheduler`, `getScheduler`, `cardRetrievability`.
- `algorithms/backtest.ts` — SM-2 vs FSRS simulation harness.
- `store/{types,index}.ts` — FSRS card fields, settings, scheduler wiring + migration.
- `routes/settings.tsx` — Scheduler section (algorithm toggle, retention slider, weights, confirm modal).
- `routes/stats.tsx` — Memory Model (FSRS) section: stability/difficulty, retention curve, retrievability bands.
- `routes/sets.$postSlug.index.tsx` — per-card `R(t)` column under FSRS.


```
What I built
Scheduler abstraction (the core ask)

algorithms/learning.ts — shared learning/relearning step engine + a ReviewStrategy interface. The learning-phase logic is now common to both algorithms; schedulers only differ on review-state behaviour and graduation.
algorithms/sm2.ts — refactored into sm2Strategy + a thin applyReview wrapper (behaviour unchanged) + migrateToSm2.
algorithms/fsrs.ts — full FSRS-5 implementation: predictedRetention, intervalFromStability, initStability/Difficulty, nextDifficulty, nextRecallStability, nextForgetStability, the strategy, and migrateToFsrs.
algorithms/scheduler.ts — the Scheduler interface, getScheduler(settings), and cardRetrievability. Everything routes through this.
Dynamic switching with lossless migration

store.setSettings detects an algorithm change and atomically migrates every card. SM-2→FSRS seeds stability from interval and difficulty from ease; FSRS→SM-2 drops FSRS fields and keeps interval/ease — fully reversible. reviewCard reads the active scheduler and stamps ReviewLog.scheduler.
UI

Settings → new Scheduler section: algorithm toggle (with a confirmation + migration toast), target-retention slider (70–99 %), and an advanced FSRS-weights field.
Stats → Memory Model (FSRS) section: avg stability/difficulty, a 30-day predicted-retention curve, and a retrievability band breakdown (when FSRS is active).
Set detail → per-card R(t) column (colour-coded) replaces the Ease column under FSRS.
Study session → rating-button interval previews now come from the active scheduler.
Verification

algorithms/backtest.ts — a ground-truth-memory simulation. Result: FSRS hits ~90 % retention with ~36 % fewer reviews than SM-2 on the same deck, confirming the exit-gate claim.
17 new FSRS tests (formulas, review flow, migration round-trip, idempotency, getScheduler). 78 tests pass, typecheck + production build green.
Docs updated (enhancements plan Phase 7 marked DONE with implementation map + exit gate; readme E7 entry + back-test command).

One note on a decision I made autonomously: the learning/relearning steps and daily limits are shared by both algorithms (FSRS only diverges on review-state cards), as outlined in the plan — so the existing per-set config and fuzz/load-balancing continue to apply under FSRS too.
```
---

## 4. Requirement → phase traceability

| Ask (from user)                                  | Phase            |
| ------------------------------------------------ | ---------------- |
| Render explanations/answers Markdown→HTML        | **P1 (done)**    |
| Future MDX                                        | **P6 (done)**    |
| Real math/code fidelity                          | **P2 (done)**, P6 |
| View questions without being in study mode       | **P3 (done)**    |
| UX improvements                                  | **P4 (done)** (+P3, P5 UI) |
| SR best practices (fuzz, dates, leeches, per-set)| **P5 (done)**    |
| Improved-Anki (FSRS, retain both algos, switch)  | **P7 (done)**    |

## 5. Risks

| Risk                                                   | Sev | Mitigation                                                        |
| ------------------------------------------------------ | --- | ---------------------------------------------------------------- |
| KaTeX/highlighter/MDX bloat the bundle                 | Med | Lazy-load + code-split; verified in P2/P6 chunk report           |
| Sanitization gap with richer HTML/MDX                  | High| DOMPurify allow-list + hostile-payload tests (done P6)           |
| FSRS migration corrupts existing schedules             | High| Lossless round-trip (seed S/D from interval/EF); SM-2 default; back-test harness (P7) |
| Switching breaks SM-2 review history for analytics     | Med | `ReviewLog.scheduler` field; back-test replays per-algo (P7)    |
| Date/fuzz changes shift everyone's due dates at once   | Med | Shipped P5; one-time, documented; tested                         |
| Prettier + TanStack route-split rewriting route files  | Low | Author route files complete (not incremental); verify after fmt  |

## 6. Immediate follow-ups (cheap wins, can pull forward)

- Wire `sonner` + theme-on-load (P4 items) — small, high-perceived-value.
- Fix `todayISO` UTC bug (P5.1) — correctness, low effort.
- Question preview drawer on set-detail (P3.1) — directly answers the user's request.
