# News Ingest (`tools/news-ingest/`)

Reads `content/news/cache/*.json` (from `tools/news-sync`) and upserts into `news_items` in `content.db`.

Runs as part of root `pnpm start` (alongside mdx/json ingest).

Env:

- `NEWS_CACHE_DIR` — default `../../content/news/cache`
- `DATABASE_PATH` — default `../../database/output/content.db`
- `MIGRATIONS_DIR` — default `../../database/migrations`
