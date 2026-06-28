# Architecture Document
## SE Portfolio, Blog + Flashcard Quiz Platform

| Field | Value |
| --- | --- |
| **Status** | Living — reflects what is built today |
| **Last Updated** | 2026-06-28 |
| **Scope** | High-level overview. Per-area detail lives in each area's `readme.md` / `AGENTS.md`; decisions live in the ADR log. |

> This document is intentionally short. It is a **map**, not a manual. For how a
> specific package works, read its `readme.md`. For *why* a decision was made, read
> the ADR it links to. Don't duplicate package detail here.

---

## 1. What this is

A TypeScript pnpm monorepo for a personal **portfolio**, **blog**, and a
**spaced-repetition flashcard quiz**. Content is authored as MDX/JSON in a separate
private repo, ingested into a file-based SQLite database at build time, and served
as static output (no runtime server, no accounts in v0.1).

## 2. Technology stack

| Layer | Choice | ADR |
| --- | --- | --- |
| Language | TypeScript | ADR-001 |
| JS runtime | Node.js | ADR-002 |
| Monorepo | **pnpm workspaces** (migrated off the original Nx/Lerna plan) | ADR-003 → ADR-004 |
| Content rendering | JAMStack / SSG | ADR-005 |
| SSG framework | Astro + MDX | ADR-006 |
| Database | SQLite (file-based build artifact) | draft `database-engine` |
| ORM / DB tooling | Drizzle (ORM + Kit + Studio) | ADR-007 |
| Quiz web app | CSR React 19 + zustand + static JSON, PWA | **ADR-008** |
| Spaced-repetition engine | SM-2 **and** FSRS-5, runtime-switchable | **ADR-009** |

## 3. Two repositories

| Repo | Holds |
| --- | --- |
| **Content repo** (`content--paulserban.eu`, private) | Authored MDX + JSON under `content/{publish,in-progress,backlog}`. |
| **This application monorepo** | Pipeline, database, shared libraries, and frontend surfaces. |

Decoupling content from code lets authors publish without triggering an app build,
and lets a future CMS own rows the pipeline must not overwrite (`locked: true`).

## 4. Monorepo layout

```
_docs/        product, architecture, ADRs, plans   (this folder)
content/      content/live/ — synced clone of the content repo
database/     content.db (SQLite) + Drizzle migrations
shared/       reusable packages (see shared/readme.md)
tools/        content pipeline CLIs (see tools/readme.md)
frontend/     app surfaces (apps/, sites/, poc/)
backend/, infrastructure/, assets/   scaffolds for future work
```

**Implemented today:** the content pipeline (`tools/*`), the shared packages
(`shared/*`), and the quiz web app (`frontend/apps/quiz-web-app`). Other
`frontend/` and `backend/` folders are scaffolds (see the implementation-status
table in [`_docs/AGENTS.md`](../AGENTS.md)).

## 5. End-to-end data flow

```
content repo (MDX/JSON)
  │
  ▼  tools/content-sync        clone → content/live/
  ▼  tools/mdx-ingest          MDX  → posts/projects/coursework/questions
  ▼  tools/json-ingest         JSON → profile/skills/pages
  ▼
database/output/content.db (SQLite)
  │
  ├─▶ Astro SSG (build time, planned)   queries the DB → static HTML pages
  │
  └─▶ shared/quiz-export (build-time CLI)  queries the DB → static JSON
            (posts.json, questions/<post>.json, tags.json, tags/<tag>.json,
             _all.json, copied assets; Markdown/MDX compiled to safe HTML)
                    │
                    ▼
        frontend/apps/quiz-web-app (CSR React PWA) fetches the JSON
```

Key point: **the quiz JSON is produced by `shared/quiz-export`, not by the Astro
build.** They are two independent consumers of the same `content.db`.

- Schema + types: [`shared/db-schema`](../../shared/db-schema/readme.md)
- DB runtime + lock-aware upsert: [`shared/db`](../../shared/db/readme.md)
- Question validation: [`shared/question-contract`](../../shared/question-contract/readme.md)
- Pipeline orchestration: [`shared/task-manager`](../../shared/task-manager/readme.md)

## 6. Content model & frontmatter

Tables (Drizzle): `posts` (post / book-note / snippet), `projects`, `coursework`,
`pages`, `profile`, `skills`, `questions`, `question_options`, plus `tags` +
`content_tags` / `question_tags` junctions. Full shape: `shared/db-schema`.

Frontmatter contracts (example — posts):

```yaml
---
title: "Introduction to Closures"
excerpt: "A deep dive into how closures work in JavaScript."
date: "May 06, 2026"
status: "published"   # published | draft | archived
tags: ["JavaScript", "Closures"]
---
```

Questions are authored as MDX (`{post-slug}--{uid}.mdx`); the answer/explanation is
the MDX **body**, structured answers (`answer_format`, `options`,
`correct_option_keys`, true/false `answer`) are frontmatter. The authoritative
rules live in [`shared/question-contract`](../../shared/question-contract/readme.md)
and the spike [`types-of-questions.md`](../01%20spikes/types-of-questions.md).

**CMS contract:** ingest writes `sync_source` (`mdx`/`json`) and **skips rows with
`locked: true`** (CMS-owned). See `shared/db` and `database/AGENTS.md`.

## 7. Quiz delivery (implemented)

The quiz is a strict **client-side-rendered** React PWA. Content is read-only JSON;
all user progress is slug-keyed state in the browser (zustand + `localStorage`).
Presentation is reusable: the flashcard UI lives as **blocks** in `shared/ui`
(Storybook-backed); the app provides containers + hooks that wire blocks to the
store. Scheduling supports **SM-2 and FSRS-5**, switchable at runtime with lossless
migration.

- Decision + rationale: **ADR-008** (architecture), **ADR-009** (scheduler).
- How it works: [`frontend/apps/quiz-web-app/readme.md`](../../frontend/apps/quiz-web-app/readme.md) + `AGENTS.md`.
- UI kit + blocks: [`shared/ui/readme.md`](../../shared/ui/readme.md).
- Content compile: [`shared/quiz-markdown/readme.md`](../../shared/quiz-markdown/readme.md).
- Build sequence: [`_docs/02 plans/quiz-web-app-refactor-plan.md`](../02%20plans/quiz-web-app-refactor-plan.md) and the enhancements plan.

Future surfaces (blog quiz **widget**, **mobile** wrapper) are scaffolded but not
built; the `_all.json` bundle keeps the offline-mobile door open.

## 8. Areas still in draft

CMS choice, database-engine ADR, CI/CD, deployment/hosting, caching, and the mobile
wrapper remain **drafts** under
[`architectural-decision-log/_drafts/`](./architectural-decision-log/_drafts/) —
treat them as proposals, not settled decisions. The original quiz-design drafts
(`sr-engine`/`quiz-ui`/`storage` packages, Capacitor) are **superseded by ADR-008 /
ADR-009**; the as-built design differs (consolidated `shared/*` + one CSR app).

## 9. Where to go next

| You want… | Read |
| --- | --- |
| Agent-oriented index | [`_docs/AGENTS.md`](../AGENTS.md) |
| Accepted decisions | `architectural-decision-log/adr-00*.md` |
| Ingest / schema | `tools/readme.md` + `tools/AGENTS.md`, `shared/db-schema/readme.md`, `_docs/02 plans/question-types-implementation-plan.md` |
| Quiz app | `frontend/apps/quiz-web-app/readme.md` |
| Product behaviour | `_docs/product/*` |
```
