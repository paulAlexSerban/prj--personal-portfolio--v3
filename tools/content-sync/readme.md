# Content Sync (`tools/content-sync/`)

**Step 1 of the content pipeline.** Clones the private MDX/JSON content repository
into this monorepo so the ingest tools have something to read.

**Package:** `@prj--personal-portfolio--v3/tools--content-sync`

## Why it exists

Content (MDX posts, questions, JSON profile/skills/pages) lives in a **separate
private Git repo**, not in this one. Before anything can be ingested into the
database, that content has to be pulled down locally. This CLI does exactly that
and trims the clone to just the folders the pipeline cares about.

```
private content repo ──(git clone)──► content/live/  (publish / in-progress / backlog)
```

## What it does (task graph, sequential)

1. **Setup Environment** — validate env vars, ensure the target dir exists.
2. **Clean Repository Directory** — wipe `content/live/`.
3. **Clone Private Repository** — `git clone` using a token-authenticated URL.
4. **Remove Unnecessary Repository Files** — keep only `content/` at the repo root.
5. **Remove Unnecessary Content Files** — keep `publish`, `in-progress`, `backlog`.

Steps 4–5 run in parallel after the clone (via `shared--task-manager`).

## How to run it

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--content-sync start
```

Requires a root `.env` (loaded via `dotenv`) with:

| Var                    | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `GITHUB_TOKEN`         | Token used to authenticate the clone of the private repo. |
| `CONTENT_REPO_GIT_URL` | Git URL of the content repo.                              |

**Output:** `content/live/` mirroring the content repo layout. Run this **before**
`mdx-ingest` and `json-ingest`.

## Where it sits

- **Depends on:** `shared--task-manager`, `dotenv`.
- **Required by:** `tools--mdx-ingest`, `tools--json-ingest` (both read `content/live/`).
- **Helpers:** `cleanRepoDir.ts`, `clonePrivateRepo.ts`, `cleanupUnnecessary.ts`.

## Related docs

- `tools/AGENTS.md` — full pipeline + per-tool detail.
- `_docs/AGENTS.md` — system architecture (two-repo content model).
