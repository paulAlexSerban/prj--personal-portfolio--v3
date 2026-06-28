# Tools (`tools/`)

Node.js CLIs that make up the **content pipeline** — they pull content from the
private content repo and load it into the SQLite database the rest of the project
builds on. Each is a pnpm workspace package named
`@prj--personal-portfolio--v3/tools--<name>`.

For the agent-oriented version (scanner internals, tag handling, conventions), see
[`AGENTS.md`](./AGENTS.md). Each tool has its own `readme.md`.

## The tools

| Tool                                       | Role                                                             |
| ------------------------------------------ | ---------------------------------------------------------------- |
| [`content-sync`](./content-sync/readme.md) | Clone the private content repo into `content/live/`.             |
| [`mdx-ingest`](./mdx-ingest/readme.md)     | MDX (posts, projects, coursework, **questions**) → `content.db`. |
| [`json-ingest`](./json-ingest/readme.md)   | JSON (profile, skills, pages) → `content.db`.                    |

## How they fit together

```
content repo (private Git)  →  content-sync  →  content/live/
                                                      ↓
                                    ┌─────────────────┴─────────────────┐
                                    ↓                                   ↓
                             mdx-ingest                          json-ingest
                                    └─────────────────┬─────────────────┘
                                                      ↓
                                            database/output/content.db
```

Run **content-sync first**, then the two ingest tools (locally and in CI). All
three use `shared--task-manager` for ordered, parallel-safe execution.

## What's _not_ here

- **Quiz JSON export** lives in `shared/quiz-export` (DB → static JSON), not in
  `tools/` — it's a delivery format, not an authoring/ingest step.
- **MDX → HTML compilation** is not done at ingest; the body is stored raw and
  compiled later (Astro at build time, or `shared--quiz-markdown` for the quiz).

## Conventions

- Keep pipeline steps as named tasks in `src/index.ts`; logic stays in `src/helpers/`.
- Questions are **MDX only** — extend `mdx-ingest`, never `json-ingest`, for them.
- Both ingest tools depend on `content-sync`; sync content before ingesting.

## Related docs

- `_docs/02 plans/question-types-implementation-plan.md` — schema + ingest phases.
- `shared/AGENTS.md` / `shared/readme.md` — the packages these tools build on.
- `database/AGENTS.md` — schema + migration workflow.
