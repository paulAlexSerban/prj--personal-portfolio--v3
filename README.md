# Personal Portfolio (v3)

> Repo: https://github.com/paulAlexSerban/prj--personal-portfolio--v3

## Vision & Scope

Statically generated personal portfolio website coupled with a software engineering blog that doubles as as a learning platform.
Raw content lives in a separate Git repository as MDX files.
A concent-pipeline parses MDX files into SQLite databases, which are then managed via Directus CMS.
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
    - Directus CMS as content management UI for SQLite content
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
- `database/` - database schemas, migrations, seed data, etc.
- `frontend/` - frontend applications (e.g., main website, quiz web app, etc.)
- `infrastructure/` - infrastructure as code (IaC) for deployment, hosting, etc.
- `shared/` - shared libraries and utilities (e.g., foundations library, UI components, etc.)
- `scripts/` - utility scripts for development, build, deployment, etc.
- `tests/` - test suites for various components and services (e.g., integration tests, end-to-end tests, BDD tests, UI tests, etc.)
