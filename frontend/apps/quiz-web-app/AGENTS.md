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

## Key directories

| Path              | Role                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `src/routes/`     | File-based TanStack routes (browse, sets, study, tags, stats, settings)      |
| `src/store/`      | Zustand store (`index.ts`), `types.ts`, `selectors.ts` — slug-keyed progress |
| `src/algorithms/` | Schedulers + queue/intervals/fuzz (see below)                                |
| `src/components/` | `card/` (markdown render), `study/`, `question/`, `layout/`, `ui/` (shadcn)  |
| `src/data/`       | `loadQuizData.ts` — fetches `/data/*.json` (typed via export contract)       |
| `src/lib/`        | theme, post-config, rich-text (KaTeX/highlight.js lazy loaders)              |
| `public/data/`    | Generated JSON (do not edit by hand; regenerate via the export CLI)          |

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

- Use `@/` path alias for intra-app imports; use the workspace package name
  `@prj--personal-portfolio--v3/shared--quiz-export/contract` for content types
  (never re-declare the contract).
- Add a question to a session only through `selectStudyQueue`; it already drops
  ignored + suspended cards and applies per-set/global daily limits.
- Markdown/MDX rendering goes through `shared--quiz-markdown` (export-time compiled
  HTML is the fast path; client compile is the fallback). Keep the DOMPurify
  allow-list in `shared--quiz-markdown`, not here.
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

- `_docs/02 plans/quiz-web-app-refactor-plan.md` — original CSR refactor + export.
- `_docs/02 plans/quiz-web-app-enhancements-plan.md` — markdown/MDX, SR best
  practices, dual scheduler (FSRS) enhancement phases.
- `shared/AGENTS.md` — `quiz-export` + `quiz-markdown` packages.
