# Documentation (`_docs/`)

Authoritative project knowledge: product intent, architecture decisions, and implementation plans. Not runtime code — keep it aligned with `shared/`, `database/`, and `tools/` as those areas evolve.

## Layout

| Path                                                                      | Purpose                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `product/`                                                                | PRDs and per-feature requirement docs (portfolio, blog, quiz, content management, learning state) |
| `architectural-knowledge-management/`                                     | Architecture overview, ADR index, decision log                                                    |
| `architectural-knowledge-management/architectural-decision-log/`          | Accepted ADRs (`adr-001` …) and `drafts/` for in-progress decisions                               |
| `architectural-knowledge-management/architectural-decision-log/*/spikes/` | Time-boxed explorations tied to an ADR                                                            |
| `02 plans/`                                                               | Durable historical feature records (question types, quiz refactor, blog/portfolio site builds)    |
| `01 spikes/`                                                              | Standalone technical spikes                                                                       |
| `00 ideas/`                                                               | Early notes and whiteboard exports                                                                |
| `infrastructure/`                                                         | Local Docker + Traefik setup guides (macOS, Debian)                                               |

### Plans: `.cursor/plans/` vs `_docs/02 plans/`

| Location | Role |
| -------- | ---- |
| `.cursor/plans/*.md` | Ephemeral, tool-tracked per-change plans (session work). May lag or predate `_docs/`; do not treat as the source of truth for "what's built". |
| `_docs/02 plans/*.md` | Durable historical feature records. Keep a **Status** line at the top (implemented / partial / open) so agents don't re-execute finished work. |

When a `.cursor/plans` change ships, update the matching `_docs/02 plans` status (and this file's implementation-status table) in the same PR when the feature is durable enough to document.

## System architecture (summary)

Two Git repos: this **application monorepo** and a private **content repo** (`content--paulserban.eu`) with MDX under `content/publish`, `content/in-progress`, and `content/backlog`.

```
content repo (MDX)  →  tools/content-sync  →  content/live/
                                                    ↓
                                    ┌───────────────┴───────────────┐
                                    ↓                               ↓
                             tools/mdx-ingest                tools/json-ingest
                                    └───────────────┬───────────────┘
                                                    ↓
                                          database/output/content.db
                                                    ↓
                         ┌──────────────────────────┼──────────────────────────┐
                         ↓                          ↓                          ↓
              portfolio-site (Astro)        blog-site (Astro)        shared/quiz-export → quiz JSON
```

- **Stack**: TypeScript, Node.js, pnpm workspace monorepo, Astro SSG (ADR-006), SQLite (file-based build artifact).
- **Content model**: MDX frontmatter → ingest pipeline → `content.db` → static HTML + JSON data exports.
- **Tables / types**: `posts` (post, book-note, snippet), `projects`, `coursework`, `questions`, `cheat_sheets`, `learning_plans`, `profile`, `skills`, `tags` + `content_tags` / `question_tags` junctions.
- **CMS contract**: rows with `locked: true` are CMS-owned; MDX ingest skips them (`sync_source: 'mdx'` for pipeline writes).
- **Future surfaces**: headless CMS overrides, quiz widget on blog posts, mobile offline bundle; production hosting TBD (ADR-010).

## Product scope (v0.1)

From `product/01 prd - product requirements document.md`:

1. **Portfolio** — home page with profile, skills, featured projects.
2. **Blog** — SSG posts, book notes, snippets; fast, SEO-friendly; companion cheat sheets / learning plans.
3. **Quiz** — flashcards linked to posts via slug convention; widget, web app, and mobile from one content source.

Feature-level PRDs live under `product/` (blog, portfolio, quiz widget/web/mobile, spaced repetition, user learning state, content authoring/management).

## Accepted ADRs (start here)

| ADR                                       | Topic                                          |
| ----------------------------------------- | ---------------------------------------------- |
| `adr-001--programming-language.md`        | TypeScript                                     |
| `adr-002--js-runtime.md`                  | Node.js                                        |
| `adr-003--monorepo-w-nx-yarn.md`          | Initial monorepo (superseded)                  |
| `adr-004--nx-to-lerna.md`                 | pnpm workspace (current)                       |
| `adr-005--content-rendering.md`           | JAMStack / SSG                                 |
| `adr-006--ssg-w-mdx/`                     | Astro + MDX rendering                          |
| `adr-007--db-tooling.md`                  | Drizzle ORM for SQLite                         |
| `adr-008--quiz-web-app-architecture.md`   | CSR React + static JSON + shared packages      |
| `adr-009--spaced-repetition-scheduler.md` | SM-2 + FSRS-5, runtime-switchable              |
| `adr-010--release-and-branching-strategy.md` | Trunk-based branching, Changesets SemVer, CI/CD promotion |
| `adr-011--cloudfront-directory-index-rewrite.md` | CF Function rewrite for Astro `trailingSlash: always` on S3+CloudFront |

Remaining `_drafts/` (database engine, CMS, hosting, caching, mobile wrapper) are proposals, not settled. The quiz-design drafts (`sr-engine`/`quiz-ui`/`storage`/`client-state`/`delivery-targets`) are **superseded by ADR-008/009** and now just point to the as-built docs. The CI/CD draft is superseded for branching/release by ADR-010; test/stage AWS hosting uses S3+CloudFront (see ADR-011 for directory-index behaviour); production promotion remains partially stubbed.

## Key documents for agents

| When working on…       | Read                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Overall architecture   | `architectural-knowledge-management/01 architecture document.md`                                                                  |
| MDX ingest / DB schema | `tools/AGENTS.md` + `shared/db-schema/index.ts` + `02 plans/question-types-implementation-plan.md`                                 |
| Frontmatter contracts  | Architecture doc § Content model & frontmatter                                                                                    |
| Build-time data flow   | Architecture doc § End-to-end data flow                                                                                           |
| Quiz web app / export  | `frontend/apps/quiz-web-app/AGENTS.md` + `shared/AGENTS.md`; plans in `02 plans/quiz-web-app-*.md`                                 |
| Scheduling algorithms  | `architectural-knowledge-management/spaced-repetition-algorithms-reference.md` (SM-2 + FSRS-5 behaviour, weights, tuning)         |
| Local Docker + Traefik | `infrastructure/local-dev-setup--macos.md` or `infrastructure/local-dev-setup--debian.md`                                         |
| Blog companion content | `tools/AGENTS.md` (cheat sheets / learning plans ingest) + blog `companions.ts` queries; see `.cursor/plans/cheat_sheets_*`       |
| Product behaviour      | Relevant file under `product/`                                                                                                    |

## Implementation status (docs vs code)

| Area                                                               | Status                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| MDX ingest pipeline (scan → parse → validate → normalise → upsert) | **Implemented** — see `tools/mdx-ingest`                                            |
| JSON ingest pipeline (profile, skills, pages)                      | **Implemented** — see `tools/json-ingest`                                           |
| `shared/db-schema`, `shared/db`, `shared/task-manager`             | **Implemented**                                                                     |
| Tags normalised to `tags` + `content_tags` (not JSON columns)      | **Implemented** — migration `0001`                                                  |
| `pages` table + `profile`/`skills` slugs                           | **Implemented** — migration `0002`                                                  |
| Build-time quiz JSON export (DB → static JSON)                     | **Implemented** — `shared/quiz-export` (satisfies question-types plan P4)           |
| Markdown/MDX compile + sanitize for quiz content                   | **Implemented** — `shared/quiz-markdown`                                            |
| Quiz web app (CSR React, SM-2 + FSRS, offline PWA)                 | **Implemented** — `frontend/apps/quiz-web-app`                                      |
| Shared UI kit + newspaper design system                            | **Implemented** — `shared/ui` (quiz + Astro sites)                                  |
| Astro frontend (portfolio-site + blog-site)                        | **Implemented** — `frontend/sites/*`; DEV deploy via GitHub Pages                   |
| Blog companion content (cheat sheets + learning plans)             | **Implemented** — `cheat_sheets` / `learning_plans` tables + nested blog routes     |
| Cross-app shared pagination (`PaginationBar`)                      | **Implemented** — `shared/ui`                                                       |
| Branded 404 / error pages                                          | **Implemented** — portfolio, blog, quiz + GH Pages 404 router                       |
| Local Docker + Traefik (HTTPS `*.paulserban.eu`)                   | **Implemented** — `infrastructure/local/` + root `local.base.Dockerfile`            |
| DEV CI/CD (GitHub Pages)                                           | **Implemented** — `.github/workflows/deploy-dev.yaml`                               |
| Quality CI + Changesets release / stage→prod pipelines             | **Implemented** — `ci.yaml`, `release.yaml`, `_build-site.yaml` (hosting stubbed)   |
| CMS                                                                | Planned — see drafts and PRDs                                                       |
| Production hosting provider                                        | In progress — test/stage on S3+CloudFront (ADR-011); prod promotion still stubbed (ADR-010) |

## When editing docs

- Record significant decisions as ADRs under `architectural-decision-log/`; keep drafts in `drafts/` until accepted.
- Cross-link related ADRs and PRDs; the main overview is `architectural-knowledge-management/01 architecture document.md`.
- When ingest or schema behaviour changes, update the relevant area `AGENTS.md`/`readme.md` (`database/`, `shared/`, `tools/`) and `02 plans/question-types-implementation-plan.md`.
- When a feature from `.cursor/plans/` ships, update this status table and the matching `_docs/02 plans/` **Status** line.
