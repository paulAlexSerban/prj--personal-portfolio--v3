# DB Schema (`shared/db-schema/`)

The **single source of truth for the database shape** — Drizzle table definitions
and the TypeScript row types inferred from them. Nothing else: no driver, no
connection, no queries.

**Package:** `@prj--personal-portfolio--v3/shared--db-schema`

## Why it's its own package

It deliberately has **no Node DB driver** (`better-sqlite3` lives in `shared--db`).
That lets type-only consumers — the Astro frontend, the export module — import row
types without pulling a native SQLite binary into their bundle.

## What's in it

`index.ts` defines every table and exports its inferred types:

| Group    | Tables                                                                  |
| -------- | ----------------------------------------------------------------------- |
| Content  | `posts` (post / book-note / snippet), `projects`, `coursework`, `pages` |
| Quiz     | `questions`, `question_options`, `question_tags`                        |
| Taxonomy | `tags`, `content_tags` (junction)                                       |
| Profile  | `profile`, `skills`                                                     |

Also exports the inferred `Select`/`Insert` row types and `ContentType`.

## How to change the schema

1. Edit `index.ts` (add/alter a table or column).
2. From the repo root run `pnpm db:generate` — Drizzle Kit writes a new SQL
   migration under `database/migrations/`.
3. Commit the schema change **and** the generated migration together.
4. `pnpm db:migrate` applies it to `database/output/content.db`.

> The generate/migrate scripts live in `shared--db` (it owns the driver + Drizzle
> Kit config); this package is just the definitions they read.

## Where it sits

- **Depends on:** `drizzle-orm` only.
- **Consumed by:** `shared--db`, the ingest tools, `shared--quiz-export`, and (for types) the frontend.

## Related docs

- `shared/AGENTS.md` — all shared packages.
- `database/AGENTS.md` — migrations and the SQLite artifact.
- `_docs/02 plans/mdx-ingest-pipeline.md` — schema rationale.
