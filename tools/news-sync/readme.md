# News Sync (`tools/news-sync/`)

Fetches configured RSS/Atom feeds and writes durable JSON caches under `content/news/cache/`.

The daily `news-sync` GitHub Actions workflow (`pnpm --filter ...tools--news-sync sync`) commits those files to the `news-cache` branch and uploads them to the `news-data.paulserban.eu` S3/CloudFront CDN. It does **not** run from root `pnpm start`, and it does **not** trigger a site rebuild.

Layout (also the CDN object keys):

- `index.json` — `{ fetchedAt, categories: [{ slug, label, count }] }`
- `{category}.json` — `{ category, label, fetchedAt, items: [...] }`

Env:

- `NEWS_CACHE_DIR` - default `../../content/news/cache`
- `NEWS_RETENTION_DAYS` - default `14`
