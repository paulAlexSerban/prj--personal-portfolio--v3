# News Ingest (`tools/news-ingest/`)

Reads `content/news/cache/*.json` (from `tools/news-sync`) and upserts into `news_items` in `content.db`.

Still available for local/SQLite use. Site builds **do not** run this tool - the news-feed site loads JSON from the `news-data.paulserban.eu` CDN at runtime.

Env:

- `NEWS_CACHE_DIR` - default `../../content/news/cache`
- `DATABASE_PATH` - default `../../database/output/content.db`
- `MIGRATIONS_DIR` - default `../../database/migrations`
