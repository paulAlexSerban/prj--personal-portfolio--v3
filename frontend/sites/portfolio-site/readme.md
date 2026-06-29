# Portfolio Site

Static Astro SSG for `paulserban.eu`. Shares the monorepo "newspaper" design system (`shared--ui/styles.css`) with build-time content from `database/output/content.db`.

## Prerequisites

- Content ingested into `content.db` (see test fixtures under `test-content/publish/`)
- `better-sqlite3` native module built for your Node version

## Commands

```bash
# from monorepo root
corepack pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site dev
corepack pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site build
corepack pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site preview
```

## Ingest test fixtures

```bash
export CONTENT_DIR="$(pwd)/frontend/sites/portfolio-site/test-content/publish"
corepack pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
corepack pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start
```

## Routes

| Path                 | Content                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `/`                  | Hero, experience timeline, core skills (logos + value), case studies, featured blog |
| `/portfolio/`        | Featured + archive projects with tech filter                                        |
| `/portfolio/{slug}/` | Case study detail (problem/approach/outcome + MDX)                                  |
| `/cv/`               | Printable CV from profile + experience                                              |

## Environment

| Variable        | Default                               | Purpose                 |
| --------------- | ------------------------------------- | ----------------------- |
| `DATABASE_PATH` | `../../../database/output/content.db` | SQLite content database |
