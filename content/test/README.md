# Test content fixtures (`content/test/`)

Committed regression fixtures for the `test.*` AWS environment. Mirrors the layout of the private live content repo (`content/live/`), but only the `publish/` tree is required for ingest.

## Purpose

- Keep portfolio, blog, quiz, and news-feed surfaces buildable without cloning the private content repo
- Exercise every MDX/JSON ingest mapping (posts, questions \* 4 answer formats, cheat sheets, learning plans, booknotes, snippets, projects, coursework, profile, skills, experience, pages, feeds)
- Provide deterministic copy so CI regressions are reproducible

## Layout

```
content/test/content/publish/
├── posts/…          # 2 posts; one with questions + cheat_sheet + learning_plan
├── booknotes/…
├── snippets/…
├── projects/…       # 2 projects
├── coursework/…
├── profile/
├── skills/
├── experience/
├── pages/
└── feeds/           # RSS category lists for news-sync (not json-ingest)
```

## Usage

```bash
export CONTENT_DIR="$PWD/content/test/content/publish"
export DATABASE_PATH="$PWD/database/output/content-test.db"

pnpm db:migrate
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
```

CI: `deploy-test.yaml` passes `content_source: test` into `_build-site.yaml`, which sets `CONTENT_DIR` to this tree and skips `content-sync`.

Do **not** put real/live portfolio content here. Live content stays in the private repo synced into `content/live/` (git-ignored).
