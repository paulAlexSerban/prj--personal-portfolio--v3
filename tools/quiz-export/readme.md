# Quiz Export (`tools/quiz-export/`)

Turns the build-time SQLite database (`database/output/content.db`) into the
**static JSON files the quiz web app reads at runtime**. It is the bridge between
the content pipeline (MDX -> DB) and the browser app (JSON -> flashcards).

**Package:** `@prj--personal-portfolio--v3/tools--quiz-export`

## Why it exists

The quiz web app is a static, no-backend app. It can't query SQLite in the
browser, so this package runs once at build time, reads every published question
out of the database, compiles its Markdown/MDX to safe HTML, and writes plain
JSON files that the app can simply `fetch()`.

```
content.db ──► buildQuizData ──► compileQuizData ──► writeQuizJson ──► public/data/*.json
   (DB)         (query + join)    (MDX -> safe HTML)    (write files)      (app reads these)
```

## What it produces

Written to `frontend/apps/quiz-web-app/public/data/` by default:

| File                         | Contents                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `posts.json`                 | Index of every post that has ≥1 published question (title, excerpt, `questionCount`, tags). |
| `questions/<post_slug>.json` | All questions for one post - lazy-loaded by the app when you open a set.                    |
| `tags.json`                  | Index of tags with question counts.                                                         |
| `tags/<tag_slug>.json`       | All questions carrying a given tag (powers tag-based study).                                |
| `_all.json`                  | Everything (all posts + all questions) in one file, for full offline / future mobile.       |
| `assets/questions/<slug>/`   | Images referenced by a question's MDX, copied so they work offline.                         |

Every file carries `"version": 2`, which means it includes precompiled HTML
fields (`stemHtml`, `explanationHtml`, `labelHtml`) so the app doesn't have to
compile Markdown on every render.

## How to run it

```bash
# emit JSON against the live database
pnpm --filter @prj--personal-portfolio--v3/tools--quiz-export start

# report what it would write, but write nothing
pnpm --filter @prj--personal-portfolio--v3/tools--quiz-export start:dry-run

# recompile every question, ignoring the HTML cache
pnpm --filter @prj--personal-portfolio--v3/tools--quiz-export start -- --no-cache

# indent JSON (default is minified)
pnpm --filter @prj--personal-portfolio--v3/tools--quiz-export start -- --pretty

# tests
pnpm --filter @prj--personal-portfolio--v3/tools--quiz-export test
```

Run `start` whenever content changes (i.e. after an ingest) and before building
the quiz app. A second run with the same question text reuses compiled HTML
from the cache and finishes in seconds.

### Environment overrides

| Var                    | Default                                  | Purpose                                              |
| ---------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `DATABASE_PATH`        | `database/output/content.db`             | Source SQLite DB.                                    |
| `QUIZ_DATA_OUT`        | `frontend/apps/quiz-web-app/public/data` | Where JSON is written.                               |
| `CONTENT_DIR`          | `content/live/content/publish`           | Where to find question images to copy.               |
| `QUIZ_EXPORT_CACHE`    | `node_modules/.cache/quiz-export/…`      | Compiled-HTML cache file.                            |
| `QUIZ_EXPORT_NO_CACHE` | unset                                    | Set to `1` to skip the cache (same as `--no-cache`). |

## How it works (source map)

| File              | Role                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/export.ts`   | `buildQuizData(db)` - pure query. Joins `questions` -> `posts`, attaches `question_options` (ordered) + tags, parses `payload`. Only `status = 'published'` rows.          |
| `src/compile.ts`  | `compileQuizData(data, opts)` - compiles Markdown/MDX -> sanitized HTML (via `shared--markdown`) and copies/rewrites image assets. Question source files are indexed once. |
| `src/cache.ts`    | Content-hash cache of compiled HTML. Keyed by compiler version, field source, and image rewrites.                                                                          |
| `src/write.ts`    | `writeQuizJson(data, outDir)` - writes the JSON files above (minified unless `pretty`), then deletes stale files in `questions/` and `tags/`.                              |
| `src/contract.ts` | The TypeScript types for every output shape - **the source of truth the app imports** (`./contract` subpath).                                                              |
| `src/index.ts`    | CLI entry: task graph via `shared--task-manager` (Open DB -> Export -> Close ∥ Compile -> Write); reads env vars; handles `--dry-run`, `--no-cache`, `--pretty`.           |
| `index.ts`        | Library exports for other packages.                                                                                                                                        |

`buildQuizData` only reads the database. `compileQuizData` compiles HTML and, when
asset directories are set, copies images. `writeQuizJson` writes JSON and
deletes stale files. The CLI runs those steps as named tasks.

JSON files are minified. The shapes are unchanged (`version: 2`); only
whitespace differs from older pretty-printed output. Pass `--pretty` to indent.

Compiled HTML is cached under `tools/quiz-export/node_modules/.cache/quiz-export/`.
The cache key is a hash of the markdown compiler version, the question fields,
and any rewritten image paths, so a question is recompiled only when its source
changes. `--no-cache` (or `QUIZ_EXPORT_NO_CACHE=1`) ignores the file.

## Where it sits

- **Depends on:** `shared--db`, `shared--db-schema`, `shared--question-contract`, `shared--markdown`, `shared--task-manager`.
- **Consumed by:** `frontend--quiz-web-app` (imports `./contract` types; fetches the JSON at runtime); future mobile bundle (`_all.json`).

## Related docs

- `_docs/02 plans/quiz-web-app-refactor-plan.md` - Phase 1 designed this module.
- `_docs/02 plans/quiz-web-app-enhancements-plan.md` - Phase 6 added the compile step + v2 contract.
- `shared/AGENTS.md` - all shared packages.
