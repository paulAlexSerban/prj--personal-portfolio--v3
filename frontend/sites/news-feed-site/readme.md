# News Feed Site

Astro SSG shell for the engineering news digest at `news-feed.paulserban.eu`.

Headlines are **not** baked in at build time. The React `NewsFeedApp` island fetches JSON from the news-data CDN (`https://news-data.paulserban.eu`) at runtime. Local `astro dev` serves the same files from `content/news/cache/` via Vite middleware at `/news-data/`.

```bash
pnpm --filter @prj--personal-portfolio--v3/frontend--news-feed-site dev
pnpm --filter @prj--personal-portfolio--v3/frontend--news-feed-site build
```

Env:

- `PUBLIC_NEWS_DATA_URL` — CDN origin (e.g. `https://news-data.paulserban.eu`). Unset in local dev so the app loads `/news-data/*.json` from the Vite middleware.
