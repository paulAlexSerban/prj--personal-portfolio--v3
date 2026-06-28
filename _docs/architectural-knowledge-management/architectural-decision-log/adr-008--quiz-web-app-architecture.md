# ADR-008: Quiz Web App Architecture (CSR React + static JSON + shared packages)
## Status: Accepted (2026-06-28)

## Context

The quiz needs to run with **no backend and no accounts** (v0.1), be installable
and usable **offline**, and share one content source with future blog-widget and
mobile surfaces. Earlier design drafts proposed a constellation of small packages
(`packages/sr-engine`, `packages/quiz-ui`, `packages/storage`,
`packages/content-client`) and an `apps/quiz-web` + Capacitor `apps/quiz-mobile`.
During implementation that shape proved heavier than needed.

## Decision

Build the quiz as a **single strict client-side-rendered (CSR) React 19 app** at
`frontend/apps/quiz-web-app`, fed by **static JSON exported from the SQLite DB**,
with reusable UI and content libraries in `shared/`:

- **Content:** `shared/quiz-export` (build-time CLI) reads `content.db` and writes
  `posts.json`, `questions/<post>.json`, `tags*.json`, and `_all.json` (with
  Markdown/MDX precompiled to safe HTML). The app `fetch()`es these — no DB or
  server in the browser.
- **Rendering:** `shared/quiz-markdown` is the single Markdown/MDX → sanitized-HTML
  pipeline (one DOMPurify allow-list, used by export and the app).
- **UI:** presentation "blocks" live in `shared/ui` (`./blocks`, Storybook-backed);
  the app holds only containers + hooks + routes + store + schedulers.
- **State:** client progress is a zustand store persisted to `localStorage`, keyed
  by **question slug** (stable). Content and progress are kept separate.
- **Offline:** `vite-plugin-pwa` precaches the shell + indexes; per-post/tag files
  are runtime-cached stale-while-revalidate.

## Why

- No infra/accounts to operate; deploys as static assets behind a CDN (fits ADR-005).
- Slug-keyed progress survives content re-exports and additive set changes.
- Consolidating into `shared/*` (instead of many tiny `packages/*`) reduces
  wiring while still letting the blog widget / mobile reuse the same export + UI.
- One sanitize allow-list closes the XSS gap a split design risked.

## Consequences

- Correct answers ship to the client (acceptable for v0.1 no-backend; revisit if a
  graded backend is ever added).
- The Astro SSG and the quiz app are **independent** consumers of `content.db`.
- Mobile (Capacitor) is **not built**; `_all.json` keeps the door open.

## Supersedes (drafts)

`_drafts/adr-000--quiz-delivery-targets.md`, `adr-000--quiz-ui.md`,
`adr-000--shared-package-architecture.md`, `adr-000--client-side-state-schema.md`
— the as-built layout differs (no `packages/sr-engine|quiz-ui|storage`).

## See also

- Plans: `_docs/02 plans/quiz-web-app-refactor-plan.md` (+ enhancements plan).
- Code: `frontend/apps/quiz-web-app/AGENTS.md`, `shared/quiz-export/readme.md`,
  `shared/quiz-markdown/readme.md`, `shared/ui/readme.md`.
- Scheduler decision: ADR-009.
