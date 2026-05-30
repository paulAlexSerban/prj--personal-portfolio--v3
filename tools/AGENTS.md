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
                                            database/content.db
```

Run **content-sync** before **mdx-ingest** and **json-ingest** locally and in CI.

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

## `@prj--personal-portfolio--v3/tools--mdx-ingest` (`tools/mdx-ingest/`)

Reads published MDX, validates frontmatter, normalises rows, migrates DB, upserts records. **Does not compile MDX to HTML** — body is stored raw; Astro compiles at build time.

**Task graph**:

```
Scan → Parse → Validate → Normalise ──┐
                                       ├→ Upsert Records
Open DB → Run Migrations ─────────────┘
```

| Task | Helper | Responsibility |
|------|--------|----------------|
| Scan Markdown Files | `markdownFileScanner.ts` | Walk `content/live/content/publish/` subfolders |
| Parse Markdown Files | `markdownParser.ts` | `gray-matter` frontmatter + body |
| Validate Parsed Files | `validateParsedFiles.ts` | Required frontmatter per content type; skips invalid files |
| Normalise to DB Rows | `normalise.ts` | Map to `$inferInsert` rows, ULIDs, tag extraction |
| Open DB / Run Migrations | `shared--db` | Connect + apply `database/migrations/` |
| Upsert Records | `upsertRecords.ts` | Per-table upsert, tag sync, respects `locked` |

**Env overrides**: `CONTENT_DIR`, `DATABASE_PATH`, `MIGRATIONS_DIR` (defaults relative to monorepo root).

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start:dry-run   # no writes
```

### MDX folder → table mapping

| `publish/` folder | Parser type | DB target |
|-------------------|-------------|-----------|
| `posts/` | `post` | `posts` (`type = 'post'`) |
| `booknotes/` | `booknote` | `posts` (`type = 'book-note'`) |
| `snippets/` | `snippet` | `posts` (`type = 'snippet'`) |
| `projects/` | `project` | `projects` |
| `coursework/` | `coursework` | `coursework` |
| `questions/` | `question` | `questions` |
| `pages/` | — | handled by `json-ingest` |

### MDX validation

Required frontmatter (missing → file skipped with warning):

- post / booknote / snippet: `title`, `status`, `date`
- project / coursework: `title`, `status`
- question: `question`, `status`

### Question conventions

- Filename: `{post-slug}--{uid}.mdx` → `post_slug` = everything before the last `--`.
- Body holds answer/explanation; `front` comes from frontmatter `question`.

### Tag handling (mdx upsert)

1. Upsert content rows via `upsertWithLockCheck` (skips `locked`).
2. Insert tags with `onConflictDoNothing`.
3. For each upserted slug: delete existing `content_tags`, re-insert current links.

### Known gap (mdx)

The default scanner regex in `markdownFileScanner.ts` matches `projects|coursework|posts|booknotes|snippets` but **not `questions`**. Extend the pattern before questions are ingested.

## `@prj--personal-portfolio--v3/tools--json-ingest` (`tools/json-ingest/`)

Reads published JSON for site config content, validates fields, normalises rows, migrates DB, upserts records.

**Task graph** (same shape as mdx-ingest):

```
Scan → Parse → Validate → Normalise ──┐
                                       ├→ Upsert Records
Open DB → Run Migrations ─────────────┘
```

| Task | Helper | Responsibility |
|------|--------|----------------|
| Scan JSON Files | `jsonFileScanner.ts` | Walk `profile/`, `skills/`, `pages/` under `publish/` |
| Parse JSON Files | `jsonParser.ts` | Parse JSON; skills file may be array or `{ "skills": [...] }` |
| Validate Parsed Files | `validateParsedFiles.ts` | Required fields per content type |
| Normalise to DB Rows | `normalise.ts` | Map to `$inferInsert` rows, ULIDs |
| Open DB / Run Migrations | `shared--db` | Connect + apply migrations |
| Upsert Records | `upsertRecords.ts` | Upsert with `sync_source: 'json'`, respects `locked` |

**Env overrides**: `CONTENT_DIR`, `DATABASE_PATH`, `MIGRATIONS_DIR`.

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start:dry-run
```

### JSON folder → table mapping

| `publish/` folder | File shape | DB target |
|-------------------|------------|-----------|
| `profile/` | `{ name, headline, bio, ... }` | `profile` (singleton slug `profile`) |
| `skills/` | array or `{ skills: [...] }` with `{ name, category, sort_order? }` | `skills` (slug from kebab-case name) |
| `pages/` | `{ title, status, slug?, ... }` per file | `pages` (slug from filename or `slug` field; extra fields in `body` JSON) |

### JSON validation

Required fields (missing → skipped with warning):

- profile: `name`, `headline`, `bio`
- skill: `name`, `category`
- page: `title`, `status`

## Agent notes

- Keep pipeline steps as named tasks in `src/index.ts`; logic stays in `src/helpers/`.
- Both ingest tools depend on `tools--content-sync` — sync content first.
- `profile`, `skills`, and `pages` are written by **json-ingest**; MDX types by **mdx-ingest**.
- Do not serialise MDX to HTML in mdx-ingest.

## Related docs

- `_docs/02 plans/mdx-ingest-pipeline.md` — MDX pipeline plan
- `shared/AGENTS.md`, `database/AGENTS.md` — schema and migration workflow
