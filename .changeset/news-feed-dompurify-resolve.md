---
'@prj--personal-portfolio--v3/frontend--news-feed-site': patch
---

Declare isomorphic-dompurify (and shared--markdown) so Astro SSR can resolve the package when it is marked vite.ssr.external during CI builds.
