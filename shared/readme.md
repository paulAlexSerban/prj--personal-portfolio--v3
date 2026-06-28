# Shared packages (`shared/`)

Cross-cutting libraries used by the tools, frontend, and (future) backend. Each is
a pnpm workspace package named `@prj--personal-portfolio--v3/shared--<name>`.

For the agent-oriented version (conventions, invariants, where to change things),
see [`AGENTS.md`](./AGENTS.md). Each package below has its own `readme.md`.

## The packages

| Package                                              | What it does                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`db-schema`](./db-schema/readme.md)                 | Single source of truth for the DB shape — Drizzle table definitions + inferred types (no driver).              |
| [`db`](./db/readme.md)                               | SQLite runtime — connection, migrations, and the lock-aware upsert helper.                                     |
| [`question-contract`](./question-contract/readme.md) | Zod validation + normalization for flashcard question frontmatter.                                             |
| [`quiz-markdown`](./quiz-markdown/readme.md)         | Shared Markdown/MDX → sanitized-HTML compiler (one allow-list, used by export + app).                          |
| [`quiz-export`](./quiz-export/readme.md)             | Reads `content.db` and emits the static JSON the quiz web app consumes.                                        |
| [`ui`](./ui/readme.md)                               | React UI kit + newspaper design system ("THE REVIEW") **and** the quiz presentation blocks (Storybook-backed). |
| [`task-manager`](./task-manager/readme.md)           | Tiny dependency-aware task runner for the CLI pipelines.                                                       |

## How they fit together

```
db-schema ──► db ──► tools (mdx-ingest, json-ingest) ──► content.db
   │                                                         │
   │                                          quiz-export (reads DB) ──► public/data/*.json
   │                                                 │                          │
question-contract ◄──────────────────── quiz-markdown (compile HTML)     quiz-web-app (ui)
```

- `db-schema` is driver-free so type-only consumers (frontend, export) avoid the
  native SQLite binary; `db` adds the runtime.
- `quiz-markdown` owns the **one** DOMPurify allow-list shared by export and app.
- `task-manager` orders the ingest pipeline; `ui` is the shared design system.

## Conventions

- Import across packages via workspace names (`@prj--personal-portfolio--v3/...`),
  not deep relative paths.
- Schema changes: edit `db-schema`, then `pnpm db:generate` (root) and commit the
  generated migration under `database/migrations/`.
