# @prj--personal-portfolio--v3/frontend--news-feed-site

## 0.3.2

### Patch Changes

- Updated dependencies [90b9b86]
    - @prj--personal-portfolio--v3/shared--ui@1.3.0
    - @prj--personal-portfolio--v3/shared--navigation@1.2.1

## 0.3.1

### Patch Changes

- 861a58e: Add a branded PS monogram favicon (ico/svg/apple-touch-icon, plus PWA icons for the quiz app) and wire it into every site's document head so clients actually receive it, including under GitHub Pages sub-paths.
- 9afd157: Declare isomorphic-dompurify (and shared--markdown) so Astro SSR can resolve the package when it is marked vite.ssr.external during CI builds.

## 0.3.0

### Minor Changes

- ccb454b: Load news JSON from the news-data CDN at runtime so RSS updates no longer require a site rebuild.

### Patch Changes

- a31b6a2: Add a personal-aggregation disclaimer and first-visit intro modal; drop the duplicate home heading.

## 0.2.0

### Minor Changes

- removed dark light theme

### Patch Changes

- Updated dependencies
    - @prj--personal-portfolio--v3/shared--navigation@1.2.0
    - @prj--personal-portfolio--v3/shared--ui@1.2.0

## 0.1.0

### Minor Changes

- news-feed

### Patch Changes

- Updated dependencies
    - @prj--personal-portfolio--v3/shared--navigation@1.1.0
    - @prj--personal-portfolio--v3/shared--db-schema@1.1.0
    - @prj--personal-portfolio--v3/shared--db@1.1.0
    - @prj--personal-portfolio--v3/shared--ui@1.1.0
