# Quiz Web App — enhancements & "better-than-Anki" plan (phased, gated)

**Status:** ✅ all 7 phases implemented (this is now a historical record, not an open plan)
**Predecessor:** [`quiz-web-app-refactor-plan.md`](./quiz-web-app-refactor-plan.md) (the CSR/zustand/JSON refactor)
**App:** [`frontend/apps/quiz-web-app`](../../frontend/apps/quiz-web-app)

This plan covers what came **after** parity-with-the-POC: content rendering fidelity
(Markdown → MDX), viewing/practising questions outside study mode, UX polish, and
spaced-repetition quality improvements aimed at surpassing Anki for this content.

> **What to read instead, for current behaviour:** the app
> [`readme.md`](../../frontend/apps/quiz-web-app/readme.md) (user-facing) and
> [`AGENTS.md`](../../frontend/apps/quiz-web-app/AGENTS.md) (architecture). This
> file kept the *why* and the per-phase exit gates; the verbose
> session-by-session change logs have been trimmed.

## TL;DR — what shipped

| Phase | Outcome |
| --- | --- |
| P1 | Markdown rendering (was rendered as raw HTML → literal `##`/backticks). |
| P2 | Real math (KaTeX) + code highlighting (highlight.js), lazy-loaded & offline. |
| P3 | View/preview/search/cram questions **outside** a study session; tag-based study. |
| P4 | UX: theme-on-load, undo toasts, auto-grade locking, bury/suspend/ignore, a11y. |
| P5 | SR correctness: local day boundary, interval fuzz + load balancing, per-set limits, leeches. |
| P6 | MDX content pipeline (`shared/quiz-markdown` + export compile, asset copy). |
| P7 | Dual scheduler: SM-2 **and** FSRS-5, runtime-switchable with lossless migration. |

---

## 1. Brutally honest critique (the state that motivated this plan)

> This is the **original** critique taken right after the refactor (17 tests, before
> any enhancement). Every item C1–C12 below has since been addressed — see the
> phase that fixed it. Kept verbatim because it explains *why* each phase exists.

At that point the app built, typechecked, linted, tested (17), and was a clean CSR +
zustand + static-JSON architecture — but **functional and shallow**. The biggest
problems, in order of severity (→ fixing phase):

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

**Fixed by:** C1 → P1 · C2,C10 → P2/P6 · C4 → P3 · C8,C9,C12 → P4 · C3,C5,C6,C11 → P5 · C7 → P7.

What's **good** and was preserved: clean content/progress separation (slug-keyed
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

> **Decision:** *Bury* is a session-local skip (out of today's queue) rather than
> a schedule mutation — it avoids touching scheduler state and is reversible.

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

> **Follow-up bugfix (theme):** dark mode only flipped `<body>` because the app
> styles from raw palette tokens (`--ink-black`, `--aged-white`, …) while `.dark`
> only remapped the rarely-used semantic tokens. Fixed by having `.dark` invert
> the **raw palette** itself in `styles.css` (each token keeps its slot meaning).
> Known cosmetic gap: the "grain" dot texture uses a hardcoded dark `rgba`, so it
> disappears on the dark background (harmless).

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

> **To get compiled content in the app**, re-run the export so JSON includes the
> new HTML fields (needs `CONTENT_DIR` for image copy):
> `pnpm --filter @prj--personal-portfolio--v3/shared--quiz-export start`.
> Existing v1 JSON still works via the client-side fallback compiler.

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

> **Decision:** learning/relearning steps and daily limits are shared by both
> algorithms (FSRS only diverges on review-state cards), so per-set config and
> fuzz/load-balancing apply under FSRS too.

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

## 6. Remaining known gaps (not yet addressed)

All P1–P7 work is shipped. Honest leftovers, none blocking:

- **No FSRS parameter optimizer.** Weights are the published defaults, hand-editable
  only; there is no per-user fitting from review history.
- **`multiple_select` grading is all-or-nothing.** No partial credit.
- **Dark-mode "grain" texture** uses a hardcoded `rgba`, so it disappears on dark.
- **a11y is improved, not audited.** No formal screen-reader pass.
- **No LLM/free-text auto-grading** (explicit non-goal).
