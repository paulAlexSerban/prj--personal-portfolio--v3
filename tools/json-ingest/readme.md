# JSON Ingest (`tools/json-ingest/`)

**Step 2 of the content pipeline (alongside `mdx-ingest`).** Reads the synced JSON
site-config content and upserts it into the SQLite database.

**Package:** `@prj--personal-portfolio--v3/tools--json-ingest`

## Why it exists

Not all content is prose. Profile details, the skills list, and standalone pages
are authored as **JSON**, not MDX. This CLI ingests those into the same
`content.db` so the frontend can render the home page, about section, and pages
from one queryable source.

> **It never handles questions.** All quiz questions (including multiple-choice and
> true/false) are MDX and belong to `mdx-ingest`. This tool only does
> `profile/`, `skills/`, and `pages/`.

```
content/live/.../publish/{profile,skills,pages}/*.json ──► scan → parse → validate → normalise ──► upsert ──► content.db
```

## What it does (task graph — same shape as `mdx-ingest`)

```
Scan → Parse → Validate → Normalise ──┐
                                       ├→ Upsert Records
Open DB → Run Migrations ─────────────┘
```

| Step      | Helper                   | Responsibility                                                     |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| Scan      | `jsonFileScanner.ts`     | Walk the configured `publish/` folders.                            |
| Parse     | `jsonParser.ts`          | Parse JSON (skills file may be an array or `{ "skills": [...] }`). |
| Validate  | `validateParsedFiles.ts` | Required fields per type; invalid files skipped with a warning.    |
| Normalise | `normalise.ts`           | Map to insert rows, mint ULIDs.                                    |
| Migrate   | `shared--db`             | Open the DB + apply migrations.                                    |
| Upsert    | `upsertRecords.ts`       | Upsert with `sync_source: 'json'`, respects `locked` rows.         |

## Folder → table mapping

| `publish/` folder | File shape                                                        | DB target                                                     |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `profile/`        | `{ name, headline, bio, ... }`                                    | `profile` (singleton, slug `profile`)                         |
| `skills/`         | array or `{ skills: [...] }` of `{ name, category, sort_order? }` | `skills` (slug from kebab-case name)                          |
| `pages/`          | `{ title, status, slug?, ... }` per file                          | `pages` (slug from filename or `slug`; extras in `body` JSON) |

**Required fields** (missing → skipped): profile `name`/`headline`/`bio`; skill
`name`/`category`; page `title`/`status`.

## How to run it

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start:dry-run   # no DB writes
```

Run **after** `content-sync`. Env overrides: `CONTENT_DIR`, `DATABASE_PATH`,
`MIGRATIONS_DIR`.

## Where it sits

- **Depends on:** `tools--content-sync`, `shared--db`, `shared--db-schema`, `shared--task-manager`, `ulidx`.
- **Feeds:** `content.db` (`profile`, `skills`, `pages`) → the SSG frontend.

## Related docs

- `tools/AGENTS.md` — full pipeline + per-tool detail.
- `database/AGENTS.md` — schema + migration workflow.
