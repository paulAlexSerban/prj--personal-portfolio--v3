# IndexNow (`tools/indexnow/`)

Notifies the [IndexNow](https://www.indexnow.org/) hub (`api.indexnow.org`) after a
**production** deploy so Bing-family engines recrawl changed pages. Google does
**not** consume IndexNow.

**Package:** `@prj--personal-portfolio--v3/tools--indexnow`

This is a post-deploy CLI, not part of the content ingest pipeline. It does **not**
run from root `pnpm start`.

## What it does (task graph)

Same `shared--task-manager` pattern as content-sync / mdx-ingest. Flags select which
tasks are registered (write-key and submit run in different CI jobs):

```
Setup Environment ─┬─► Write Key File          (--write-key)
                   └─► Parse Sitemap ─► Build Payload ─► Wait for Key Location ─► Submit IndexNow
                       (--submit)
```

| Task                  | Helper          | Responsibility                                              |
| --------------------- | --------------- | ----------------------------------------------------------- |
| Setup Environment     | `key.ts`        | Validate `INDEX_NOW_API_KEY`, resolve `--dist`.             |
| Write Key File        | `writeKey.ts`   | Write `{key}.txt` into dist (skipped in dry-run).           |
| Parse Sitemap         | `sitemap.ts`    | Read `sitemap-index.xml` / `sitemap-0.xml` / `sitemap.xml`. |
| Build Payload         | `payload.ts`    | Same-host IndexNow JSON; logs a redacted payload.           |
| Wait for Key Location | `waitForKey.ts` | Retry GET until `keyLocation` is 200 (no-op in dry-run).    |
| Submit IndexNow       | `submit.ts`     | POST once to `api.indexnow.org` (no-op in dry-run).         |

Do not submit from the build job. Engines fetch `keyLocation` to prove ownership.

## How to run it

```bash
export INDEX_NOW_API_KEY=your-8-to-128-char-key

pnpm --filter @prj--personal-portfolio--v3/tools--indexnow start -- \
  --write-key --dist /abs/path/to/frontend/sites/portfolio-site/dist

pnpm --filter @prj--personal-portfolio--v3/tools--indexnow start -- \
  --submit --dist /abs/path/to/dist --site https://paulserban.eu

pnpm --filter @prj--personal-portfolio--v3/tools--indexnow start:dry-run -- \
  --write-key --submit --dist /abs/path/to/dist --site https://paulserban.eu
```

`--dist` is resolved from the process cwd (`tools/indexnow` when using pnpm
`--filter`). Prefer an absolute path. `--site` is required with `--submit`.

Dry-run prints a redacted payload and URL count; it does not write files or call
`fetch`.

## Env

| Variable            | Role                                                                                                                                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INDEX_NOW_API_KEY` | 8–128 chars (`A-Z`, `a-z`, `0-9`, `-`). Same key on each host; each host must serve `{key}.txt`. Generate once with `python3 -c 'import secrets; print(secrets.token_hex(16))'` and store as the GitHub Actions `production` environment secret `INDEX_NOW_API_KEY`. Do not commit the `.txt` file. |

CI: production-only, after S3 deploy of portfolio / blog / news-feed. Not stage,
test, Pages, or the quiz SPA.

## Related

- `_build-site.yaml` - write-key after Astro build; submit after S3+CloudFront.
- Site `robots.txt.ts` - crawl policy + sitemap link (more important for Google).
