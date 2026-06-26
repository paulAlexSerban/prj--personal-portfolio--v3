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

### `@prj--personal-portfolio--v3/shared--quiz-export` (`shared/quiz-export/`)

- **Role**: Reads `content.db` and emits static JSON consumed by the quiz web app and the offline mobile bundle.
- **Files**:
    - `src/contract.ts` — exported TS types: `ExportedQuestion`, `ExportedPostEntry`, `PostsIndex`, `PostQuestionsFile`, `AllQuestionsBundle`, `QuizData`.
    - `src/export.ts` — `buildQuizData(db): Promise<QuizData>` — pure query: joins `questions` → `posts` + `question_options` (sorted by `sort_order`) + `question_tags` + `content_tags`. Filters to `status = 'published'` only.
    - `src/write.ts` — `writeQuizJson(data, outDir)` — writes `posts.json`, `questions/<post_slug>.json`, `_all.json`.
    - `src/cli.ts` — CLI entry; reads `DATABASE_PATH` + `QUIZ_DATA_OUT` env vars; supports `--dry-run`.
    - `index.ts` — library re-exports for consumers (`frontend--quiz-web-app` imports types).
- **Output** (default: `frontend/apps/quiz-web-app/public/data/`):
    - `posts.json` — index of posts that have ≥1 published question.
    - `questions/<post_slug>.json` — questions for a single post (lazy-loaded by the app).
    - `_all.json` — full bundle (posts + all questions) for offline / mobile.
- **Contract version**: all files carry `"version": 1`.
- **Scripts**:
    - `pnpm --filter ...shared--quiz-export start` — run export against live DB.
    - `pnpm --filter ...shared--quiz-export start:dry-run` — report counts, write nothing.
    - `pnpm --filter ...shared--quiz-export test` — vitest suite (10 tests, in-memory SQLite fixture).
- **Consumers**: `frontend--quiz-web-app` (types + JSON at runtime), future mobile bundle.
- **Depends on**: `shared--db`, `shared--db-schema`, `shared--question-contract`.

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
- Migration artifacts: `database/AGENTS.md`
