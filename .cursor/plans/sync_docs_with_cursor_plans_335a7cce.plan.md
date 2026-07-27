---
name: Sync docs with cursor plans
overview: "Sync `_docs/` with what the 13 `.cursor/plans/*.md` actually shipped, fix a much larger pre-existing staleness problem in `_docs/02 plans/*.md` (most say `status: pending` despite being fully implemented — including the Astro blog/portfolio sites themselves), and tighten up `_docs/AGENTS.md` + the architecture doc so they stop under-representing what's built."
todos:
    - id: agents-md
      content: 'Update _docs/AGENTS.md: fix implementation-status table, remove project-management row, add .cursor/plans-vs-02-plans guidance, add key-docs rows'
      status: completed
    - id: arch-doc
      content: 'Update architecture document: Astro frontend implemented status, add cheat_sheets/learning_plans tables, bump date'
      status: completed
    - id: fix-02-plans-status
      content: Add/correct Status lines across the 10 stale _docs/02 plans/*.md files listed above
      status: completed
    - id: infra-docs
      content: Update local-dev-setup--macos.md and --debian.md for local.base.Dockerfile + make targets
      status: completed
    - id: product-prds
      content: Add CA-10 and BLOG-09 requirement rows for cheat sheets/learning plans companion content
      status: completed
    - id: companion-agents-md
      content: Update tools/AGENTS.md and shared/AGENTS.md for cheat_sheets/learning_plans tables and intermediary exclusion
      status: completed
isProject: false
---

# Sync `_docs/` with `.cursor/plans/` and fix pre-existing staleness

## What I found

**All 13 `.cursor/plans/*.md` were verified against the actual code.** 12 are fully implemented; only [`aws_s3_cloudfront_hosting_+_v2_redirect_a60ac94e.plan.md`](.cursor/plans/aws_s3_cloudfront_hosting_+_v2_redirect_a60ac94e.plan.md) was never executed (no `infrastructure/aws/`, no ADR) — per your answer, **leave that one untouched**.

**Bigger finding while cross-checking:** `_docs/02 plans/*.md` has a systemic staleness problem _independent_ of the 13 cursor plans — most of its frontmatter still says `todos[].status: pending` even though the features are long shipped and live, including the headline one: **the Astro portfolio-site and blog-site are fully built, styled, and deployed to GitHub Pages DEV** (confirmed via [`.github/workflows/deploy-dev.yaml`](.github/workflows/deploy-dev.yaml) building both), yet [`_docs/AGENTS.md`](_docs/AGENTS.md)'s implementation-status table still lists "Astro frontend, CMS, CI/CD" as **Planned**. That's the most misleading line in the docs today.

Per your answers: AWS plan stays untouched; the broader `02 plans` staleness is in scope.

## Changes

### 1. `_docs/AGENTS.md` — fix the status table + add missing entries

- Split the "Astro frontend, CMS, CI/CD | Planned" row into reality: **Astro frontend (portfolio-site + blog-site)** → Implemented; **CMS** → Planned; **Production hosting / CI-CD (AWS)** → Planned (dev GH Pages CI/CD already implemented).
- Add rows: blog companion content (cheat sheets & learning plans, DB-backed, new `cheat_sheets`/`learning_plans` tables), cross-app shared pagination (`shared/ui` `PaginationBar`), local Docker + Traefik dev environment, branded 404/error pages.
- Remove the `project-management/` row from the Layout table — folder doesn't exist anywhere in the repo, nothing references it.
- Add a short paragraph clarifying `.cursor/plans/` (ephemeral, tool-tracked, per-change) vs `_docs/02 plans/` (durable historical feature record) so this doesn't silently drift again.
- Add "Local dev environment" and "Blog companion content" rows to the "Key documents for agents" table.

### 2. `_docs/architectural-knowledge-management/01 architecture document.md`

- §5 data flow: "Astro SSG (build time, planned)" → reflect that portfolio-site + blog-site are built and deployed (DEV via GH Pages; prod hosting still draft).
- §6 content model table: add `cheat_sheets`, `learning_plans` to the table list.
- Bump "Last Updated".

### 3. `_docs/02 plans/*.md` — add/correct a **Status** line (matching the pattern already used correctly in `quiz-web-app-refactor-plan.md`/`quiz-web-app-enhancements-plan.md`), verified against code for each:

- `blog-listing-pagination.md` → mark implemented; note its explicit "no shared Pagination component" decision was **later reversed** by the `.cursor/plans` cross-app-pagination work, which added a shared `PaginationBar` to `shared/ui` — link it.
- `blog-preview-images.md` → implemented (`cover_image` column, `coverImageUrl` resolver, placeholder PNG all present).
- `blog-site-design-improvements.md` → implemented (superseded visually by the newspaper redesign below, but the F1–F6 fixes landed).
- `blog-site-newspaper-design.md` → implemented ("Paul Serban" masthead, kicker/deck/card-ruled classes, dark toggle all present).
- `blog-site-tailwind-migration.md` → implemented (`layout.css` confirmed deleted).
- `blog_site_implementation.md` → implemented (blog-site is live).
- `blog-search-sort-shared-filter.md` → implemented (`shared/ui/src/lib/postFilters.ts` exists, used by both apps).
- `nav-brush-up.md` → implemented (`SiteSwitcher`/`buildSiteTabs` dropdown confirmed, CV link removed from portfolio nav).
- `question-types-implementation-plan.md` → update the top Status line: Phases 0–4 confirmed done in code; Phases 5–6 still open (leave the body as historical rationale, don't rewrite).
- Light touch on `quiz-blog-crosslinks.md` and `portfolio-site-redesign.md` (no status field at all) — add one line noting they're implemented, for consistency with the rest of the folder.

I will **not** rewrite these docs' bodies — the historical rationale/trade-off tables are legitimate design records, not bloat. Only the status signal is wrong.

### 4. `_docs/infrastructure/local-dev-setup--macos.md` and `--debian.md`

Both are stale against the "Centralize local Dockerfiles" cursor plan:

- "Start the stack" section still says raw `docker compose ... up --build`; update to lead with `make compose_up` / `make local_base_build` (per current [`makefile`](makefile)), keeping the raw compose command as a fallback.
- "How it works" bullet "Each app has its own `local.Dockerfile`" → mention it now inherits from a shared root `local.base.Dockerfile`.
- "Related files" list → add `local.base.Dockerfile`.

### 5. Product PRDs — reflect the shipped cheat-sheets/learning-plans feature

- `_docs/product/01 prd - features requiremtns - content authring.md` → add a requirement row (CA-10) for companion content types (cheat sheets, learning plans) authored per-post.
- `_docs/product/01 prd - feature requirements - blog website.md` → add a requirement row (BLOG-09) noting cheat sheets/learning plans render as linked companion pages.

### 6. Companion AGENTS.md files (outside `_docs/` but explicitly required to stay in sync per `_docs/AGENTS.md`'s own "When editing docs" convention) — low-risk, included for completeness:

- `tools/AGENTS.md` — add `cheat_sheets`/`learning_plans` to the MDX folder→table mapping; mention `intermediary/` scanner exclusion.
- `shared/AGENTS.md` — add the two new tables to the `db-schema` exports list; mention `shared/quiz-export`'s contract now carries `cheatSheets`/`learningPlans` arrays.

### Explicitly not doing

- Not touching the AWS S3/CloudFront plan or adding a draft ADR for it (per your answer — nothing shipped).
- Not moving/renaming any `_docs/` folders — the "restructure" need is addressed by clarifying the `.cursor/plans` vs `_docs/02 plans` relationship in `_docs/AGENTS.md`, not by reshuffling files.
- Not touching `_docs/00 ideas/notes.md` — it's a backlog scratchpad, not a status tracker; "post-type: cheat-sheet" being done doesn't need pruning there.
- Not rewriting the bodies of any `_docs/02 plans/*.md` file — only status lines.
