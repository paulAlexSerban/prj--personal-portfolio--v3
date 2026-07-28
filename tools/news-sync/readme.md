# News Sync (`tools/news-sync/`)

Fetches configured RSS/Atom feeds and writes durable JSON caches under `content/news/cache/`.

Runs from the daily `news-sync` GitHub Actions workflow (`pnpm --filter ...tools--news-sync sync`), **not** from root `pnpm start`.

Env:

- `NEWS_CACHE_DIR` — default `../../content/news/cache`
- `NEWS_RETENTION_DAYS` — default `14`
