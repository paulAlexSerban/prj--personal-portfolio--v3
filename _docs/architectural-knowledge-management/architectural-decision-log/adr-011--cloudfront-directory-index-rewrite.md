# ADR-011: CloudFront Directory-Index Rewrite for Astro Static Sites

## Status: Accepted (2026-08-06)

## Context

Astro sites in this monorepo (`portfolio-site`, `blog-site`, `news-feed-site`) use
`trailingSlash: 'always'` and emit directory layouts such as
`post/{slug}/index.html`. Deep links like `/post/{slug}/` work on GitHub Pages
because Pages serves directory indexes. They failed on the AWS test/stage stacks
(S3 private bucket + Origin Access Control + CloudFront): CloudFront’s
`default_root_object` only maps `/` → `index.html`, not subdirectory paths.
Requests for `/post/{slug}/` looked up S3 key `post/{slug}/` (missing), returned
403 under OAC, and the distribution’s custom error response soft-mapped that to
`/404.html`.

Test/stage already attach a CloudFront viewer-request Function for HTTP Basic
Auth. CloudFront allows **only one** Function association per event type, so any
URI rewrite must live in the same Function (or replace Basic Auth).

Cost of CloudFront Functions is negligible for this traffic (~$0.10 / million
invocations after a free tier). On test/stage, Basic Auth already billed one
invocation per request; extending that Function does not add a second hop.

## Decision

Keep Astro `trailingSlash: 'always'` and resolve directory URLs at the CDN with
a **CloudFront Function** on `viewer-request` in
`infrastructure/aws/modules/static-site`:

1. Optionally enforce HTTP Basic Auth (when enabled for the env).
2. Rewrite URIs ending in `/` to `{uri}index.html`, and extensionless paths to
   `{uri}/index.html`.

Template: `static-site/src/viewer-request.js.tftpl`. Resource:
`aws_cloudfront_function.viewer_request` (always attached; Basic Auth is
conditional inside the generated code).

Do **not** switch sites to `trailingSlash: 'never'` solely to avoid this rewrite.

## Options considered

| Option | Approach | Rejected because |
| ------ | -------- | ---------------- |
| **A. CF Function rewrite (chosen)** | Append `index.html` for directory URIs | — |
| **B. `trailingSlash: 'never'`** | Emit `post/{slug}.html` | Changes public URL shape; breaks existing trailing-slash links/bookmarks unless redirects are added; still needs rewrite/redirect for `/…/` URLs; touches Astro config + URL helpers across three sites |
| **C. S3 website endpoint as origin** | Native `IndexDocument` | Conflicts with private bucket + OAC security model used for these stacks |
| **D. Lambda@Edge origin-request** | Same rewrite as A | Higher cost/latency and operational weight than CloudFront Functions for a static rewrite |

## Consequences

- Deep links on test/stage (and future prod using the same module) match GitHub
  Pages behaviour without changing Astro URL conventions.
- Basic Auth and directory rewrite share one Function; do not attach a second
  viewer-request Function.
- Quiz SPA stacks keep custom error → `/index.html` for true missing keys;
  directory rewrite still applies to real `…/index.html` assets first.
- Soft 403/404 → `/404.html` (200) remains for genuine misses on non-SPA sites;
  tightening response codes is out of scope for this ADR.

## See also

- Module: `infrastructure/aws/modules/static-site/`
- Envs: `infrastructure/aws/envs/{test,stage}/`
- Astro: `frontend/sites/*/astro.config.mjs` (`trailingSlash: 'always'`)
- Related: ADR-010 (release / env promotion); hosting provider choice remains
  broader than this URI-rewrite decision
