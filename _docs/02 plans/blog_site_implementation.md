---
name: Blog Site Implementation
overview: Implement `frontend/sites/blog-site` as a standalone Astro SSG app at `blog.paulserban.eu`, covering all three content types (posts, snippets, book notes), reading from `content.db` via Drizzle, with MDX rendering via `shared/quiz-markdown` and a DOM placeholder slot for the future quiz widget.
todos:
  - id: workspace-setup
    content: G1.O1.P1 — Register frontend/sites/* in workspace + create package.json, astro.config.mjs, tsconfig, and src/ scaffold (S1–S4)
    status: pending
  - id: data-layer
    content: G1.O2.P1 — Create src/lib/db.ts + src/lib/queries/posts.ts + src/lib/queries/tags.ts (S1–S3)
    status: pending
  - id: chrome-components
    content: G1.O3.P1 — Create BaseLayout.astro, SiteHeader.astro, SiteFooter.astro (S1–S3)
    status: pending
  - id: content-components
    content: G1.O3.P2 — Create TagList.astro, PostCard.astro, HeroBanner.astro, MdxContent.astro (S4–S7)
    status: pending
  - id: hub-listing-pages
    content: G1.O4.P1 — Create index.astro (hub) + post/snippet/booknote index pages (S1–S4)
    status: pending
  - id: detail-pages
    content: G1.O4.P2 — Create post/[slug].astro (+ quiz slot), snippet/[slug].astro, booknote/[slug].astro (S5–S7)
    status: pending
  - id: tag-archive
    content: G1.O4.P3 — Create tags/[tag].astro (S8)
    status: pending
isProject: false
---

# Plan: Blog Site v3 Implementation

## Context Ledger

- Known: Legacy blog — Next.js 13, 8 routes, 3 content types, no pagination, tag archive — `frontend/legacy/prj--personal-portfolio--v2/frontend/portfolio-website/src/pages/blog/`
- Known: `pnpm-workspace.yaml` has `frontend/*` and `frontend/apps/*` but NOT `frontend/sites/*` — `pnpm-workspace.yaml:1-8`
- Known: `frontend/sites/blog-site/` is an empty directory (zero-byte `readme.md`); no `package.json`, no Astro config
- Known: `posts` table schema — `shared/db-schema/index.ts:55-71`; types `'post' | 'book-note' | 'snippet'`
- Known: `tags` + `content_tags` junction — `shared/db-schema/index.ts:4-26`
- Known: `questions.post_slug` FK — `shared/db-schema/index.ts:125`; needed for quiz slot condition
- Known: `openConnection(dbPath)` + `closeConnection(db)` — `shared/db/src/connection.ts:7-16`
- Known: `compileContent(src, opts?)` → sanitized HTML string — `shared/quiz-markdown/index.ts:13-17`; handles `<Callout>` and `<Figure>` MDX components only (see `shared/quiz-markdown/src/mdx.ts:21-44`)
- Known: `shared/ui` exports `./styles.css` with design tokens, `.md-content` typography, and hljs syntax highlight theme — `shared/ui/readme.md`
- Known: ADR-006 chose Astro; spike astro config pattern — `_docs/…/adr-006–ssg-w-mdx/spikes/01…astro.md:21-28`
- Known: PRD requirements BLOG-01–08 — `_docs/product/01 prd - feature requirements - blog website.md:9-16`
- Known: `better-sqlite3` is in `allowBuilds` — `pnpm-workspace.yaml:10`
- Assumed: Content repo is ingested before build (`pnpm db:migrate` + `tools/mdx-ingest` run); `DATABASE_PATH` env var or default relative path `../../database/output/content.db` resolves from blog-site root
- Assumed: Real content MDX files use only `<Callout>` and `<Figure>` as custom components (the `compileContent()` allowlist). If other JSX exists, those nodes will silently degrade. Needs verification against the live content repo before shipping.
- Unverified: Whether `shared/ui` peer deps (`react`, `react-dom`) need to be declared in blog-site's `package.json` or are hoisted by pnpm workspace. Likely need to be declared — low risk, easy to fix at install time.

## Open Questions

- [non-blocking] Does the live content repo use any MDX components beyond `<Callout>` and `<Figure>`? If yes, the MDX rendering step must extend `compileContent()` or switch to `@mdx-js/mdx compile()`.
- [non-blocking] What is the canonical site URL for `blog.paulserban.eu`? Needed in `astro.config.mjs` for sitemap generation and canonical links.

## Trade-off Decisions

| Decision | Options | Cost of each | Benefit of each | Chosen | Named force |
|---|---|---|---|---|---|
| MDX rendering | `compileContent()` from `shared/quiz-markdown` vs `@mdx-js/mdx compile()` | `compileContent`: only `<Callout>`+`<Figure>` components; `@mdx-js/mdx`: eval/vite-plugin complexity | `compileContent`: already tested, zero new deps; `@mdx-js/mdx`: full component injection | `compileContent()` | Single established custom-component set (`<Callout>`, `<Figure>`); no second component on the horizon; complexity of dynamic MDX eval in Astro doesn't pay for itself |
| Blog query location | Inline Drizzle in each page vs shared `blog-queries` module | Inline: mild repetition across 8 pages; shared module: extra package, workspace overhead | Inline: no abstraction cost, trivially readable; shared module: reusable if second consumer | Per-page `src/lib/queries/*.ts` helpers (local to blog-site) | One consumer (blog-site); no second consumer in sight; YAGNI on a package |
| Design system | `shared/ui` CSS + blog-site-local components vs everything local | `shared/ui`: peer dep complexity in Astro; all-local: design drift vs quiz app | `shared/ui`: `.md-content` typography and hljs theme reused for free; all-local: none | Import `shared/ui/styles.css` for tokens + typography; build blog-site-local layout components | `md-content` class and hljs theme already tuned for MDX content display; re-implementing is duplication with no variant pressure |
| URL routing | `/post/`, `/snippet/`, `/booknote/` vs `/posts/`, `/snippets/`, `/booknotes/` | Plural: matches REST convention; singular: matches legacy routes | Singular: `/blog/post/…` → `/post/…` drop-in replacement if trailingSlash added | Singular paths (`/post/`, `/snippet/`, `/booknote/`) | Direct semantic match to `posts.type` values; avoids a mapping layer |
| Pagination | Implement (infinite scroll or page-N) vs defer | Implement: extra complexity, no legacy precedent; defer: all published posts shown | Defer: simpler build, no JS runtime; implement: better at scale | Defer | BLOG-07 is "Should Have"; legacy ships all published with no pagination; post volume does not yet warrant it |

### Explicitly NOT doing
- Repository/Service layer over Drizzle — Drizzle is already the data-access seam; no second DB backend planned
- Shared `@prj--personal-portfolio--v3/shared--blog-queries` package — YAGNI; blog-site is the only consumer
- Pagination — BLOG-07 is Should Have; legacy has none; revisit when listing length becomes a UX problem
- Search — not in legacy, not in PRD scope
- Server-side rendering — PRD BLOG-01 is a Must Have for SSG-only
- React islands for the base blog chrome — content is purely static; islands cost runtime JS; no interactivity required until quiz widget
- JSON page shells (like legacy's `content/test/pages/blog/*.json`) — section copy is hardcoded in Astro components; no multi-author variant driving the separation

---

## Delivery Plan

### G1 — Blog site live at `blog.paulserban.eu` with full blog content (BLOG-01–08 satisfied)
- Intent: Reader can discover and read all published posts, snippets, and book notes via a fast, SEO-optimised static site; tag-filtered browsing works; each post page carries a quiz widget mount point.
- Gates:
  - TDD: N/A — no unit-testable logic isolated from Astro's build system; build output is the test
  - BDD: `Given the site is built, When a visitor navigates to /post/, Then all published posts appear date-descending` + `Given a post has questions, When /post/{slug} loads, Then a [data-quiz-widget] element is present`
  - Manual: smoke-check `pnpm --filter ...frontend--blog-site build` produces `dist/` with expected HTML files; spot-check one post detail page for correct MDX rendering + quiz slot presence
  - Deliverable: `frontend/sites/blog-site/dist/` deployable as a static site. Done-when: build exits 0, all 8 route families produce HTML, at least one post detail renders MDX body correctly, quiz slot present on posts with questions

#### G1.O1 — Astro app bootstrapped in pnpm workspace
- Intent: `blog-site` is a valid, installable pnpm workspace package with Astro configured for static output, MDX, and React.

##### G1.O1.P1 — Register workspace, create package scaffolding
- Depends-on: none

  - **G1.O1.P1.S1 — Register `frontend/sites/*` in pnpm workspace**
    - Intent: Ensure pnpm resolves `blog-site` as a workspace package.
    - References: [`pnpm-workspace.yaml:4`](pnpm-workspace.yaml) (modify — add `- 'frontend/sites/*'` after line 4)
    - Depends-on: none
    - Gates:
      - TDD: N/A — workspace config, not application logic
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `pnpm-workspace.yaml` contains `- 'frontend/sites/*'`. Done-when: `pnpm ls -r` lists the blog-site package after S2 adds its `package.json`

  - **G1.O1.P1.S2 — Create `package.json` for blog-site**
    - Intent: Declare package identity and all build-time dependencies.
    - References: `frontend/sites/blog-site/package.json` [NEW]
    - Depends-on: G1.O1.P1.S1
    - Details: `name: "@prj--personal-portfolio--v3/frontend--blog-site"`. Scripts: `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"`. Dependencies: `astro`, `@astrojs/mdx`, `@astrojs/react`, `@astrojs/sitemap`, `react`, `react-dom`. Workspace deps: `@prj--personal-portfolio--v3/shared--db`, `@prj--personal-portfolio--v3/shared--db-schema`, `@prj--personal-portfolio--v3/shared--quiz-markdown`, `@prj--personal-portfolio--v3/shared--ui`.
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `package.json` exists. Done-when: `pnpm --filter ...frontend--blog-site install` exits 0

  - **G1.O1.P1.S3 — Create `astro.config.mjs`**
    - Intent: Configure Astro for static output, MDX, React, and sitemap generation.
    - References: `frontend/sites/blog-site/astro.config.mjs` [NEW]; pattern from `_docs/…/spikes/01…astro.md:21-28`
    - Depends-on: G1.O1.P1.S2
    - Details: `integrations: [mdx(), react(), sitemap()]`, `output: 'static'`, `trailingSlash: 'always'`, `site: 'https://blog.paulserban.eu'` (update URL if different). No `base` path needed — subdomain root.
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `astro.config.mjs` exists. Done-when: `pnpm --filter ...frontend--blog-site dev` starts Astro dev server without config errors

  - **G1.O1.P1.S4 — Scaffold `src/` structure and TypeScript config**
    - Intent: Create the directory skeleton and TypeScript configuration so subsequent steps can create files without path errors.
    - References: `frontend/sites/blog-site/src/env.d.ts` [NEW], `frontend/sites/blog-site/tsconfig.json` [NEW], `frontend/sites/blog-site/src/pages/.gitkeep` [NEW], `frontend/sites/blog-site/src/layouts/.gitkeep` [NEW], `frontend/sites/blog-site/src/components/.gitkeep` [NEW], `frontend/sites/blog-site/src/lib/queries/.gitkeep` [NEW]
    - Depends-on: G1.O1.P1.S3
    - Details: `src/env.d.ts` must contain `/// <reference types="astro/client" />`. `tsconfig.json` must extend `"astro/tsconfigs/strict"`.
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/env.d.ts` and `tsconfig.json` exist. Done-when: `pnpm --filter ...frontend--blog-site exec tsc --noEmit` exits 0 (or Astro type-check passes)

---

#### G1.O2 — Build-time data access layer
- Intent: Type-safe Drizzle query functions covering all data shapes the blog pages need, isolated from Astro page rendering logic.

##### G1.O2.P1 — Blog-specific query helpers
- Depends-on: G1.O1.P1.S2 (package deps must be installed)

  - **G1.O2.P1.S1 — Create `src/lib/db.ts` — DB connection helper**
    - Intent: Open a single DB connection per build process; expose it for import in Astro page frontmatter.
    - References: `frontend/sites/blog-site/src/lib/db.ts` [NEW]; `shared/db/src/connection.ts:7-16` (openConnection, closeConnection API)
    - Depends-on: G1.O1.P1.S2
    - Details: Export `function openDb(): DrizzleDb` that calls `openConnection(process.env.DATABASE_PATH ?? path.resolve(import.meta.dirname, '../../../../database/output/content.db'))`. Also re-export `closeConnection`. Import `path` from `'node:path'`. Import `openConnection`, `closeConnection` from `'@prj--personal-portfolio--v3/shared--db'`.
    - Gates:
      - TDD: N/A — would test the mock, not the DB; connection verified at page build time
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/lib/db.ts` exists. Done-when: importing it in a minimal Astro page frontmatter does not throw a TypeScript error

  - **G1.O2.P1.S2 — Create `src/lib/queries/posts.ts`**
    - Intent: All post-related read queries needed across blog pages.
    - References: `frontend/sites/blog-site/src/lib/queries/posts.ts` [NEW]; `shared/db-schema/index.ts:55-71` (posts), `shared/db-schema/index.ts:14-26` (content_tags), `shared/db-schema/index.ts:4-8` (tags), `shared/db-schema/index.ts:122-141` (questions)
    - Depends-on: G1.O2.P1.S1
    - Export the following functions (all accept `db: DrizzleDb` as first arg, import tables from `'@prj--personal-portfolio--v3/shared--db-schema'`):
      - `getPublishedByType(db, type: 'post' | 'book-note' | 'snippet'): PostRow[]` — `WHERE status = 'published' AND type = type ORDER BY date DESC`
      - `getPinnedByType(db, type): PostRow[]` — `WHERE status = 'published' AND type = type AND pinned = true ORDER BY date DESC LIMIT 6`
      - `getAllSlugs(db, type): { slug: string }[]` — `WHERE type = type` (all statuses; Astro's `getStaticPaths` needs this to generate routes; unpublished pages render but are not linked from listing)
      - `getPostBySlug(db, slug: string): PostRow | undefined`
      - `getTagsForPost(db, slug: string): TagRow[]` — join `content_tags` on `content_slug = slug`, then join `tags` on `tag_slug = tags.slug`
      - `getQuestionCountForPost(db, slug: string): number` — `SELECT COUNT(*) FROM questions WHERE post_slug = slug AND status = 'published'`
    - Gates:
      - TDD: N/A — testing these functions requires a real SQLite DB fixture; the build itself acts as the integration check; adding a mock-backed test would be a mock-return assertion
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/lib/queries/posts.ts` exports all six functions. Done-when: `tsc --noEmit` passes with no type errors on this file

  - **G1.O2.P1.S3 — Create `src/lib/queries/tags.ts`**
    - Intent: Tag-related queries for the tag archive page.
    - References: `frontend/sites/blog-site/src/lib/queries/tags.ts` [NEW]; `shared/db-schema/index.ts:4-26`
    - Depends-on: G1.O2.P1.S1
    - Export:
      - `getAllBlogTags(db): TagRow[]` — distinct `tags` rows that appear in `content_tags` where `content_type IN ('post', 'book-note', 'snippet')`; used in `getStaticPaths` for `/tags/[tag]`
      - `getPostsByTagAndType(db, tagSlug: string, type: 'post' | 'book-note' | 'snippet'): PostRow[]` — join `content_tags` on `tag_slug = tagSlug AND content_type = type`; join `posts` on `slug = content_slug` where `status = 'published'`; LIMIT 9 (matching legacy `/tags/[tag].js:137`)
    - Gates:
      - TDD: N/A — same rationale as S2
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/lib/queries/tags.ts` exports two functions. Done-when: `tsc --noEmit` passes

---

#### G1.O3 — Layout and component layer
- Intent: Reusable Astro components that pages compose. No React islands — content is static; interactivity is deferred to the quiz widget phase.

##### G1.O3.P1 — Site chrome (layout, header, footer)
- Depends-on: G1.O1.P1.S4

  - **G1.O3.P1.S1 — Create `src/layouts/BaseLayout.astro`**
    - Intent: HTML shell used by every page; imports design system CSS; injects head meta.
    - References: `frontend/sites/blog-site/src/layouts/BaseLayout.astro` [NEW]
    - Depends-on: G1.O1.P1.S4
    - Props: `title: string`, `description?: string`, `ogTitle?: string`, `ogDescription?: string`, `canonicalUrl?: string`
    - Renders: `<!DOCTYPE html>`, `<html lang="en">`, `<head>` with `<meta charset>`, viewport, title, OG tags, `<link rel="canonical">`, `<link rel="sitemap">`, import of `@prj--personal-portfolio--v3/shared--ui/styles.css`, `<slot name="head" />`. Body: `<SiteHeader />`, `<main><slot /></main>`, `<SiteFooter />`.
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/layouts/BaseLayout.astro`. Done-when: any page using it produces valid HTML with `<meta og:title>` in `pnpm build` output

  - **G1.O3.P1.S2 — Create `src/components/SiteHeader.astro`**
    - Intent: Site navigation with active-link indication.
    - References: `frontend/sites/blog-site/src/components/SiteHeader.astro` [NEW]; legacy nav links from `frontend/legacy/…/siteProps.json:49-52` and footer links `Footer.organism.js:57-82`
    - Depends-on: G1.O1.P1.S4
    - Hard-coded links: `{ label: 'Blog', href: '/' }`, `{ label: 'Posts', href: '/post/' }`, `{ label: 'Snippets', href: '/snippet/' }`, `{ label: 'Book Notes', href: '/booknote/' }`. Active detection: `Astro.url.pathname.startsWith(link.href)` for non-root links; exact match for `/`.
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/components/SiteHeader.astro`. Done-when: nav renders in `pnpm build` output with all four links

  - **G1.O3.P1.S3 — Create `src/components/SiteFooter.astro`**
    - Intent: Footer with blog-type links, mirroring legacy `Footer.organism.js:57-82`.
    - References: `frontend/sites/blog-site/src/components/SiteFooter.astro` [NEW]
    - Depends-on: G1.O1.P1.S4
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/components/SiteFooter.astro`. Done-when: footer renders with `/post/`, `/snippet/`, `/booknote/` links in build output

##### G1.O3.P2 — Content display components
- Depends-on: G1.O1.P1.S4

  - **G1.O3.P2.S4 — Create `src/components/TagList.astro`**
    - Intent: Row of tag pills, each a link to the tag archive.
    - References: `frontend/sites/blog-site/src/components/TagList.astro` [NEW]; legacy `TagList.molecule.js:10` (`/tags/${sanitizeQueryString(tag)}`); v3 uses `tag.slug` from DB (already kebab-case, `shared/db-schema/index.ts:7`)
    - Depends-on: G1.O1.P1.S4
    - Props: `tags: TagRow[]`. Renders: `<ul>` of `<li><a href="/tags/{tag.slug}">{tag.name}</a></li>`.
    - Gates:
      - TDD: N/A — trivial template, no logic
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/components/TagList.astro`. Done-when: tag links render with correct slugs in build output

  - **G1.O3.P2.S5 — Create `src/components/PostCard.astro`**
    - Intent: Card component used in listing and hub pages to represent a post preview.
    - References: `frontend/sites/blog-site/src/components/PostCard.astro` [NEW]; legacy `Card.molecule.js:16` (slug construction)
    - Depends-on: G1.O1.P1.S4
    - Props: `post: PostRow`, `tags: TagRow[]`, `type: 'post' | 'book-note' | 'snippet'`
    - URL mapping: `type === 'book-note'` → `/booknote/{slug}/`; otherwise `/{type}/{slug}/`
    - Renders: title (as `<a>` to the detail page), excerpt, date, `<TagList tags={tags} />`
    - Gates:
      - TDD: N/A — trivial template
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/components/PostCard.astro`. Done-when: card renders in hub page build output with correct detail link

  - **G1.O3.P2.S6 — Create `src/components/HeroBanner.astro`**
    - Intent: Page-level hero with title, optional subheading, and optional tags — used on all listing and detail pages.
    - References: `frontend/sites/blog-site/src/components/HeroBanner.astro` [NEW]; legacy `HeroBanner.organism.js`
    - Depends-on: G1.O1.P1.S4
    - Props: `title: string`, `subheading?: string`, `tags?: TagRow[]`
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `src/components/HeroBanner.astro`. Done-when: all optional props omitted without runtime error in build

  - **G1.O3.P2.S7 — Create `src/components/MdxContent.astro`**
    - Intent: Render pre-compiled sanitized HTML from `compileContent()` using Astro's `set:html`.
    - References: `frontend/sites/blog-site/src/components/MdxContent.astro` [NEW]; `shared/quiz-markdown/index.ts:13-17`
    - Depends-on: G1.O1.P1.S4
    - Props: `html: string`
    - Renders: `<article class="md-content" set:html={html} />`. The `md-content` class activates `shared/ui` typography and syntax-highlight styles (from `shared/ui/src/styles/theme.css`).
    - Gates:
      - TDD: N/A — `set:html` is framework behavior; testing it would test Astro
      - BDD: N/A
      - Manual: Visually confirm a code block in a post detail page has syntax highlighting after build
      - Deliverable: `src/components/MdxContent.astro`. Done-when: build produces an article element with the raw HTML injected (not escaped)

---

#### G1.O4 — Static pages (all routes)
- Intent: All eight route families from the legacy blog, re-rooted at `/` (subdomain) instead of `/blog/`.

##### G1.O4.P1 — Hub and listing pages (4 pages)
- Depends-on: G1.O2.P1.S2, G1.O3.P1.S1, G1.O3.P1.S2, G1.O3.P1.S3, G1.O3.P2.S4, G1.O3.P2.S5, G1.O3.P2.S6

  - **G1.O4.P1.S1 — Create `src/pages/index.astro` — Blog hub**
    - Intent: Root page showing up to 6 pinned items per content type, with "View all" links — mirrors legacy `/blog/index.js:63-76`.
    - References: `frontend/sites/blog-site/src/pages/index.astro` [NEW]; `src/lib/queries/posts.ts` (`getPinnedByType`, `getTagsForPost`); legacy `frontend/legacy/…/src/pages/blog/index.js:63-76`
    - Depends-on: G1.O4.P1 phase dependencies above
    - Frontmatter: `const db = openDb(); const [posts, snippets, booknotes] = [getPinnedByType(db,'post'), getPinnedByType(db,'snippet'), getPinnedByType(db,'book-note')]; const tagsMap = buildTagsMap(db, [...posts, ...snippets, ...booknotes]); closeConnection(db);`. (Define `buildTagsMap` as a local helper that calls `getTagsForPost` for each slug and returns `Map<string, TagRow[]>`.)
    - Renders: `<BaseLayout>` with three sections: "Posts", "Snippets", "Book Notes". Each section: heading, `<PostCard>` for each pinned item, "View all Posts/Snippets/Book Notes" link.
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `dist/index.html`. Done-when: `pnpm build` produces root `index.html` containing three section headings and at least one card per type (assuming pinned content exists in DB)

  - **G1.O4.P1.S2 — Create `src/pages/post/index.astro`**
    - Intent: Listing of all published posts, date-descending — mirrors legacy `/blog/post/index.js`.
    - References: `frontend/sites/blog-site/src/pages/post/index.astro` [NEW]; `src/lib/queries/posts.ts` (`getPublishedByType`, `getTagsForPost`); legacy `frontend/legacy/…/src/pages/blog/post/index.js:57-61`
    - Depends-on: G1.O4.P1 phase dependencies above
    - Gates:
      - TDD: N/A
      - BDD: N/A
      - Manual: N/A
      - Deliverable: `dist/post/index.html`. Done-when: build produces `post/index.html` with all published posts rendered as cards

  - **G1.O4.P1.S3 — Create `src/pages/snippet/index.astro`**
    - Intent: Listing of all published snippets — same pattern as S2 with `type = 'snippet'`.
    - References: `frontend/sites/blog-site/src/pages/snippet/index.astro` [NEW]
    - Depends-on: G1.O4.P1 phase dependencies above
    - Gates:
      - TDD: N/A; BDD: N/A; Manual: N/A
      - Deliverable: `dist/snippet/index.html`. Done-when: build produces file

  - **G1.O4.P1.S4 — Create `src/pages/booknote/index.astro`**
    - Intent: Listing of all published book notes — same pattern with `type = 'book-note'`.
    - References: `frontend/sites/blog-site/src/pages/booknote/index.astro` [NEW]
    - Depends-on: G1.O4.P1 phase dependencies above
    - Gates:
      - TDD: N/A; BDD: N/A; Manual: N/A
      - Deliverable: `dist/booknote/index.html`. Done-when: build produces file

##### G1.O4.P2 — Detail pages with MDX rendering (3 pages)
- Depends-on: G1.O2.P1.S1, G1.O2.P1.S2, G1.O3.P1.S1, G1.O3.P1.S2, G1.O3.P1.S3, G1.O3.P2.S4, G1.O3.P2.S6, G1.O3.P2.S7

  - **G1.O4.P2.S5 — Create `src/pages/post/[slug].astro` (with quiz widget slot)**
    - Intent: Single post page: MDX body rendered as HTML, quiz widget DOM placeholder if post has questions. Satisfies BLOG-03, BLOG-04, BLOG-05.
    - References: `frontend/sites/blog-site/src/pages/post/[slug].astro` [NEW]; `src/lib/queries/posts.ts` (`getAllSlugs`, `getPostBySlug`, `getTagsForPost`, `getQuestionCountForPost`); `shared/quiz-markdown/index.ts:13-17` (`compileContent`); legacy `frontend/legacy/…/src/pages/blog/post/[slug].js:5-37`, `Post.page.js:45-50`
    - Depends-on: G1.O4.P2 phase dependencies above
    - `getStaticPaths`: `getAllSlugs(db, 'post')` → `{ params: { slug } }` for each
    - Page frontmatter: `getPostBySlug(db, slug)`, `getTagsForPost(db, slug)`, `getQuestionCountForPost(db, slug)`, `compileContent(post.body)` → `compiledHtml`
    - Renders: `<BaseLayout title={post.title} description={post.excerpt ?? post.subheading}>`, `<HeroBanner title={post.title} subheading={post.subheading} tags={tags} />`, `<MdxContent html={compiledHtml} />`, then conditionally: `{questionCount > 0 && <div id="quiz-widget-mount" data-quiz-widget data-post-slug={post.slug} />}`
    - Gates:
      - TDD: N/A
      - BDD: `Given a post has ≥1 published question, When /post/{slug} is built, Then HTML contains <div data-quiz-widget>`. `Given a post has 0 questions, When /post/{slug} is built, Then HTML does NOT contain <div data-quiz-widget>.`
      - Manual: Open one built post HTML file; verify the MDX body renders as HTML (not escaped angle brackets); verify code blocks have hljs class attributes
      - Deliverable: `dist/post/{slug}/index.html` for every slug returned by `getAllSlugs`. Done-when: build produces all files; one hand-checked file has rendered MDX and correct quiz slot presence/absence

  - **G1.O4.P2.S6 — Create `src/pages/snippet/[slug].astro`**
    - Intent: Single snippet page — same as S5 minus the quiz slot (PRD BLOG-03 scopes quiz widget to posts only).
    - References: `frontend/sites/blog-site/src/pages/snippet/[slug].astro` [NEW]; same query functions with `type = 'snippet'`; no `getQuestionCountForPost` call
    - Depends-on: G1.O4.P2 phase dependencies above
    - Gates:
      - TDD: N/A; BDD: N/A; Manual: N/A
      - Deliverable: `dist/snippet/{slug}/index.html` for all slugs. Done-when: build produces all files

  - **G1.O4.P2.S7 — Create `src/pages/booknote/[slug].astro`**
    - Intent: Single book note page — same as S6 with `type = 'book-note'`.
    - References: `frontend/sites/blog-site/src/pages/booknote/[slug].astro` [NEW]
    - Depends-on: G1.O4.P2 phase dependencies above
    - Gates:
      - TDD: N/A; BDD: N/A; Manual: N/A
      - Deliverable: `dist/booknote/{slug}/index.html` for all slugs. Done-when: build produces all files

##### G1.O4.P3 — Tag archive
- Depends-on: G1.O2.P1.S1, G1.O2.P1.S3, G1.O3.P1.S1, G1.O3.P2.S4, G1.O3.P2.S5, G1.O3.P2.S6

  - **G1.O4.P3.S8 — Create `src/pages/tags/[tag].astro`**
    - Intent: Tag archive showing up to 9 items per content type — mirrors legacy `/tags/[tag].js:101-137`. Only blog types (post, snippet, book-note); no projects or coursework (those live in other site surfaces).
    - References: `frontend/sites/blog-site/src/pages/tags/[tag].astro` [NEW]; `src/lib/queries/tags.ts` (`getAllBlogTags`, `getPostsByTagAndType`); legacy `frontend/legacy/…/src/pages/tags/[tag].js:101-137`
    - Depends-on: G1.O4.P3 phase dependencies above
    - `getStaticPaths`: `getAllBlogTags(db)` → `{ params: { tag: t.slug }, props: { tagName: t.name } }`
    - Frontmatter: call `getPostsByTagAndType(db, tag, 'post')`, `getPostsByTagAndType(db, tag, 'snippet')`, `getPostsByTagAndType(db, tag, 'book-note')`; collect tags for each result set
    - Renders: three conditional sections (only render if the section has items); each section has a heading and PostCards
    - Gates:
      - TDD: N/A
      - BDD: `Given tag "JavaScript" exists and has posts, When /tags/javascript is built, Then the Posts section renders ≤9 post cards`
      - Manual: N/A
      - Deliverable: `dist/tags/{tag}/index.html` for every tag. Done-when: build produces all tag files; one spot-checked tag page shows correct content type sections

---

## Dependency Graph

```
S1.1 → S1.2 → S1.3 → S1.4
S1.2 → S2.1 → S2.2
              S2.1 → S2.3
S1.4 → S3.1 → S3.2
       S3.1 → S3.3
S1.4 → S3.4
S1.4 → S3.5
S1.4 → S3.6
S1.4 → S3.7
(S2.2, S3.1, S3.5, S3.6) → S4.1
(S2.2, S3.4, S3.5) → S4.2
(S2.2, S3.4, S3.5) → S4.3
(S2.2, S3.4, S3.5) → S4.4
(S2.2, S3.1, S3.4, S3.6, S3.7) → S4.5
(S2.2, S3.1, S3.4, S3.6, S3.7) → S4.6
(S2.2, S3.1, S3.4, S3.6, S3.7) → S4.7
(S2.3, S3.4, S3.5, S3.6) → S4.8
```

Shorthand: `S{obj}.{step}` — e.g. `S1.1 = G1.O1.P1.S1`, `S2.2 = G1.O2.P1.S2`, `S3.1 = G1.O3.P1.S1`, `S4.5 = G1.O4.P2.S5`

---

## Red-Team Notes

**Riskiest assumption:** `compileContent()` handles all MDX components used in the live content repo. The allowlist only covers `<Callout>` and `<Figure>` (`shared/quiz-markdown/src/mdx.ts:21-44`). If real posts use other JSX, those components silently disappear from the rendered output. **Mitigation in the plan:** mark this as a [non-blocking] open question; executor should grep the live content repo for `<[A-Z]` before shipping.

**Second riskiest assumption:** `import.meta.dirname` in `src/lib/db.ts` resolves at Astro build time. Astro uses Vite which may transform this. Alternative: use `process.env.DATABASE_PATH` as the only path, document it as a required env var in `README.md`. Plan should prefer env var over computed path.

**Cargo-cult test I explicitly avoided:** Unit tests for `getPublishedByType()` that mock the Drizzle db and assert `eq(posts.status, 'published')` was called. That test asserts the mock returns what you told it to return. It would catch nothing real. Build output is the integration check.

**Pattern theatre I explicitly avoided:** A `BlogRepository` class wrapping the query functions. There is exactly one consumer (blog-site), no second backend, and Drizzle is already the data-access seam. A class wrapper here is indirection with no absorption.

**Over-decomposition I avoided:** Splitting `PostCard.astro` into `CardTitle.astro`, `CardDate.astro`, `CardExcerpt.astro` sub-atoms. These would merge together anyway and create navigation overhead with no benefit until a second card variant appears.

**BLOG-07 pagination:** I did not plan pagination. The requirement is "Should Have"; the legacy ships without it; no post-volume threshold is defined. If the executor adds it without prompting, that is scope creep. Defer until listing count is known to be a UX problem.
