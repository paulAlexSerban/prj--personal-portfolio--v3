# News Feed Site

Astro SSG site for the engineering news digest at `news-feed.paulserban.eu`.

Reads `news_items` from `content.db` at build time (populated by `tools/news-ingest` from `content/news/cache/`).

```bash
pnpm --filter @prj--personal-portfolio--v3/frontend--news-feed-site dev
pnpm --filter @prj--personal-portfolio--v3/frontend--news-feed-site build
```
