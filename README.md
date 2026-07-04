# Personal Portfolio (v3)

> Repo: https://github.com/paulAlexSerban/prj--personal-portfolio--v3

## Vision & Scope

Statically generated personal portfolio website coupled with a software engineering blog that doubles as as a learning platform.
Raw content lives in a separate Git repository as MDX files.
A concent-pipeline parses MDX files into SQLite databases, which are then managed via headless CMS.
Flashcard quizes (Anki style spaced repetition) are surfaced as a blog widget, a standalone web app, and a cross-platofrm mobile app.

> [!warning] IMPORTANT
> No backend user accounts in v0.1 - all user state is client side only, stored in local storage.

## Goals & Non-Goals

- **In Scope (v0.1)**
    - SSG blog (projects casestudues, posts, book-notes, snippets)
    - MDX -> SQLite conent pipeline (one-way: file -> DB)
    - Drizzle ORM for DB access and inspection
    - Flashcard Quiz Widget (blog-embeded via modal)
    - Flashcard Quiz Web App (standalone, browser-based)
    - Spaced Repetition Algorithm (SM-2, Anki compatible)
    - All user state us browser/device local only (no backend user accounts in v0.1)
    - Blog-to-quiz post selection via browser storage reference
    - Question-to-post slug correlation (1 post -> many questions, but each question references a single post)

- **Out of Scope (v0.1)**
    - Flashcard Quiz Mobile App (cross-platform, React Native)
    - A headless CMS as content management UI for SQLite content
    - SQLite -> MDX sync (round-trip : DB-edited entities unlock MDX editing capabilities)
    - User accounts and authentication (all user state is client-side only, stored in local storage)
    - Real-time content updates (content is updated via the MDX -> SQLite pipeline, not real-time)
    - Remote status sync / backend for user progrss
    - Server-side rendering (SSR) or API routes - SSG only for v0.1
    - Advanced quiz features (e.g., multimedia questions, collaborative quizzing,leaderboards, etc.)
    - Non-flashcard quiz types (e.g., multiple choice, fill-in-the-blank, etc.)
    - Advanced content types (e.g., video, audio, interactive content, etc.)
    - SEO optimization (beyond basic SSG benefits)
    - Performance optimizations (beyond basic SSG benefits)
    - Accessibility optimizations (beyond basic SSG benefits)
    - Internationalization (i18n) and localization (l10n)
    - Multi-author workflows
    - Comments and social features
    - Analytics and user tracking

## Repository Structure

- `_docs/` - documentation (project management, architectural knowledge management, etc.)
- `assets/` - tools for processing and managing static assets (e.g., images, icons, fonts, etc.)
- `backend/` - backend services (e.g., API, CMS, content pipeline, etc.)
- `content/` - live content sync with remote repo and test contenti in MDX format (e.g., blog posts, project case studies, book notes, etc.)
- `database/` - database schemas, migrations, seed data, etc.
- `frontend/` - frontend applications (e.g., main website, quiz web app, etc.)
- `infrastructure/` - infrastructure as code (IaC) for deployment, hosting, etc.
- `shared/` - shared libraries and utilities (e.g., foundations library, UI components, etc.)
- `tools/` - tools for various tasks (e.g., content ingestion, database management, etc.)
- `scripts/` - utility scripts for development, build, deployment, etc.
- `tests/` - test suites for various components and services (e.g., integration tests, end-to-end tests, BDD tests, UI tests, etc.)

## CI/CD & Deployment

### Workflows

- `.github/workflows/deploy-dev.yaml` - DEV deploy to GitHub Pages. Ingests content, builds all three apps under sub-paths, merges outputs, and publishes via GitHub Pages.

### Environments

- **DEV** - GitHub Pages, served from the project repo at `https://paulalexserban.github.io/prj--personal-portfolio--v3/`.
    - `/home/` - portfolio-site (Astro)
    - `/blog/` - blog-site (Astro)
    - `/quiz/` - quiz-web-app (Vite + React SPA)
    - `/` redirects to `/home/`.
- **TEST** / **PROD** - not yet implemented (planned separately).

### Required repository settings (one-time, manual)

These must be configured in the GitHub repository before `deploy-dev.yaml` can publish:

1. **Pages source** - Settings -> Pages -> Build and deployment -> Source: **GitHub Actions**.
2. **Secret `CONTENT_REPO_TOKEN`** - Settings -> Secrets and variables -> Actions. A PAT (or fine-grained token with `Contents: Read`) granting read access to `content--paulserban.eu`. Used by both `ingest-content.yaml` and `deploy-dev.yaml`.

### Sub-path build configuration

Each app reads its base path from an environment variable so the same build works locally (root) and on Pages (sub-path):

- portfolio-site / blog-site (Astro): `ASTRO_SITE` and `ASTRO_BASE`.
- quiz-web-app (Vite): `VITE_APP_BASE` - drives Vite `base`, the PWA manifest `start_url`/`scope`, the workbox cache pattern, and the TanStack Router `basepath`.

The quiz SPA uses a `404.html` + `sessionStorage` redirect so deep links survive GitHub Pages' lack of server-side routing.

### Triggering a DEV deploy

`deploy-dev.yaml` runs on push to `main`, or manually via Actions -> **Deploy DEV (GitHub Pages)** -> **Run workflow**.
