# News Sync (`tools/news-sync/`)

Fetches RSS/Atom feeds listed in the content repo and writes durable JSON caches under `content/news/cache/`.

Feed lists live in `content--paulserban.eu` as `content/publish/feeds/{category}.json` (one file per category). After `content-sync`, this tool reads them from `CONTENT_DIR/feeds/` - the same publish tree as json-ingest / mdx-ingest. Adding a feed or category is a content-repo change; do not edit this package.

The daily `news-sync` GitHub Actions workflow runs `content-sync` first, then `pnpm --filter ...tools--news-sync sync`. It commits those files to the `news-cache` branch and uploads them to the `news-data.paulserban.eu` S3/CloudFront CDN. It does **not** run from root `pnpm start`, and it does **not** trigger a site rebuild.

Layout (also the CDN object keys):

- `index.json` - `{ fetchedAt, categories: [{ slug, label, count }] }`
- `{category}.json` - `{ category, label, fetchedAt, items: [...] }`

Env:

- `CONTENT_DIR` - default `../../content/live/content/publish` (must contain `feeds/`)
- `NEWS_CACHE_DIR` - default `../../content/news/cache`
- `NEWS_RETENTION_DAYS` - default `14`

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--content-sync start
pnpm --filter @prj--personal-portfolio--v3/tools--news-sync sync
```
