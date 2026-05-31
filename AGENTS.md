# Personal Portfolio v3 — Monorepo

TypeScript pnpm monorepo for a portfolio, blog, and flashcard-quiz platform (JAMStack / SSG).

## Architecture

- **Two repos**: this app monorepo + a separate private content repo (`content--paulserban.eu`) with MDX and JSON under `content/publish`.
- **Content pipeline**:
    1. `tools/content-sync` clones content
    2. `tools/mdx-ingest` parses MDX
    3. `tools/json-ingest` parses JSON
    4. upserts into `database/output/content.db` (SQLite).
- **Build-time reads**: the frontend SSG (Astro) queries `content.db` at build time; MDX body is stored as text, compiled at build.
- **Shared layer**: Drizzle schema (`shared/db-schema`), DB runtime (`shared/db`), and a dependency-aware task runner (`shared/task-manager`).
- **Docs**: product requirements, ADRs, and implementation plans live in `_docs/`.

## Key directories

| Path                    | Role                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `_docs/`                | PRDs, architecture docs, ADRs, plans — see `_docs/AGENTS.md`          |
| `database/`             | SQLite file + Drizzle migration SQL — see `database/AGENTS.md`        |
| `shared/`               | Reusable packages (schema, DB, task manager) — see `shared/AGENTS.md` |
| `tools/`                | Content sync and MDX ingest CLIs — see `tools/AGENTS.md`              |
| `frontend/`, `backend/` | App surfaces (add `AGENTS.md` when those areas grow)                  |

## Common commands

```bash
pnpm start              # run all package start scripts
pnpm db:generate        # generate migrations from schema changes
pnpm db:migrate         # apply migrations
pnpm typecheck && pnpm test
```

## Conventions

- Schema changes: edit `shared/db-schema/index.ts`, then `pnpm db:generate` and commit migration files under `database/migrations/`.
- Content rows synced from MDX use `sync_source: 'mdx'`; CMS-owned rows can be `locked: true` and are skipped on ingest.
- Prefer workspace package names (`@prj--personal-portfolio--v3/...`) over relative imports across packages.
