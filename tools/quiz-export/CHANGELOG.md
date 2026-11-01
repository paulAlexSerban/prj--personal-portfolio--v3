# @prj--personal-portfolio--v3/tools--quiz-export

## 1.3.0

### Minor Changes

- 59d7d4d: algorithm improve

### Patch Changes

- f56bd04: Speed up quiz export by reusing one markdown compiler, indexing question source files once, and caching compiled HTML between runs. Node sanitizing no longer uses the isomorphic-dompurify jsdom window that got slower on every call. The browser build uses the page DOM and does not import `node:module`. JSON output is minified unless `--pretty` is set; `--no-cache` forces a full recompile.
- Updated dependencies [59d7d4d]
- Updated dependencies [f56bd04]
    - @prj--personal-portfolio--v3/shared--markdown@1.2.0

## 1.2.0

### Minor Changes

- 3f65af6: seo fixes

### Patch Changes

- Updated dependencies [40a59c0]
- Updated dependencies [f84eef1]
- Updated dependencies [3f65af6]
    - @prj--personal-portfolio--v3/shared--task-manager@1.2.0
    - @prj--personal-portfolio--v3/shared--db-schema@1.2.0
    - @prj--personal-portfolio--v3/tools--mdx-ingest@1.2.0
    - @prj--personal-portfolio--v3/tools--json-ingest@1.1.1
    - @prj--personal-portfolio--v3/shared--db@1.1.1

## 1.1.0

### Minor Changes

- news-feed

### Patch Changes

- Updated dependencies
    - @prj--personal-portfolio--v3/shared--db-schema@1.1.0
    - @prj--personal-portfolio--v3/shared--db@1.1.0
    - @prj--personal-portfolio--v3/shared--markdown@1.1.0
    - @prj--personal-portfolio--v3/shared--question-contract@1.1.0
    - @prj--personal-portfolio--v3/shared--task-manager@1.1.0
    - @prj--personal-portfolio--v3/tools--json-ingest@1.1.0
    - @prj--personal-portfolio--v3/tools--mdx-ingest@1.1.0
