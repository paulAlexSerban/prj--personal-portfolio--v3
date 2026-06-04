# Tools (`tools/`)

Node.js CLIs for the content pipeline. All ingest tools use `shared--task-manager` for ordered, parallel-safe execution.

## Pipeline overview

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

Run **content-sync** before **mdx-ingest** and **json-ingest** locally and in CI.

## Question content model (ingest perspective)

All questions are **MDX only** — see [`types-of-questions.md`](../_docs/01%20spikes/types-of-questions.md) and [`migrating-question-mdx-content.md`](../_docs/01%20spikes/migrating-question-mdx-content.md).

| Axis                 | Field             | Ingest today                                                      |
| -------------------- | ----------------- | ----------------------------------------------------------------- |
| How the user answers | `answer_format`   | Not stored — defaults to `free_text`                              |
| What is tested       | `cognitive_style` | Not stored — optional frontmatter ignored until schema Phase 1    |
| Grading              | `grading_mode`    | `auto` (MC/MS/TF frontmatter) or `self` (`free_text` body reveal) |

- **`mdx-ingest`:** `publish/questions/*.mdx` → `questions.front` + `questions.back` (raw MDX body; **not** compiled to HTML in ingest).
- **`json-ingest`:** does **not** handle questions — only `profile/`, `skills/`, `pages/`.
- **Quiz delivery:** SSG may export `/data/questions/{post-slug}.json` at build time from the DB; that is not an authoring format.

---

## `@prj--personal-portfolio--v3/tools--content-sync` (`tools/content-sync/`)

Clones the private MDX content repository into the monorepo.

**Task graph** (sequential):

1. Setup Environment — validate env, ensure target dir exists
2. Clean Repository Directory — wipe `content/live/`
3. Clone Private Repository — `git clone` with token-authenticated URL
4. Remove Unnecessary Repository Files — keep only `content/` at repo root
5. Remove Unnecessary Content Files — keep `publish`, `in-progress`, `backlog` under `content/`

Steps 4–5 run in parallel after clone (both depend on clone only).

**Env** (from root `.env` via `dotenv`): `GITHUB_TOKEN`, `CONTENT_REPO_GIT_URL`.

**Output**: `content/live/` mirroring the content repo layout.

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--content-sync start
```

**Helpers**: `cleanRepoDir.ts`, `clonePrivateRepo.ts`, `cleanupUnnecessary.ts`.

---

## `@prj--personal-portfolio--v3/tools--mdx-ingest` (`tools/mdx-ingest/`)

Reads published MDX, validates frontmatter, normalises rows, migrates DB, upserts records. **Does not compile MDX to HTML** — body is stored raw; Astro compiles at build time.

**Task graph**:

```
Scan → Parse → Validate → Normalise ──┐
                                       ├→ Upsert Records
Open DB → Run Migrations ─────────────┘
```

| Task                     | Helper                   | Responsibility                                             |
| ------------------------ | ------------------------ | ---------------------------------------------------------- |
| Scan Markdown Files      | `markdownFileScanner.ts` | Walk `content/live/content/publish/` subfolders            |
| Parse Markdown Files     | `markdownParser.ts`      | `gray-matter` frontmatter + body                           |
| Validate Parsed Files    | `validateParsedFiles.ts` | Required frontmatter per content type; skips invalid files |
| Normalise to DB Rows     | `normalise.ts`           | Map to `$inferInsert` rows, ULIDs, tag extraction          |
| Open DB / Run Migrations | `shared--db`             | Connect + apply `database/migrations/`                     |
| Upsert Records           | `upsertRecords.ts`       | Per-table upsert, tag sync, respects `locked`              |

**Env overrides**: `CONTENT_DIR`, `DATABASE_PATH`, `MIGRATIONS_DIR` (defaults relative to monorepo root).

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start:dry-run   # no writes
```

### MDX folder → table mapping

| `publish/` folder | Parser type  | DB target                      |
| ----------------- | ------------ | ------------------------------ |
| `posts/`          | `post`       | `posts` (`type = 'post'`)      |
| `booknotes/`      | `booknote`   | `posts` (`type = 'book-note'`) |
| `snippets/`       | `snippet`    | `posts` (`type = 'snippet'`)   |
| `projects/`       | `project`    | `projects`                     |
| `coursework/`     | `coursework` | `coursework`                   |
| `questions/`      | `question`   | `questions`                    |
| `pages/`          | —            | handled by `json-ingest`       |

### MDX validation

Required frontmatter (missing → file skipped with warning):

- post / booknote / snippet: `title`, `status`, `date`
- project / coursework: `title`, `status`
- question: `question`, `status`

Optional frontmatter (safe to author now; normaliser ignores until Phase 1+): `answer_format`, `cognitive_style`, `difficulty`, `concept`, `options`, `correct_option_keys`, `answer` (T/F).

Structured types: options in **frontmatter**; explanation (JSX/images) in **body**.

### Question conventions

- Filename: `{post-slug}--{uid}.mdx` → `post_slug` = everything before the last `--` (see draft ADR cross-surface FK).
- `front` ← frontmatter `question` (future alias: `stem`).
- `back` ← MDX body (answer + explanation); maps to `answer_format: free_text`, `grading_mode: self` in the content model.
- Parent post must exist in `posts` before the question upserts (FK); otherwise skipped with warning.
- Tags: `question_tags` junction; same delete-and-replace pattern as `content_tags`.

### Scanner

`markdownFileScanner.ts` default `typePattern` includes `questions`:

```typescript
/^(projects|coursework|posts|booknotes|snippets|questions)$/
```

### Tag handling (mdx upsert)

1. Upsert content rows via `upsertWithLockCheck` (skips `locked`).
2. Insert tags with `onConflictDoNothing`.
3. For each upserted slug: delete existing `content_tags` or `question_tags`, re-insert current links.

### Planned (not implemented)

- Persist `answer_format`, `cognitive_style`, `difficulty`, `grading_mode` on `questions`.
- Parse `options` / `correct_option_keys` into `question_options` table.
- Keep storing full MDX body for explanation compilation at build/quiz render time.

---

## `@prj--personal-portfolio--v3/tools--json-ingest` (`tools/json-ingest/`)

Reads published JSON for site config content, validates fields, normalises rows, migrates DB, upserts records.

**Task graph** (same shape as mdx-ingest):

```
Scan → Parse → Validate → Normalise ──┐
                                       ├→ Upsert Records
Open DB → Run Migrations ─────────────┘
```

| Task                     | Helper                   | Responsibility                                                |
| ------------------------ | ------------------------ | ------------------------------------------------------------- |
| Scan JSON Files          | `jsonFileScanner.ts`     | Walk configured folders under `publish/`                      |
| Parse JSON Files         | `jsonParser.ts`          | Parse JSON; skills file may be array or `{ "skills": [...] }` |
| Validate Parsed Files    | `validateParsedFiles.ts` | Required fields per content type                              |
| Normalise to DB Rows     | `normalise.ts`           | Map to `$inferInsert` rows, ULIDs                             |
| Open DB / Run Migrations | `shared--db`             | Connect + apply migrations                                    |
| Upsert Records           | `upsertRecords.ts`       | Upsert with `sync_source: 'json'`, respects `locked`          |

**Env overrides**: `CONTENT_DIR`, `DATABASE_PATH`, `MIGRATIONS_DIR`.

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start:dry-run
```

### JSON folder → table mapping (today)

| `publish/` folder | File shape                                                          | DB target                                                                 |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `profile/`        | `{ name, headline, bio, ... }`                                      | `profile` (singleton slug `profile`)                                      |
| `skills/`         | array or `{ skills: [...] }` with `{ name, category, sort_order? }` | `skills` (slug from kebab-case name)                                      |
| `pages/`          | `{ title, status, slug?, ... }` per file                            | `pages` (slug from filename or `slug` field; extra fields in `body` JSON) |

### JSON validation

Required fields (missing → skipped with warning):

- profile: `name`, `headline`, `bio`
- skill: `name`, `category`
- page: `title`, `status`

---

## Agent notes

- Keep pipeline steps as named tasks in `src/index.ts`; logic stays in `src/helpers/`.
- Both ingest tools depend on `tools--content-sync` — sync content first.
- `profile`, `skills`, and `pages` are written by **json-ingest**; MDX content types by **mdx-ingest**.
- All question types (including MC/TF) are authored as **MDX**; extend **mdx-ingest** only — never json-ingest for questions.
- Do not serialise MDX to HTML in mdx-ingest.

## Related docs

- `_docs/01 spikes/types-of-questions.md` — `answer_format` + `cognitive_style`
- `_docs/01 spikes/migrating-question-mdx-content.md` — what authors change in MDX
- `_docs/02 plans/question-types-implementation-plan.md` — schema and ingest phases
- `shared/AGENTS.md`, `database/AGENTS.md` — schema and migration workflow
