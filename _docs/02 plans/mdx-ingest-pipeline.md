# MDX Ingest Pipeline — Implementation Plan

**Status:** Steps 1–2 complete. Steps 3–6 planned below.

---

## Context

The pipeline reads the cloned content repo (`content/live/content/publish/`), parses every
MDX file, and upserts records into a SQLite database. Astro reads from that DB at build
time and compiles MDX to HTML — no serialisation happens in this pipeline.

---

## Content types and DB mapping

| Folder in `publish/` | `contentType` | Target DB table |
|---|---|---|
| `posts/`      | `post`       | `posts` (`type = 'post'`) |
| `booknotes/`  | `booknote`   | `posts` (`type = 'book-note'`) |
| `snippets/`   | `snippet`    | `posts` (`type = 'snippet'`) |
| `projects/`   | `project`    | `projects` |
| `coursework/` | `coursework` | `coursework` (own table) |
| `questions/`  | `question`   | `questions` |
| `pages/`      | —            | out of scope — handled by `json-ingest` |

> Slugs are globally unique across all content types.

---

## Full task graph

```
[Scan Markdown Files]
        │
        ▼
[Parse Markdown Files]
        │
        ▼
[Validate Parsed Files]
        │
        ├─────────────────────────────┐
        ▼                             ▼
[Normalise to DB Rows]      [Open DB Connection]     ← parallel
        │                             │
        │                             ▼
        │                    [Run Migrations]
        │                             │
        └──────────┬──────────────────┘
                   ▼
          [Upsert Records]
```

Steps 1–2 (`Scan`, `Parse`, `Validate`) are complete.

---

## Shared packages — full split

The DB interaction surface is split into two shared packages so that both `tools/mdx-ingest`
and future `tools/json-ingest` can reuse them, and so that Astro can import schema types
without pulling in any runtime Node.js DB dependencies.

```
shared/
  db-schema/     ← schema definitions only (Drizzle tables + inferred types)
  db/            ← runtime: connection, migrations, upsert helpers
  task-manager/  ← already exists (the live one)
  taskManager/   ← ⚠ stale directory — no index.ts, should be deleted
```

### `shared/db-schema`

**Consumers:** `tools/mdx-ingest`, `tools/json-ingest` (future), Astro frontend (types only)

Contains:
- All Drizzle table definitions
- `$inferSelect` / `$inferInsert` type exports
- No runtime dependencies — only `drizzle-orm` (types) and `typescript`

**Does NOT contain:**
- Connection logic
- Migration runner
- Query helpers

### `shared/db`

**Consumers:** `tools/mdx-ingest`, `tools/json-ingest` (future)  
**Does NOT need to be imported by Astro** — Astro makes its own read-only queries using
the schema types from `shared/db-schema`.

Contains:
- `openConnection(dbPath: string): DrizzleDb`
- `closeConnection(db: DrizzleDb): void`
- `runMigrations(db: DrizzleDb): void` — uses `drizzle-kit` journal, no hand-rolled SQL
- `upsertWithLockCheck<T>(db, table, row, slugField): UpsertOutcome`
  — the single function that enforces the `locked` / `sync_source` contract for all tables

Runtime dependencies: `better-sqlite3`, `drizzle-orm`

---

## Step 3a — `shared/db-schema` package

### Schema

Matches `adr-000-datamodel.md` exactly, with `coursework` added as a separate table:

```typescript
// shared/db-schema/index.ts

export const posts = sqliteTable('posts', {
    id:           text('id').primaryKey(),          // ULID
    slug:         text('slug').notNull().unique(),
    type:         text('type').notNull(),            // 'post' | 'book-note' | 'snippet'
    title:        text('title').notNull(),
    body:         text('body').notNull(),            // raw MDX source
    subheading:   text('subheading'),
    excerpt:      text('excerpt'),
    author:       text('author'),
    date:         text('date'),
    pinned:       integer('pinned', { mode: 'boolean' }).default(false),
    tags:         text('tags'),                      // JSON string[]
    status:       text('status').notNull(),
    sync_source:  text('sync_source').default('mdx'),
    locked:       integer('locked', { mode: 'boolean' }).default(false),
    published_at: integer('published_at', { mode: 'timestamp' }),
    updated_at:   integer('updated_at', { mode: 'timestamp' }),
});

export const projects = sqliteTable('projects', {
    id:              text('id').primaryKey(),
    slug:            text('slug').notNull().unique(),
    title:           text('title').notNull(),
    body:            text('body').notNull(),
    subheading:      text('subheading'),
    excerpt:         text('excerpt'),
    repo_url:        text('repo_url'),
    demo_url:        text('demo_url'),
    tags:            text('tags'),                   // JSON string[]
    status:          text('status').notNull(),
    pinned:          integer('pinned', { mode: 'boolean' }).default(false),
    priority:        integer('priority').default(0),
    sync_source:     text('sync_source').default('mdx'),
    locked:          integer('locked', { mode: 'boolean' }).default(false),
    updated_at:      integer('updated_at', { mode: 'timestamp' }),
});

export const coursework = sqliteTable('coursework', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),
    title:       text('title').notNull(),
    body:        text('body').notNull(),
    subheading:  text('subheading'),
    excerpt:     text('excerpt'),
    repo_url:    text('repo_url'),
    tags:        text('tags'),                       // JSON string[]
    status:      text('status').notNull(),
    pinned:      integer('pinned', { mode: 'boolean' }).default(false),
    priority:    integer('priority').default(0),
    section:     text('section'),
    sync_source: text('sync_source').default('mdx'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
    updated_at:  integer('updated_at', { mode: 'timestamp' }),
});

export const questions = sqliteTable('questions', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),    // {post-slug}--{uuid5}
    post_slug:   text('post_slug').notNull().references(() => posts.slug),
    front:       text('front').notNull(),
    back:        text('back').notNull(),
    tags:        text('tags'),
    status:      text('status').notNull(),
    sync_source: text('sync_source').default('mdx'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
    created_at:  integer('created_at', { mode: 'timestamp' }),
    updated_at:  integer('updated_at', { mode: 'timestamp' }),
});

export const profile = sqliteTable('profile', { /* unchanged from data model */ });
export const skills  = sqliteTable('skills',  { /* unchanged from data model */ });
```

### package.json

```json
{
    "name": "@prj--personal-portfolio--v3/shared--db-schema",
    "type": "module",
    "exports": { ".": "./index.ts" },
    "dependencies": { "drizzle-orm": "^...", "typescript": "^..." }
}
```

---

## Step 3b — `shared/db` package

### `openConnection(dbPath)`

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@prj--personal-portfolio--v3/shared--db-schema';

export const openConnection = (dbPath: string): DrizzleDb => {
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    return drizzle(sqlite, { schema });
};
```

### `runMigrations(db)`

Uses `drizzle-kit`'s standard migrator — no custom SQL parsing:

```typescript
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export const runMigrations = (db: DrizzleDb, migrationsFolder: string): void => {
    migrate(db, { migrationsFolder });
};
```

### `upsertWithLockCheck`

Single function enforcing the lock contract for any table with a `slug` + `locked` column:

```typescript
export type UpsertOutcome = 'inserted' | 'updated' | 'skipped';

export const upsertWithLockCheck = <TInsert extends { slug: string; locked?: boolean; sync_source?: string }>(
    db: DrizzleDb,
    table: SQLiteTableWithColumns<any>,
    row: TInsert,
    options?: { dryRun?: boolean }
): UpsertOutcome => {
    const existing = db.select().from(table).where(eq(table.slug, row.slug)).get();

    if (existing?.locked) {
        console.log(`[upsert] skipped (cms-owned): ${row.slug}`);
        return 'skipped';
    }

    const payload = { ...row, sync_source: 'mdx', locked: false };

    if (options?.dryRun) {
        console.log(`[dry-run] would ${existing ? 'update' : 'insert'}: ${row.slug}`);
        return existing ? 'updated' : 'inserted';
    }

    db.insert(table).values(payload).onConflictDoUpdate({
        target: table.slug,
        set: payload,
    }).run();

    return existing ? 'updated' : 'inserted';
};
```

---

## Step 4 — `normalise` helpers (in `tools/mdx-ingest`)

Maps `ParsedFile` → typed row shape matching `$inferInsert` for each table.
Tool-specific — stays in `tools/mdx-ingest/src/helpers/normalise.ts`.

Dependencies needed in `tools/mdx-ingest`: `ulidx` (for ULID generation on new rows).

### Question slug parsing

Questions use the filename convention `{post-slug}--{uuid5}.mdx`.
`post_slug` is extracted by splitting on the last `--`:

```typescript
const parts = slug.split('--');
const post_slug = parts.slice(0, -1).join('--');
```

If the convention is not met: skip and log.

---

## Step 5 — Task wiring in `tools/mdx-ingest/src/index.ts`

```typescript
{
    name: 'Normalise to DB Rows',
    action: (ctx) => normalise(ctx.getResult<ValidationResult>('Validate Parsed Files').valid),
    dependsOn: ['Validate Parsed Files'],
},
{
    name: 'Open DB Connection',
    action: () => openConnection(process.env.DATABASE_PATH ?? '../../database/content.db'),
    dependsOn: [],   // parallel — no dependency on parse/validate chain
},
{
    name: 'Run Migrations',
    action: (ctx) => runMigrations(ctx.getResult<DrizzleDb>('Open DB Connection'), '../../database/migrations'),
    dependsOn: ['Open DB Connection'],
},
{
    name: 'Upsert Records',
    action: (ctx) => upsertRecords({
        db: ctx.getResult<DrizzleDb>('Open DB Connection'),
        rows: ctx.getResult<NormalisedRows>('Normalise to DB Rows'),
        dryRun: process.argv.includes('--dry-run'),
    }),
    dependsOn: ['Run Migrations', 'Normalise to DB Rows'],
},
```

---

## Pre-conditions before Step 3a can begin

1. **`gray-matter` must be installed** — tags are currently silently dropped by the basic
   YAML parser. The `markdownParser.ts` must be updated to use it.
   ```
   pnpm add --filter @prj--personal-portfolio--v3/tools--mdx-ingest gray-matter
   ```

2. **`shared/taskManager` stale directory must be deleted** — it has no `index.ts` and
   shares the same package name as the live `shared/task-manager`. It will confuse pnpm.

3. **`questions` must move from `content/live/content/backlog/questions/` to
   `content/live/content/publish/questions/`** before they are picked up by the scanner.

---

## Dependencies to install (all steps combined)

| Package | Where | Why |
|---|---|---|
| `gray-matter` | `tools/mdx-ingest` | Parse YAML frontmatter + arrays |
| `ulidx` | `tools/mdx-ingest` | Generate ULIDs for new rows |
| `drizzle-orm` | `shared/db-schema`, `shared/db` | Schema + query builder |
| `better-sqlite3` | `shared/db` | SQLite driver |
| `@types/better-sqlite3` | `shared/db` (dev) | Types |
| `drizzle-kit` | `shared/db` (dev) | Migration file generation |

---

## Files to create / modify

| Action | Path |
|---|---|
| **Delete** | `shared/taskManager/` — stale, no source |
| Create | `shared/db-schema/package.json` |
| Create | `shared/db-schema/tsconfig.json` |
| Create | `shared/db-schema/index.ts` |
| Create | `shared/db/package.json` |
| Create | `shared/db/tsconfig.json` |
| Create | `shared/db/src/connection.ts` |
| Create | `shared/db/src/migrate.ts` |
| Create | `shared/db/src/upsert.ts` |
| Create | `shared/db/index.ts` |
| Update | `tools/mdx-ingest/src/helpers/markdownParser.ts` — switch to `gray-matter` |
| Create | `tools/mdx-ingest/src/helpers/normalise.ts` |
| Create | `tools/mdx-ingest/src/helpers/upsertRecords.ts` |
| Update | `tools/mdx-ingest/src/index.ts` — wire steps 3–6 |
| Update | `tools/mdx-ingest/package.json` — add `gray-matter`, `ulidx`, `shared/db` |
