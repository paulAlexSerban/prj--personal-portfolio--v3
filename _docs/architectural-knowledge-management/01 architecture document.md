# Architecture Document
## SE Portfolio, Blog + Flashcard Quiz Platform

| Field                 | Value                                       |
| --------------------- | ------------------------------------------- |
| **Document Version**  | 1.0                                         |
| **Status**            | Draft                                       |
| **Author**            | —                                           |
| **Last Updated**      | 2026-03-25                                  |
| **Related Documents** | [PRD v2.0](#) · [System Design Diagrams](#) |



## Technology Stack

| Layer             | Choice                      | Rationale                                                                             | ADR    |
| ----------------- | --------------------------- | ------------------------------------------------------------------------------------- | ------ |
| **SSG Framework** | Astro                       | Island architecture — minimal JS by default; native MDX support; best-in-class SSG DX | ADR-02 |
| **Quiz UI**       | React + Vite                | Component model matches widget + SPA + Capacitor target; Vite for fast builds         | ADR-03 |
| **Language**      | TypeScript (strict)         | End-to-end type safety across monorepo packages                                       | ADR-04 |
| **Database**      | SQLite                      | Zero infrastructure; file-based; git-committable build artifact; Directus-compatible  | ADR-05 |
| **ORM**           | Drizzle ORM                 | TypeScript-first schema; built-in Drizzle Studio; lightweight query layer             | ADR-06 |
| **CMS**           | Directus                    | Open-source; SQLite adapter; self-hostable; no vendor lock-in                         | ADR-07 |
| **Mobile**        | Capacitor (Ionic)           | Web-first; single codebase for iOS + Android; no React Native overhead                |
| **Monorepo**      | pnpm workspaces + Turborepo | Shared packages; parallel task execution; dependency isolation                        |
| **Styling**       | Tailwind CSS + shadcn/ui    | Utility-first; accessible component primitives; consistent design system              |
| **CI/CD**         | GitHub Actions              | Native Git integration; free for public repos                                         |
| **Hosting**       | Cloudflare Pages            | Global CDN; zero cold starts for static assets; generous free tier                    |



## Repository & Monorepo Structure

Two Git repositories. The content repository is decoupled from the application codebase so it can be updated independently without triggering a full application build.

### Content Repository (`content--blog_domain.eu`)
Contains all authored MDX files. Described in detail in §3.

### 2.2 Application Monorepo
```
root/
├── apps/
│   ├── blog/                      # Astro SSG site (portfolio + blog)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro            # Home — About, Skills, Projects
│   │   │   │   ├── portfolio.astro        # Full project listing
│   │   │   │   ├── posts/[slug].astro
│   │   │   │   ├── book-notes/[slug].astro
│   │   │   │   └── snippets/[slug].astro
│   │   │   ├── components/
│   │   │   │   ├── QuizWidget/            # Lazy-loaded Astro island
│   │   │   │   ├── Portfolio/
│   │   │   │   └── Blog/
│   │   │   └── layouts/
│   │   └── astro.config.mjs
│   │
│   ├── quiz-web/                   # Standalone Vite SPA + PWA
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── public/
│   │
│   └── quiz-mobile/                # Capacitor project (thin native wrapper)
│       ├── ios/
│       ├── android/
│       └── capacitor.config.ts
│
├── packages/
│   ├── sr-engine/                  # SM-2 algorithm — zero deps, pure TS
│   ├── quiz-ui/                    # Shared React components (Card, Rater, Session, Stats)
│   ├── storage/                    # localStorage / Capacitor Preferences abstraction
│   └── content-client/            # Typed fetch helpers for static JSON data files
│
├── tools/
│   ├── pipeline/                   # MDX ↔ SQLite CLI
│   │   ├── src/
│   │   │   ├── ingest.ts
│   │   │   ├── export.ts
│   │   │   ├── validate.ts
│   │   │   └── schema/
│   │   │       └── schema.ts       # Drizzle schema definitions
│   │   └── package.json
│   └── cms/                        # Directus bootstrap config + hooks
│
├── db/
│   └── content.db                  # SQLite database (build artifact)
│
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 3. Content Repository Structure

```
content--blog_domain.eu/
├── posts/
│   └── {slug}.mdx
├── book-notes/
│   └── {slug}.mdx
├── snippets/
│   └── {slug}.mdx
├── projects/
│   └── {slug}.mdx
├── questions/
│   └── {post-slug}--{uuid[:5]}.mdx
├── profile/
│   └── profile.mdx                 # Single file — author bio, headline, photo, links
└── skills/
    └── skills.mdx                  # Single file — array of skill entries in frontmatter
```

### 3.1 MDX Frontmatter Contracts

**Post / Book Note**
```yaml
---
slug: "introduction-to-closures"
title: "Introduction to Closures"
excerpt: "A deep dive into how closures work in JavaScript."
tags: ["javascript", "fundamentals"]
published_at: "2026-01-15"
---
```

**Snippet**
```yaml
---
slug: "debounce-hook"
title: "useDebounce Hook"
tags: ["react", "hooks"]
---
```

**Project**
```yaml
---
slug: "personal-finance-tracker"
title: "Personal Finance Tracker"
tech_stack: ["TypeScript", "React", "Supabase"]
role: "Solo Developer"
start_date: "2025-03"
end_date: null
github_url: "https://github.com/..."
live_url: "https://..."
cover_image_url: "/images/projects/finance-tracker.png"
featured: true
sort_order: 1
---
Long-form MDX description / case study content...
```

**Question**
```yaml
# Filename: introduction-to-closures--a3f9b.mdx
---
front: "What is a closure in JavaScript?"
back: "A closure is a function that retains access to its lexical scope even when executed outside that scope."
tags: ["javascript", "closures"]
---
```

**Profile**
```yaml
# profile/profile.mdx
---
name: "Jane Smith"
headline: "Senior Software Engineer · TypeScript · React · Node.js"
bio: "I build developer tools and write about the craft of software engineering."
photo_url: "/images/profile.jpg"
github_url: "https://github.com/janesmith"
linkedin_url: "https://linkedin.com/in/janesmith"
---
```

**Skills**
```yaml
# skills/skills.mdx
---
skills:
  - name: TypeScript
    category: language
    sort_order: 1
  - name: React
    category: framework
    sort_order: 1
  - name: Docker
    category: tool
    sort_order: 1
---
```

---

## 4. Data Model

### 4.1 Drizzle ORM Schema

```typescript
// tools/pipeline/src/schema/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ── Profile ────────────────────────────────────────────────────────────────
export const profile = sqliteTable('profile', {
  id:           text('id').primaryKey(),              // ULID
  name:         text('name').notNull(),
  headline:     text('headline').notNull(),
  bio:          text('bio').notNull(),
  photo_url:    text('photo_url'),
  github_url:   text('github_url'),
  linkedin_url: text('linkedin_url'),
  sync_source:  text('sync_source').default('mdx'),   // 'mdx' | 'cms'
  locked:       integer('locked', { mode: 'boolean' }).default(false),
  updated_at:   integer('updated_at', { mode: 'timestamp' }),
});

// ── Skills ─────────────────────────────────────────────────────────────────
export const skills = sqliteTable('skills', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  category:    text('category').notNull(),            // 'language'|'framework'|'tool'|'platform'
  sort_order:  integer('sort_order').default(0),
  sync_source: text('sync_source').default('mdx'),
  locked:      integer('locked', { mode: 'boolean' }).default(false),
});

// ── Projects ───────────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
  id:               text('id').primaryKey(),
  slug:             text('slug').notNull().unique(),
  title:            text('title').notNull(),
  description:      text('description').notNull(),    // MDX body
  tech_stack:       text('tech_stack'),               // JSON string[]
  role:             text('role'),
  start_date:       text('start_date'),               // ISO date string
  end_date:         text('end_date'),                 // null = ongoing
  github_url:       text('github_url'),
  live_url:         text('live_url'),
  cover_image_url:  text('cover_image_url'),
  featured:         integer('featured', { mode: 'boolean' }).default(false),
  sort_order:       integer('sort_order').default(0),
  sync_source:      text('sync_source').default('mdx'),
  locked:           integer('locked', { mode: 'boolean' }).default(false),
  updated_at:       integer('updated_at', { mode: 'timestamp' }),
});

// ── Posts ──────────────────────────────────────────────────────────────────
export const posts = sqliteTable('posts', {
  id:           text('id').primaryKey(),
  slug:         text('slug').notNull().unique(),
  type:         text('type').notNull(),               // 'post'|'book-note'|'snippet'
  title:        text('title').notNull(),
  body:         text('body').notNull(),               // raw MDX source
  excerpt:      text('excerpt'),
  tags:         text('tags'),                         // JSON string[]
  published_at: integer('published_at', { mode: 'timestamp' }),
  updated_at:   integer('updated_at', { mode: 'timestamp' }),
  sync_source:  text('sync_source').default('mdx'),
  locked:       integer('locked', { mode: 'boolean' }).default(false),
});

// ── Questions ──────────────────────────────────────────────────────────────
export const questions = sqliteTable('questions', {
  id:          text('id').primaryKey(),
  slug:        text('slug').notNull().unique(),       // {post-slug}--{uuid5}
  post_slug:   text('post_slug')
                 .notNull()
                 .references(() => posts.slug),
  front:       text('front').notNull(),
  back:        text('back').notNull(),
  tags:        text('tags'),                          // JSON string[]
  sync_source: text('sync_source').default('mdx'),
  locked:      integer('locked', { mode: 'boolean' }).default(false),
  created_at:  integer('created_at', { mode: 'timestamp' }),
  updated_at:  integer('updated_at', { mode: 'timestamp' }),
});
```

### 4.2 Entity Relationships

```
profile     (1 row — singleton)

skills      (many rows)

projects    (many rows)
  └── slug: unique, immutable

posts       (many rows)
  └── slug: unique, immutable
  └── type: 'post' | 'book-note' | 'snippet'

questions   (many rows)
  └── post_slug → posts.slug  (many-to-one)
  └── slug: "{post-slug}--{uuid5}" (encodes relationship in filename)
```

### 4.3 The `locked` / `sync_source` Contract

Every entity table carries two control columns:

| Column        | Type             | Meaning                                               |
| ------------- | ---------------- | ----------------------------------------------------- |
| `sync_source` | `'mdx' \| 'cms'` | Which surface last wrote this entity                  |
| `locked`      | boolean          | If `true`, the MDX ingest pipeline MUST skip this row |

**Transitions:**

| Event                              | `sync_source` | `locked` |
| ---------------------------------- | ------------- | -------- |
| MDX ingest (new entity)            | `'mdx'`       | `false`  |
| MDX ingest (existing, unlocked)    | `'mdx'`       | `false`  |
| Directus save hook fires           | `'cms'`       | `true`   |
| `pipeline export --slug` completes | `'mdx'`       | `false`  |

---

## 5. Content Pipeline

### 5.1 Architecture

```
tools/pipeline/
├── src/
│   ├── ingest.ts          # MDX → SQLite
│   ├── export.ts          # SQLite → MDX
│   ├── validate.ts        # Filename convention lint
│   ├── parsers/
│   │   ├── post.ts
│   │   ├── project.ts
│   │   ├── question.ts
│   │   ├── profile.ts
│   │   └── skills.ts
│   └── schema/
│       └── schema.ts      # Drizzle schema (source of truth)
└── bin/
    └── pipeline.ts        # CLI entrypoint
```

### 5.2 Ingest (MDX → SQLite)

**CLI:** `pipeline ingest [--dry-run] [--content-dir <path>]`

**Algorithm:**
```
for each MDX file in content repo:
  1. Parse frontmatter + body using `gray-matter` + `remark`
  2. Validate required fields; log error and skip if invalid
  3. For question files: extract post_slug from filename
     "{post-slug}--{uuid5}.mdx" → split on '--', take left part
  4. Check DB for existing row by slug
  5. If row exists and locked = true → SKIP (log: "skipped: cms-owned")
  6. If row exists and locked = false → UPDATE within transaction
  7. If row does not exist → INSERT within transaction
  8. Set sync_source = 'mdx', locked = false on write
```

**Transactions:** All writes for a single run are wrapped in a single SQLite transaction. On any error the entire transaction is rolled back.

**Dry-run:** `--dry-run` flag runs the full algorithm but calls `console.log` instead of writing to the DB. Returns a structured report.

**Question slug validation (CI lint step):**
```
Filename must match: /^[a-z0-9-]+--[a-z0-9]{5}\.mdx$/
post_slug must exist in posts table after ingest
Violation → warning logged; question skipped
```

### 5.3 Export (SQLite → MDX)

**CLI:** `pipeline export --slug <slug> [--force]`

**Algorithm:**
```
1. Look up entity by slug across all tables
2. Serialise DB row back to MDX frontmatter + body
3. If target MDX file exists and --force not set → prompt for confirmation
4. Write MDX file to correct directory in content repo
5. UPDATE DB row: sync_source = 'mdx', locked = false
```

### 5.4 Pipeline State Machine

```
[MDX file]
    │
    ▼  pipeline ingest
[DB: sync_source='mdx', locked=false]
    │
    │  author edits in Directus → Directus hook fires
    ▼
[DB: sync_source='cms', locked=true]
    │                               ▲
    │  pipeline ingest              │  (skipped — locked)
    │  (skips this row)             │
    │                               │
    │  pipeline export --slug       │
    ▼                               │
[MDX file written] ────────────────┘
[DB: sync_source='mdx', locked=false]
```

---

## 6. CMS & Database Tooling

### 6.1 Directus

- **Adapter:** SQLite (via `@directus/data-driver-sqlite`)
- **Collections:** `profile`, `skills`, `projects`, `posts`, `questions`
- **Hook:** A Directus Action Hook fires `on('items.update')` and `on('items.create')` for all collections, setting `locked = true` and `sync_source = 'cms'` on the affected row.

```typescript
// tools/cms/src/hooks/lock-on-save.ts
export default ({ action }) => {
  const tables = ['profile', 'skills', 'projects', 'posts', 'questions'];
  tables.forEach(table => {
    action(`${table}.items.create`, async ({ key }, { database }) => {
      await database(table).where({ id: key }).update({ locked: true, sync_source: 'cms' });
    });
    action(`${table}.items.update`, async ({ keys }, { database }) => {
      await database(table).whereIn('id', keys).update({ locked: true, sync_source: 'cms' });
    });
  });
};
```

- **Display fields:** `sync_source` and `locked` are surfaced as read-only fields in all collection views so the author can see entity ownership at a glance.

### 6.2 Drizzle Studio

Run locally with: `pnpm drizzle-kit studio`

Available at `http://localhost:4983`. Used for ad-hoc queries, data inspection, and debugging pipeline output. Not exposed in production.

---

## 7. SSG Build

### 7.1 Build-Time Data Flow

```
db/content.db (SQLite)
    │
    └── Astro build (drizzle query at build time)
          ├── Generates HTML pages:
          │     /                          ← profile + skills + featured projects + recent posts
          │     /portfolio                 ← all projects
          │     /posts/[slug]             ← each post (with quiz widget island)
          │     /book-notes/[slug]
          │     /snippets/[slug]
          │
          └── Generates static JSON data files:
                /data/questions/{slug}.json    ← questions per post
                /data/questions/_all.json      ← all questions (for mobile offline bundle)
                /data/posts.json               ← all post metadata (for quiz app post browser)
```

### 7.2 Astro Configuration

```typescript
// apps/blog/astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  integrations: [react(), mdx(), tailwind()],
  build: { assets: '_assets' },
});
```

### 7.3 Quiz Widget as Astro Island

The quiz widget is a React component loaded as an Astro island with `client:idle` directive — it hydrates only after the page is interactive and does not block LCP.

```astro
---
// apps/blog/src/pages/posts/[slug].astro
import QuizWidget from '../../components/QuizWidget/index';
const { slug } = Astro.params;
const hasQuestions = await checkHasQuestions(slug);
---
<article>
  <slot />
</article>
{hasQuestions && <QuizWidget postSlug={slug} client:idle />}
```

### 7.4 Static JSON File Generation

At build time, an Astro integration script queries the DB and writes question JSON files:

```typescript
// apps/blog/src/integrations/generate-question-data.ts
// Runs as part of astro build — not at runtime
const allQuestions = await db.select().from(questions);
const byPost = groupBy(allQuestions, q => q.post_slug);

for (const [postSlug, qs] of Object.entries(byPost)) {
  writeFileSync(
    `public/data/questions/${postSlug}.json`,
    JSON.stringify(qs)
  );
}
writeFileSync('public/data/questions/_all.json', JSON.stringify(allQuestions));
writeFileSync('public/data/posts.json', JSON.stringify(await db.select().from(posts)));
```

---

## 8. Shared Package Architecture

Each package has a single responsibility and zero knowledge of its consumers.

```
packages/
├── sr-engine/
│   ├── src/
│   │   └── sm2.ts          # Pure SM-2 implementation
│   ├── tests/
│   │   └── sm2.test.ts
│   └── package.json        # zero dependencies

├── quiz-ui/
│   ├── src/
│   │   ├── CardFront.tsx
│   │   ├── CardBack.tsx
│   │   ├── RatingButtons.tsx
│   │   ├── SessionManager.tsx
│   │   ├── StatsScreen.tsx
│   │   └── index.ts
│   └── package.json        # depends on: react, sr-engine, storage

├── storage/
│   ├── src/
│   │   ├── interface.ts    # StorageAdapter interface
│   │   ├── local.ts        # localStorage implementation
│   │   └── capacitor.ts    # Capacitor Preferences implementation
│   └── package.json

└── content-client/
    ├── src/
    │   ├── fetchQuestions.ts   # GET /data/questions/{slug}.json
    │   └── fetchPosts.ts       # GET /data/posts.json
    └── package.json
```

---

## 9. Spaced Repetition Engine

### 9.1 Public API

```typescript
// packages/sr-engine/src/sm2.ts

export type Rating = 1 | 2 | 3 | 4;  // Again=1, Hard=2, Good=3, Easy=4

export interface CardState {
  questionSlug: string;
  easeFactor:   number;   // min 1.3, default 2.5
  interval:     number;   // days until next review
  repetitions:  number;   // consecutive correct reviews
  dueDate:      string;   // ISO 8601 date 'YYYY-MM-DD'
  ignored:      boolean;
}

/** Returns a new CardState — never mutates input */
export function reviewCard(state: CardState, rating: Rating): CardState;

/** True if card.dueDate <= today */
export function isDue(state: CardState): boolean;

/** Creates a default CardState for a new (unseen) card */
export function getNewCard(questionSlug: string): CardState;
```

### 9.2 SM-2 Algorithm Implementation

```typescript
export function reviewCard(state: CardState, rating: Rating): CardState {
  const s = { ...state };   // immutable — never mutate input

  if (rating === 1) {        // Again
    s.repetitions = 0;
    s.interval    = 0;       // re-queue within same session
  } else {
    if (s.repetitions === 0)      s.interval = 1;
    else if (s.repetitions === 1) s.interval = 6;
    else                          s.interval = Math.round(s.interval * s.easeFactor);

    s.repetitions += 1;
  }

  // Ease factor adjustment (matches Anki formula)
  s.easeFactor = Math.max(
    1.3,
    s.easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02))
  );

  s.dueDate = addDays(today(), s.interval);
  return s;
}
```

### 9.3 Testing Requirements

- ≥ 95% line coverage
- Reference test cases must match known Anki SM-2 output for ratings 1–4 across at least 10 simulated review cycles
- `reviewCard` must never mutate its input — tested with `Object.freeze`

---

## 10. Client-Side State Schema

### 10.1 TypeScript Interfaces

```typescript
// packages/storage/src/interface.ts

export interface UserStats {
  version:          number;                            // schema version for migrations
  cardStates:       Record<string, CardState>;         // keyed by questionSlug
  studySets:        StudySetEntry[];
  ignoredQuestions: string[];                          // questionSlug[]
}

export interface StudySetEntry {
  postSlug: string;
  addedAt:  string;  // ISO 8601 datetime
}
```

### 10.2 Storage Adapter Interface

```typescript
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// Web implementation
export class LocalStorageAdapter implements StorageAdapter { ... }

// Mobile implementation (Capacitor)
export class CapacitorStorageAdapter implements StorageAdapter { ... }
```

### 10.3 Schema Versioning

The `version` field enables forward-compatible migrations:

```typescript
const CURRENT_VERSION = 1;

function migrate(raw: Partial<UserStats>): UserStats {
  const v = raw.version ?? 0;
  if (v < 1) { /* v0 → v1 migration */ }
  return { ...defaults, ...raw, version: CURRENT_VERSION };
}
```

### 10.4 Key Invariants

- Removing a post from `studySets` MUST NOT remove its entries from `cardStates`.
- `ignoredQuestions` is a soft-exclude list — `CardState` records are retained.
- All writes are atomic per card state update; a failed write must not leave the deck in a partially updated state.

---

## 11. Quiz Delivery Targets

### 11.1 Surface Comparison

| Surface      | Entry Point                             | Storage               | Offline            | Codebase                                    |
| ------------ | --------------------------------------- | --------------------- | ------------------ | ------------------------------------------- |
| Blog Widget  | `client:idle` Astro island on post page | localStorage          | No (fetches JSON)  | `packages/quiz-ui`                          |
| Quiz Web App | Standalone URL                          | localStorage          | Yes (PWA)          | `apps/quiz-web`                             |
| iOS App      | App Store                               | Capacitor Preferences | Yes (bundled JSON) | `apps/quiz-mobile` wrapping `apps/quiz-web` |
| Android App  | Google Play                             | Capacitor Preferences | Yes (bundled JSON) | `apps/quiz-mobile` wrapping `apps/quiz-web` |

### 11.2 Capacitor Configuration

```typescript
// apps/quiz-mobile/capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:    'eu.blog_domain.quiz',
  appName:  'Quiz',
  webDir:   '../quiz-web/dist',
  plugins: {
    Preferences: { group: 'QuizUserStats' },
  },
};
export default config;
```

### 11.3 PWA Configuration (Quiz Web App)

Service worker caches:
- App shell (HTML, JS, CSS)
- `/data/posts.json`
- `/data/questions/*.json` (lazily cached on first fetch per post)

---

## 12. CI/CD Pipeline

### 12.1 Workflow: Content Push → Deploy

**Trigger:** Push to `main` branch of `content--blog_domain.eu`

```yaml
# .github/workflows/content-sync.yml
jobs:
  ingest-and-build:
    steps:
      - Checkout content repo
      - Checkout app monorepo
      - pnpm install
      - Run: pipeline ingest --content-dir ../content
      - Commit updated db/content.db back to app repo (or upload as artifact)
      - Run: turbo build --filter=blog
      - Deploy blog dist/ to Cloudflare Pages
      - Run: turbo build --filter=quiz-web
      - Deploy quiz-web dist/ to Cloudflare Pages
```

### 12.2 Workflow: App Code Push → Deploy

**Trigger:** Push to `main` branch of app monorepo

```yaml
# .github/workflows/app-deploy.yml
jobs:
  build-and-deploy:
    steps:
      - Checkout app monorepo (db/content.db already present)
      - pnpm install
      - Run: turbo build
      - Deploy blog → Cloudflare Pages
      - Deploy quiz-web → Cloudflare Pages
      - (Optional) Run Capacitor build → Fastlane → App Store / Play Store
```

### 12.3 Turbo Task Graph

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "public/data/**"]
    },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

### 12.4 Lighthouse CI

```yaml
# Runs after blog deploy
- name: Lighthouse CI
  run: lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
# Budget: performance ≥ 95, SEO ≥ 95 — fails build if not met
```

---

## 13. Deployment Architecture

```
Cloudflare Pages
├── blog.domain.eu/              ← Astro SSG output
│   ├── (all static pages)
│   └── data/
│       ├── posts.json
│       └── questions/
│           ├── _all.json
│           └── {slug}.json
│
└── quiz.domain.eu/              ← Vite SPA output
    └── (PWA app shell + service worker)

Self-hosted (Railway / Fly.io)
└── cms.domain.eu/               ← Directus instance (author-only, auth-gated)
    └── db/content.db            ← Mounted volume

App Stores
├── iOS App Store                ← Capacitor build via Fastlane
└── Google Play Store            ← Capacitor build via Fastlane
```

---

## Key Technical Decisions

### ADR-01: SQLite as the Database Engine
**Decision:** Use SQLite as the sole database.
**Rationale:** The platform has a single author; there are no concurrent write requirements. SQLite is file-based, requires zero infrastructure, can be committed as a build artifact, and is natively supported by Directus. Moving to Postgres in v0.2 is a one-line Drizzle config change.
**Trade-off:** Not suitable for multi-author concurrent writes. Accepted for v0.1.

### ADR-02: Astro for the SSG Framework
**Decision:** Use Astro over Next.js (`output: 'export'`).
**Rationale:** Astro's island architecture delivers minimal JavaScript by default — critical for Lighthouse targets on a content-heavy blog. MDX is a first-class citizen. The `client:idle` directive gives precise control over when the quiz widget hydrates.
**Trade-off:** Smaller ecosystem than Next.js. Accepted — the SSG use case plays exactly to Astro's strengths.

### ADR-03: Capacitor over React Native
**Decision:** Wrap the Vite SPA in Capacitor rather than building a separate React Native app.
**Rationale:** The quiz app has no requirements that demand native UI components. Capacitor lets the same React codebase run on web, iOS, and Android. No separate native codebase to maintain.
**Trade-off:** Native feel is slightly less polished than a fully native app. Accepted for v0.1.

### ADR-04: Client-Side-Only User State in v0.1
**Decision:** All learner state lives in localStorage / Capacitor Preferences with no server sync.
**Rationale:** Eliminates the need for any user-facing backend, authentication system, or privacy/GDPR surface in v0.1. The Anki desktop app itself uses local storage as its primary model — this is an established pattern for spaced repetition.
**Trade-off:** No cross-device sync. Explicitly deferred to v0.2 as an optional sync layer.

### ADR-05: `locked` Flag as the Pipeline Conflict Resolution Mechanism
**Decision:** A single boolean column per entity governs whether the MDX pipeline may write to it.
**Rationale:** Bidirectional sync between a file system and a database is inherently conflict-prone. Introducing a clear ownership model (MDX-owned vs CMS-owned) eliminates ambiguity. The export CLI makes it easy to return ownership to MDX when needed.
**Trade-off:** The author must remember to run `pipeline export` to get CMS edits back into Git. A future improvement could automate this via a Directus webhook.

### ADR-06: Slug as the Cross-Surface Foreign Key
**Decision:** The `post_slug` foreign key in `questions` is derived from the question filename, not stored separately in frontmatter.
**Rationale:** Encoding the relationship in the filename makes it auditable from the file system alone — no need to open the file to know which post a question belongs to. It also prevents the author from accidentally setting an incorrect `post_slug` in frontmatter.
**Trade-off:** Slug immutability becomes a hard constraint. Enforced by CI lint check.
