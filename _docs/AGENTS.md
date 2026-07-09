# Documentation (`_docs/`)

Authoritative project knowledge: product intent, architecture decisions, and implementation plans. Not runtime code — keep it aligned with `shared/`, `database/`, and `tools/` as those areas evolve.

## Layout

| Path                                                                      | Purpose                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `product/`                                                                | PRDs and per-feature requirement docs (portfolio, blog, quiz, content management, learning state) |
| `architectural-knowledge-management/`                                     | Architecture overview, ADR index, decision log                                                    |
| `architectural-knowledge-management/architectural-decision-log/`          | Accepted ADRs (`adr-001` …) and `drafts/` for in-progress decisions                               |
| `architectural-knowledge-management/architectural-decision-log/*/spikes/` | Time-boxed explorations tied to an ADR                                                            |
| `02 plans/`                                                               | Step-by-step implementation plans (question types, quiz web app refactor + enhancements)         |
| `01 spikes/`                                                              | Standalone technical spikes                                                                       |
| `00 ideas/`                                                               | Early notes and whiteboard exports                                                                |
| `project-management/`                                                     | Release / milestone notes                                                                         |

## System architecture (summary)

Two Git repos: this **application monorepo** and a private **content repo** (`content--paulserban.eu`) with MDX under `content/publish`, `content/in-progress`, and `content/backlog`.

```
content repo (MDX)  →  tools/content-sync  →  content/live/
                                                    ↓
                                             tools/mdx-ingest  →  database/output/content.db
                                                                        ↓
                                                             frontend SSG (Astro) at build time
                                                             + static JSON for quiz/mobile (planned)
```

- **Stack**: TypeScript, Node.js, pnpm workspace monorepo, Astro SSG (ADR-006), SQLite (file-based build artifact).
- **Content model**: MDX frontmatter → ingest pipeline → `content.db` → static HTML + JSON data exports.
- **Tables / types**: `posts` (post, book-note, snippet), `projects`, `coursework`, `questions`, `profile`, `skills`, `tags` + `content_tags` junction.
- **CMS contract**: rows with `locked: true` are CMS-owned; MDX ingest skips them (`sync_source: 'mdx'` for pipeline writes).
- **Future surfaces**: headless CMS overrides, spaced-repetition quiz (SM-2), quiz widget + web app + mobile offline bundle, client-side learning state (no accounts in v0.1).

## Product scope (v0.1)

From `product/01 prd - product requirements document.md`:

1. **Portfolio** — home page with profile, skills, featured projects.
2. **Blog** — SSG posts, book notes, snippets; fast, SEO-friendly.
3. **Quiz** — flashcards linked to posts via slug convention; widget, web app, and mobile from one content source.

Feature-level PRDs live under `product/` (blog, portfolio, quiz widget/web/mobile, spaced repetition, user learning state, content authoring/management).

## Accepted ADRs (start here)

| ADR                                | Topic                         |
| ---------------------------------- | ----------------------------- |
| `adr-001--programming-language.md` | TypeScript                    |
| `adr-002--js-runtime.md`           | Node.js                       |
| `adr-003--monorepo-w-nx-yarn.md`   | Initial monorepo (superseded) |
| `adr-004--nx-to-lerna.md`          | pnpm workspace (current)      |
| `adr-005--content-rendering.md`    | JAMStack / SSG                |
| `adr-006--ssg-w-mdx/`              | Astro + MDX rendering         |
| `adr-007--db-tooling.md`           | Drizzle ORM for SQLite        |
| `adr-008--quiz-web-app-architecture.md` | CSR React + static JSON + shared packages |
| `adr-009--spaced-repetition-scheduler.md` | SM-2 + FSRS-5, runtime-switchable |

Remaining `_drafts/` (database engine, CMS, CI/CD, hosting, caching, mobile wrapper) are proposals, not settled. The quiz-design drafts (`sr-engine`/`quiz-ui`/`storage`/`client-state`/`delivery-targets`) are **superseded by ADR-008/009** and now just point to the as-built docs.

## Key documents for agents

| When working on…       | Read                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| Overall architecture   | `architectural-knowledge-management/01 architecture document.md` |
| MDX ingest / DB schema | `tools/AGENTS.md` + `shared/db-schema/index.ts` + `02 plans/question-types-implementation-plan.md` |
| Frontmatter contracts  | Architecture doc § MDX Frontmatter Contracts                     |
| Build-time data flow   | Architecture doc § SSG Build                                     |
| Quiz web app / export  | `frontend/apps/quiz-web-app/AGENTS.md` + `shared/AGENTS.md`; plans in `02 plans/quiz-web-app-*.md` |
| Scheduling algorithms  | `architectural-knowledge-management/spaced-repetition-algorithms-reference.md` (SM-2 + FSRS-5 behaviour, weights, tuning) |
| Product behaviour      | Relevant file under `product/`                                   |

## Implementation status (docs vs code)

| Area                                                               | Status                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| MDX ingest pipeline (scan → parse → validate → normalise → upsert) | **Implemented** — see `tools/mdx-ingest`                                |
| JSON ingest pipeline (profile, skills, pages)                      | **Implemented** — see `tools/json-ingest`                               |
| `shared/db-schema`, `shared/db`, `shared/task-manager`             | **Implemented**                                                         |
| Tags normalised to `tags` + `content_tags` (not JSON columns)      | **Implemented** — migration `0001`                                      |
| `pages` table + `profile`/`skills` slugs                           | **Implemented** — migration `0002`                                      |
| Build-time quiz JSON export (DB → static JSON)                     | **Implemented** — `shared/quiz-export` (satisfies question-types plan P4) |
| Markdown/MDX compile + sanitize for quiz content                   | **Implemented** — `shared/quiz-markdown`                                |
| Quiz web app (CSR React, SM-2 + FSRS, offline PWA)                 | **Implemented** — `frontend/apps/quiz-web-app`                          |
| Shared UI kit + newspaper design system                            | **Implemented** — `shared/ui` (consumed by quiz app; Astro-ready)       |
| Astro frontend, CMS, CI/CD                                         | Planned — see drafts and PRDs                                           |

## When editing docs

- Record significant decisions as ADRs under `architectural-decision-log/`; keep drafts in `drafts/` until accepted.
- Cross-link related ADRs and PRDs; the main overview is `architectural-knowledge-management/01 architecture document.md`.
- When ingest or schema behaviour changes, update the relevant area `AGENTS.md`/`readme.md` (`database/`, `shared/`, `tools/`) and `02 plans/question-types-implementation-plan.md`.
