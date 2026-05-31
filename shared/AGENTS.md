# Shared packages (`shared/`)

Cross-cutting libraries used by tools, frontend, and backend. pnpm workspace packages under `shared/**/*`.

## Design split

Schema (`db-schema`) is separated from runtime (`db`) so the frontend can import types without pulling `better-sqlite3`. Pipeline CLIs share the task runner (`task-manager`).

## Packages

### `@prj--personal-portfolio--v3/shared--db-schema` (`shared/db-schema/`)

- **Role**: Drizzle table definitions and inferred TypeScript types only — no Node DB drivers.
- **Exports**: tables (`posts`, `projects`, `coursework`, `questions`, `pages`, `profile`, `skills`, `tags`, `content_tags`), row types, and `ContentType`.
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
- Migration artifacts: `database/AGENTS.md`
