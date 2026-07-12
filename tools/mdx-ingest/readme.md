# MDX Ingest (`tools/mdx-ingest/`)

**Step 2 of the content pipeline.** Reads the synced MDX files, validates them, and
upserts them into the SQLite database (`content.db`).

**Package:** `@prj--personal-portfolio--v3/tools--mdx-ingest`

## Why it exists

After `content-sync` pulls the content repo into `content/live/`, the MDX files are
just text on disk. This CLI turns them into structured, queryable database rows —
posts, projects, coursework, and **questions** — that the SSG and quiz export can
read.

> **It does not compile MDX to HTML.** The raw MDX body is stored as-is (Astro
> compiles at build time; the quiz export compiles via `shared--quiz-markdown`).
> Ingest is about _structure_, not rendering.

```
content/live/.../publish/*.mdx ──► scan → parse → validate → normalise ──► upsert ──► content.db
```

## What it does (task graph)

```
Scan → Parse → Validate → Normalise ──┐
                                       ├→ Upsert Records
Open DB → Run Migrations ─────────────┘
```

| Step      | Helper                   | Responsibility                                                                                        |
| --------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Scan      | `markdownFileScanner.ts` | Walk `publish/` subfolders (`posts`, `booknotes`, `snippets`, `projects`, `coursework`); nested `questions/` under posts/booknotes/snippets. |
| Parse     | `markdownParser.ts`      | `gray-matter` → frontmatter + body.                                                                   |
| Validate  | `validateParsedFiles.ts` | Required frontmatter per type; invalid files are skipped with a warning.                              |
| Normalise | `normalise.ts`           | Map to insert rows, mint ULIDs, extract tags.                                                         |
| Migrate   | `shared--db`             | Open the DB + apply `database/migrations/`.                                                           |
| Upsert    | `upsertRecords.ts`       | Per-table upsert, tag sync, respects `locked` (CMS-owned) rows.                                       |

## Folder → table mapping

| `publish/` folder | DB target                          |
| ----------------- | ---------------------------------- |
| `posts/`          | `posts` (`type = 'post'`)          |
| `booknotes/`      | `posts` (`type = 'book-note'`)     |
| `snippets/`       | `posts` (`type = 'snippet'`)       |
| `projects/`       | `projects`                         |
| `coursework/`     | `coursework`                       |
| `posts/.../questions/`, `booknotes/.../questions/`, `snippets/.../questions/` | `questions` (+ `question_options`) |
| `pages/`          | — (handled by `json-ingest`)       |

## Questions, specifically

- **Path:** `publish/{posts|booknotes|snippets}/{year}/{month}/{slug}/questions/{post-slug}--{uid}.mdx`
- **Filename convention** `{post-slug}--{uid}.mdx` → `post_slug` is everything
  before the last `--` (links a question to its parent post). The parent folder
  slug must match the filename prefix.
- `front` ← frontmatter `question`; `back` ← the MDX body (answer + explanation).
- Frontmatter is validated with `shared--question-contract`; MC/MS `options` +
  `correct_option_keys` become `question_options` rows; a true/false `answer` goes
  into `questions.payload`.
- The parent post must already exist in `posts` (FK), or the question is skipped.

## How to run it

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start:dry-run   # no DB writes
```

Run **after** `content-sync`. Env overrides: `CONTENT_DIR`, `DATABASE_PATH`,
`MIGRATIONS_DIR` (default relative to the monorepo root).

## Where it sits

- **Depends on:** `tools--content-sync`, `shared--db`, `shared--db-schema`, `shared--question-contract`, `shared--task-manager`, `gray-matter`, `ulidx`.
- **Feeds:** `content.db` → `shared--quiz-export` and the SSG frontend.

## Related docs

- `tools/AGENTS.md` — full per-tool detail (scanner regex, tag handling).
- `_docs/01 spikes/types-of-questions.md` — question formats.
- `_docs/02 plans/question-types-implementation-plan.md` — schema + ingest phases.
