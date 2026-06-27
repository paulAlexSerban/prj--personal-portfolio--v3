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

---

### Phase 7 — FSRS scheduler option (C7) — the "better than Anki" core

**Entry gate:** G5 (clean SM-2 + dates + per-set config first).

**Work**
1. Introduce a **scheduler abstraction**: `Scheduler` interface with SM-2 and **FSRS**
   implementations; `applyReview`/`previewInterval` delegate to the selected scheduler.
2. Implement FSRS (open algorithm): store per-card stability/difficulty; expose a
   **target retention** setting; default parameters with room for later optimisation from the
   user's own `reviewLogs`.
3. Settings: choose algorithm (SM-2 / FSRS) + retention target; migrate existing `CardState`
   (seed FSRS stability/difficulty from current interval/ease) without resetting progress.
4. Stats: show predicted retention and workload under the chosen scheduler.

**Exit gate (G7)**
- FSRS selectable; switching schedulers migrates cards without data loss (test); simulated
  review history shows FSRS achieving target retention with **fewer reviews** than SM-2 on the
  same deck (back-test harness).

---

## 4. Requirement → phase traceability

| Ask (from user)                                  | Phase            |
| ------------------------------------------------ | ---------------- |
| Render explanations/answers Markdown→HTML        | **P1 (done)**    |
| Future MDX                                        | P6               |
| Real math/code fidelity                          | P2 (math/code), P6 |
| View questions without being in study mode       | **P3 (done)**    |
| UX improvements                                  | P4 (+P3, P5 UI)  |
| SR best practices (fuzz, dates, leeches, per-set)| P5               |
| Improved-Anki (FSRS, retention target)           | P7               |

## 5. Risks

| Risk                                                   | Sev | Mitigation                                                        |
| ------------------------------------------------------ | --- | ---------------------------------------------------------------- |
| KaTeX/highlighter/MDX bloat the bundle                 | Med | Lazy-load + code-split; verify chunk report each phase           |
| Sanitization gap with richer HTML/MDX                  | High| DOMPurify allow-list + hostile-payload tests in P6              |
| FSRS migration corrupts existing schedules             | High| Versioned migration, keep SM-2 default, back-test harness (P7) |
| Date/fuzz changes shift everyone's due dates at once   | Med | Ship behind a flag; one-time, documented; tests around rollover |
| Prettier + TanStack route-split rewriting route files  | Low | Author route files complete (not incremental); verify after fmt |

## 6. Immediate follow-ups (cheap wins, can pull forward)

- Wire `sonner` + theme-on-load (P4 items) — small, high-perceived-value.
- Fix `todayISO` UTC bug (P5.1) — correctness, low effort.
- Question preview drawer on set-detail (P3.1) — directly answers the user's request.
