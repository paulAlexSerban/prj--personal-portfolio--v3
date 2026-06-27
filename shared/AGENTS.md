# Shared packages (`shared/`)

Cross-cutting libraries used by tools, frontend, and backend. pnpm workspace packages under `shared/**/*`.

## Design split

Schema (`db-schema`) is separated from runtime (`db`) so the frontend can import types without pulling `better-sqlite3`. Pipeline CLIs share the task runner (`task-manager`).

## Packages

### `@prj--personal-portfolio--v3/shared--db-schema` (`shared/db-schema/`)

- **Role**: Drizzle table definitions and inferred TypeScript types only — no Node DB drivers.
- **Exports**: tables (`posts`, `projects`, `coursework`, `questions`, `question_options`, `pages`, `profile`, `skills`, `tags`, `content_tags`), row types, and `ContentType`.
- **Consumers**: ingest tools, Astro (types), `shared--db`.

### `@prj--personal-portfolio--v3/shared--db` (`shared/db/`)

- **Role**: SQLite runtime — connection, migrations, upsert helper.
- **Files**:
    - `src/connection.ts` — `openConnection`, `closeConnection`, `DrizzleDb` type
    - `src/migrate.ts` — `runMigrations(db, migrationsFolder)`
    - `src/upsert.ts` — `upsertWithLockCheck`
    - `drizzle.config.ts` — Drizzle Kit config (schema → `database/migrations/`, db → `database/output/content.db`)
- **API**:
    - `openConnection(dbPath)` — better-sqlite3 + Drizzle, WAL + FK pragmas
    - `runMigrations(db, migrationsFolder)` — applies `database/migrations/` via drizzle migrator
    - `upsertWithLockCheck(db, table, row, { dryRun?, syncSource? })` — insert or update by `slug`; skips `locked` rows; sets `sync_source` (default `'mdx'`) and `locked: false` on write
- **Scripts**: `db:generate`, `db:migrate`, `db:studio` (Drizzle Kit).

### `@prj--personal-portfolio--v3/shared--question-contract` (`shared/question-contract/`)

- **Role**: Zod schemas and helpers for question MDX frontmatter (`answer_format`, `cognitive_style`, options, payload).
- **Consumers**: `tools/mdx-ingest` (validate + normalise questions).

### `@prj--personal-portfolio--v3/shared--quiz-markdown` (`shared/quiz-markdown/`)

- **Role**: Shared markdown + MDX → sanitized HTML compiler used by export and the quiz web app fallback path.
- **Files**:
    - `src/mdx.ts` — preprocesses allow-listed MDX components (`<Callout>`, `<Figure>`) to HTML placeholders.
    - `src/markdown.ts` — `marked` (GFM + math placeholders) + cloze + DOMPurify via `isomorphic-dompurify`.
    - `src/allowlist.ts` — `ALLOWED_TAGS` / `ALLOWED_ATTR` (keep in sync across export + frontend).
    - `src/assets.ts` — relative image path extraction + rewrite helpers.
    - `index.ts` — `compileContent()` main API.
- **Scripts**: `pnpm --filter ...shared--quiz-markdown test` (7 tests).
- **Consumers**: `shared--quiz-export` (export-time compile), `frontend--quiz-web-app` (client fallback).

### `@prj--personal-portfolio--v3/shared--quiz-export` (`shared/quiz-export/`)

- **Role**: Reads `content.db` and emits static JSON consumed by the quiz web app and the offline mobile bundle.
- **Files**:
    - `src/contract.ts` — exported TS types: `ExportedQuestion`, `ExportedPostEntry`, `PostsIndex`, `PostQuestionsFile`, `AllQuestionsBundle`, `QuizData`. JSON **version 2** includes precompiled `*Html` fields.
    - `src/export.ts` — `buildQuizData(db): Promise<QuizData>` — pure query: joins `questions` → `posts` + `question_options` (sorted by `sort_order`) + `question_tags` + `content_tags`. Filters to `status = 'published'` only.
    - `src/compile.ts` — `compileQuizData(data, opts)` — MDX/markdown → sanitized HTML; copies question images from `CONTENT_DIR` to `assets/questions/` and rewrites paths.
    - `src/write.ts` — `writeQuizJson(data, outDir)` — writes `posts.json`, `questions/<post_slug>.json`, `tags/<tag>.json`, `_all.json`.
    - `src/cli.ts` — CLI entry; reads `DATABASE_PATH`, `QUIZ_DATA_OUT`, `CONTENT_DIR` env vars; supports `--dry-run`.
    - `index.ts` — library re-exports for consumers (`frontend--quiz-web-app` imports types).
- **Output** (default: `frontend/apps/quiz-web-app/public/data/`):
    - `posts.json` — index of posts that have ≥1 published question.
    - `questions/<post_slug>.json` — questions for a single post (lazy-loaded by the app).
    - `tags.json` + `tags/<tag_slug>.json` — tag index and per-tag question bundles.
    - `assets/questions/<question-slug>/` — copied images referenced by MDX/markdown (offline-ready).
    - `_all.json` — full bundle (posts + all questions) for offline / mobile.
- **Contract version**: all files carry `"version": 2` (precompiled HTML fields).
- **Scripts**:
    - `pnpm --filter ...shared--quiz-export start` — run export against live DB.
    - `pnpm --filter ...shared--quiz-export start:dry-run` — report counts, write nothing.
    - `pnpm --filter ...shared--quiz-export test` — vitest suite.
- **Consumers**: `frontend--quiz-web-app` (types + JSON at runtime), future mobile bundle.
- **Depends on**: `shared--db`, `shared--db-schema`, `shared--question-contract`, `shared--quiz-markdown`.

### `@prj--personal-portfolio--v3/shared--task-manager` (`shared/task-manager/`)

- **Role**: Lightweight DAG task executor for CLI pipelines.
- **API**: `taskManager().init(tasks).execute()` — tasks declare `name`, `action`, `dependsOn`; same-level tasks run in parallel; `context.getResult()` only exposes declared dependencies; circular deps throw at init.
- **Tests**: `index.test.ts` covers level grouping and dependency access rules.
- **Used by**: `tools/content-sync`, `tools/mdx-ingest`, `tools/json-ingest`.

## Conventions

- Add new tables/types in `db-schema/index.ts`, then `pnpm db:generate` from root (runs `shared--db` script).
- Upsert helper assumes tables have `slug` and `locked` columns.
- Task names in pipelines must be unique strings.
- Import across packages via workspace names (`@prj--personal-portfolio--v3/...`), not deep relative paths.

## Related docs

- Schema rationale and ingest plan: `_docs/02 plans/mdx-ingest-pipeline.md`
- Quiz web app refactor + JSON export plan: `_docs/02 plans/quiz-web-app-refactor-plan.md`
- Quiz enhancements (MDX pipeline): `_docs/02 plans/quiz-web-app-enhancements-plan.md` (Phase 6)
- Question types + MDX authoring: `_docs/01 spikes/types-of-questions.md`
- Migration artifacts: `database/AGENTS.md`
