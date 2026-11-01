# @prj--personal-portfolio--v3/shared--markdown

## 1.2.0

### Minor Changes

- 59d7d4d: algorithm improve

### Patch Changes

- f56bd04: Speed up quiz export by reusing one markdown compiler, indexing question source files once, and caching compiled HTML between runs. Node sanitizing no longer uses the isomorphic-dompurify jsdom window that got slower on every call. The browser build uses the page DOM and does not import `node:module`. JSON output is minified unless `--pretty` is set; `--no-cache` forces a full recompile.

## 1.1.0

### Minor Changes

- news-feed
