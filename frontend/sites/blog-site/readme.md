# Blog Site

Static Astro SSG for `blog.paulserban.eu`. Reads published content from `database/output/content.db` at build time.

## Prerequisites

- Content ingested into `content.db` (`pnpm db:migrate` + mdx-ingest pipeline)
- `better-sqlite3` native module built for your Node version (`pnpm rebuild better-sqlite3` if needed)

## Commands

```bash
# from monorepo root
pnpm --filter @prj--personal-portfolio--v3/frontend--blog-site dev
pnpm --filter @prj--personal-portfolio--v3/frontend--blog-site build
pnpm --filter @prj--personal-portfolio--v3/frontend--blog-site preview
```

## Environment

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `DATABASE_PATH` | `../../../database/output/content.db` (from blog-site root) | SQLite content database |

## Routes

| Path | Content |
| ---- | ------- |
| `/` | Blog hub (pinned posts, snippets, book notes) |
| `/post/` | All published posts |
| `/post/{slug}/` | Post detail + quiz widget mount point when questions exist |
| `/snippet/` | All published snippets |
| `/snippet/{slug}/` | Snippet detail |
| `/booknote/` | All published book notes |
| `/booknote/{slug}/` | Book note detail |
| `/tags/{tag}/` | Tag archive (up to 9 items per content type) |
