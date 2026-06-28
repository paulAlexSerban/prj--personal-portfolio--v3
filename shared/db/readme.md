# DB Runtime (`shared/db/`)

The **SQLite runtime** for the content database: open a connection, run
migrations, and upsert rows safely. This is the only shared package that pulls in
the native `better-sqlite3` driver.

**Package:** `@prj--personal-portfolio--v3/shared--db`

## Why it's separate from `db-schema`

The schema (table definitions + types) is kept in `shared--db-schema` so type-only
consumers don't drag a native binary into their bundle. `shared--db` is the
runtime half — it depends on the schema and adds the driver, migrator, and write
helpers used by the **ingest tools at build time**.

## API

```ts
import { openConnection, runMigrations, upsertWithLockCheck } from '@prj--personal-portfolio--v3/shared--db';

const db = openConnection('database/output/content.db'); // better-sqlite3 + Drizzle, WAL + FK pragmas
runMigrations(db, 'database/migrations');
upsertWithLockCheck(db, posts, row, { dryRun: false, syncSource: 'mdx' });
```

| Export                                           | Role                                                                                                                                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openConnection(dbPath)` / `closeConnection(db)` | Open/close a better-sqlite3 + Drizzle handle (sets WAL + foreign-key pragmas). `DrizzleDb` is the handle type.                                                                                 |
| `runMigrations(db, folder)`                      | Applies the SQL files in `database/migrations/` via the Drizzle migrator.                                                                                                                      |
| `upsertWithLockCheck(db, table, row, opts)`      | Insert-or-update by `slug`. **Skips rows marked `locked`** (CMS-owned), stamps `sync_source` (default `'mdx'`), and sets `locked: false` on pipeline writes. `dryRun` reports without writing. |

## The lock convention (important)

`upsertWithLockCheck` is how the build pipeline avoids clobbering CMS edits: any
row with `locked: true` is treated as CMS-owned and left untouched. Pipeline
writes are tagged `sync_source: 'mdx'`. The helper assumes the target table has
`slug` and `locked` columns.

## Source map

| File                | Role                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `src/connection.ts` | `openConnection` / `closeConnection` / `DrizzleDb`.                                      |
| `src/migrate.ts`    | `runMigrations`.                                                                         |
| `src/upsert.ts`     | `upsertWithLockCheck` + `UpsertOutcome` / `UpsertResult`.                                |
| `drizzle.config.ts` | Drizzle Kit config (schema → `database/migrations/`, db → `database/output/content.db`). |

## Scripts

These wrap Drizzle Kit and are normally invoked from the repo root:

```bash
pnpm db:generate   # generate a migration from schema changes (edit shared--db-schema first)
pnpm db:migrate    # apply migrations to content.db
pnpm db:studio     # open Drizzle Studio
```

## Where it sits

- **Depends on:** `shared--db-schema`, `better-sqlite3`, `drizzle-orm`.
- **Consumed by:** `tools/mdx-ingest`, `tools/json-ingest`, `shared--quiz-export` (opens the DB to read).

## Related docs

- `shared/AGENTS.md` — all shared packages.
- `database/AGENTS.md` — the SQLite artifact + migration files.
