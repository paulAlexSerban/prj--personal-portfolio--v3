# Quiz Web App (`frontend/apps/quiz-web-app/`)

Strict **client-side-rendered** (no SSR) React 19 app for spaced-repetition
flashcard study. Consumes static JSON emitted by `shared--quiz-export`; all user
progress lives in the browser (zustand + `localStorage`). No backend, no accounts.

> User-facing overview, routes, and commands live in [`readme.md`](./readme.md).
> This file is the agent map: architecture, invariants, and where to change things.

## Architecture

```
content.db ──(shared/quiz-export CLI)──► public/data/*.json ──(fetch)──► content loader
                                                                              │
user progress (zustand + persist) ── join by question slug ──► study UI ◄────┘
```

- **Content is read-only** and comes from JSON; **never** author/edit question
  content here. Progress is keyed by **question slug** (stable), never by uid.
- **CSR-only.** No `server.ts`/SSR shell. `main.tsx` → `RouterProvider`; routes
  are file-based (`src/routes/*`, `routeTree.gen.ts` is generated — don't hand-edit).
- **Presentation lives in `shared--ui`, orchestration lives here.** The quiz UI
  "blocks" (`CardRenderer`, `QuestionRenderer`, `StudyCard`, `QuestionPreview`,
  `SessionEndView`, `NothingDueView`) are pure, props-driven components in
  `shared--ui` (`./blocks`, with Storybook stories). The app supplies thin
  **containers** that read the store/data via **hooks** and pass props down. Don't
  put store/data access in a block, and don't put presentation in a container.

## Key directories

| Path                     | Role                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `src/routes/`            | File-based TanStack routes (browse, sets, study, tags, stats, settings)                    |
| `src/containers/`        | Wire store + data + hooks to `shared--ui` blocks (`StudySession`, `QuestionPreviewDrawer`) |
| `src/hooks/`             | Orchestration: `useStudySession`, `useQuestionPreview`, `useStudySetActions`               |
| `src/store/`             | Zustand store (`index.ts`), `types.ts`, `selectors.ts` — slug-keyed progress               |
| `src/algorithms/`        | Schedulers + queue/intervals/fuzz (see below)                                              |
| `src/components/layout/` | App-specific chrome only (`Masthead`, `PageLayout`) — generic UI comes from `shared--ui`   |
| `src/data/`              | `loadQuizData.ts` — fetches `/data/*.json` (typed via export contract)                     |
| `src/lib/`               | App-local helpers: `theme.ts`, `postConfig.ts`, `questionFilters.ts`                       |
| `src/utils/`             | `dates.ts` — rollover-aware local day math (`todayISO`/`studyDayISO`)                      |
| `public/data/`           | Generated JSON (do not edit by hand; regenerate via the export CLI)                        |

> Markdown/math/code rendering (`lib/markdown.ts`, `lib/richText.ts` — KaTeX +
> highlight.js lazy loaders) lives in **`shared--ui`**, not here. Compilation goes
> through **`shared--quiz-markdown`**.

## Scheduling (`src/algorithms/`)

Two algorithms, switchable at runtime via `settings.scheduler`:

- `learning.ts` — shared learning/relearning step engine + `ReviewStrategy` interface.
- `sm2.ts` — SM-2 strategy (`applyReview`, `migrateToSm2`).
- `fsrs.ts` — FSRS-5 strategy + pure functions (`applyReviewFsrs`, `migrateToFsrs`).
- `scheduler.ts` — `Scheduler` interface + `getScheduler(settings)`; **all** review/
  preview/migration must route through this, not the algorithms directly.
- `queue.ts` / `fuzz.ts` / `intervals.ts` — queue building, interval fuzz + load
  balancing, interval formatting.
- `backtest.ts` — `pnpm exec tsx src/algorithms/backtest.ts` SM-2 vs FSRS simulation.

Switching algorithms migrates every card losslessly in `store.setSettings` and is
reversible (SM-2 keeps interval/ease; FSRS seeds stability/difficulty from them).

## Conventions / invariants

- Use `@/` path alias for intra-app imports; use workspace package names for shared
  libraries (`shared--quiz-export/contract`, `shared--ui`, `shared--ui/blocks`,
  `shared--quiz-markdown`).
- **New quiz UI = a block in `shared--ui` + a container here.** Keep blocks pure
  (props in, callbacks out, no store import); put store/data orchestration in a
  `hooks/use*.ts` consumed by a `containers/*.tsx`.
- Add a question to a session only through `selectStudyQueue`; it already drops
  ignored + suspended cards and applies per-set/global daily limits.
- Markdown/MDX rendering goes through `shared--quiz-markdown` (export-time compiled
  HTML is the fast path; client compile is the fallback). The renderer components
  and the DOMPurify allow-list live in `shared--ui` / `shared--quiz-markdown` — not
  here.
- Dates: use `utils/dates.ts` (`todayISO`/`studyDayISO` honour the rollover hour);
  never `new Date().toISOString().slice(0,10)`.

## Build & data

```bash
# regenerate static JSON after a content ingest, then build the CSR bundle + PWA
pnpm --filter @prj--personal-portfolio--v3/shared--quiz-export start
pnpm --filter @prj--personal-portfolio--v3/frontend--quiz-web-app build
```

Per-package checks (the app uses TS 5.x + Vite types, so it is typechecked
per-filter, not via the root `tsc -b` project graph):

```bash
pnpm --filter @prj--personal-portfolio--v3/frontend--quiz-web-app typecheck
pnpm --filter @prj--personal-portfolio--v3/frontend--quiz-web-app test
```

## Related docs

- `_docs/architectural-knowledge-management/spaced-repetition-algorithms-reference.md` — SM-2 + FSRS-5 behaviour, weights, Easy intervals, tuning.
- `_docs/02 plans/quiz-web-app-refactor-plan.md` — original CSR refactor + export.
- `_docs/02 plans/quiz-web-app-enhancements-plan.md` — markdown/MDX, SR best
  practices, dual scheduler (FSRS) enhancement phases.
- `shared/ui/readme.md` — the UI kit + **blocks** this app composes (incl. Storybook).
- `shared/quiz-export/readme.md` — the DB → JSON contract this app consumes.
- `shared/quiz-markdown/readme.md` — the Markdown/MDX → safe-HTML pipeline.
- `shared/AGENTS.md` / `shared/readme.md` — all shared packages.
- `tools/readme.md` — the content pipeline that fills `content.db` before export.
