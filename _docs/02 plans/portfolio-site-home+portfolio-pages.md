# Plan: Portfolio-site Home + Portfolio pages (Astro/Tailwind/SQLite, mirroring blog-site)

## Context Ledger

**Known (verified)**
- `frontend/sites/portfolio-site/` is empty (only 0-byte `readme.md`); auto-registers as a workspace package via `pnpm-workspace.yaml:6` (`frontend/sites/*`) once it has a `package.json`.
- Reference site config: `frontend/sites/blog-site/astro.config.mjs:9-33` (`output:'static'`, `trailingSlash:'always'`, `mdx`/`react`/`sitemap`, Tailwind v4 via `@tailwindcss/vite`, `better-sqlite3` SSR-external, `shared--ui` noExternal).
- Build-time DB access: `frontend/sites/blog-site/src/lib/db.ts:11-17` (`openDb()` → `openConnection(DEFAULT_DB_PATH)`, path `../../../database/output/content.db`). Identical folder depth for portfolio-site → same relative path works.
- Query pattern: `frontend/sites/blog-site/src/lib/queries/posts.ts:35-99` (Drizzle `.select().from(table).where(...).all()`, `getTagsForPost` joins `content_tags`→`tags`).
- Detail-page MDX compile: `frontend/sites/blog-site/src/pages/post/[slug].astro:18-40` (`getStaticPaths` + `@mdx-js/mdx` `evaluate(body, {...runtime, remarkPlugins:[remarkGfm], rehypePlugins:[rehypeHighlight]})`).
- Chrome to mirror: `BaseLayout.astro:1-59`, `SiteHeader.astro:1-89`, `SiteFooter.astro:1-29`, `HeroBanner.astro:1-35`, `TagList.astro:1-27`, `PostCard.astro:1-53`, `MobileNav.tsx:1-46`, `components.json:1-22`, `global.css:1-21`, `tsconfig.json:1-11`, `env.d.ts:1-2`.
- Schema (`shared/db-schema/index.ts`): `profile` (singleton; name/headline/bio/photo_url/github_url/linkedin_url, L29-41), `skills` (name/category/sort_order, L44-52), `projects` (title, body=MDX, subheading, excerpt, repo_url, demo_url, status, **pinned**, **priority**, L75-90), `posts` (L55-72), `content_tags`/`tags` (L4-26). Row types exported (`ProfileRow`, `SkillRow`, `ProjectRow`, `PostRow`, `TagRow`).
- Ingest mechanics: `tools/json-ingest` reads `CONTENT_DIR` (default `../../content/live/content/publish`) scanning `profile/`/`skills/`/`pages/`; required fields `profile`→`name,headline,bio`, `skill`→`name,category` (`validateParsedFiles.ts:15-19`). `tools/mdx-ingest` scans `projects/` (`*.mdx`), required `title,status`, optional `subheading/excerpt/repo_url/demo_url/pinned/priority/tags`; slug = filename; `tags:` YAML array → `tags`+`content_tags` with `content_type:'project'` (`normalise.ts:108-126,230-233,50-64`). Both tools auto-run migrations; both honor `CONTENT_DIR`/`DATABASE_PATH` env. Run via `pnpm --filter @prj--personal-portfolio--v3/tools--{json,mdx}-ingest start`.

**Assumed (encoded in plan; non-blocking)**
- "Featured" (PORT-03) = `projects.pinned` first, then `projects.priority` desc, then title.
- Recent Posts (HOME-07) = published `posts` by `date` desc, top 4 — **without** blog's quiz-question gating (`publishedQuestionPostSlugs`).
- Contact (OQ-10) = `profile.github_url`/`linkedin_url` links; no contact form.
- Project MDX bodies are prose; no custom MDX components (`<Callout>` etc.) used → `evaluate()` gets no component map.
- Quiz App nav URL is unconfirmed → wired as a single named constant `QUIZ_APP_URL` flagged with a `TODO` for you to set.

**Unverified**
- `database/output/content.db` is gitignored/regenerated; assumed buildable after O2 ingest. — not blocking (O2 produces it).

## Open Questions
- [non-blocking] Quiz App URL — using a single `QUIZ_APP_URL` constant (placeholder `https://quiz.paulserban.eu/`) with a `TODO`. Confirm or override.
- [non-blocking] Should `test-content` fixtures be committed? Plan commits them under the site so the build is reproducible; say if you'd rather keep them untracked.

## Trade-off Decisions

| Decision               | Options                                                                              | Cost                                                               | Benefit                                                      | Chosen                  | Named force                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Scaffold approach      | (a) mirror blog-site files, (b) `npm create astro` fresh                             | (a) manual copy; (b) drift from repo conventions, re-decide config | (a) identical conventions, zero design calls; (b) "official" | **(a) mirror**          | ADR-006 + blog-site is the accepted, only working Astro pattern; convention consistency        |
| Data access layer      | (a) per-site `src/lib/queries/*`, (b) shared `portfolio-queries` pkg                 | (a) some parallel to blog; (b) premature package, indirection      | (a) simple, local; (b) reuse if a 3rd site appears           | **(a) per-site**        | Only 2 sites; blog plan already rejected a shared query pkg (YAGNI). No second consumer exists |
| Tech stack data source | (a) `content_tags`, (b) new `tech_stack` column                                      | (a) none (seam exists); (b) schema+migration+ingest change         | (a) reuses tagging; (b) explicit field                       | **(a) content_tags**    | mdx-ingest `collectContentTags` already populates project tags; the seam exists                |
| Featured ordering      | (a) `pinned`+`priority`, (b) add `featured` column                                   | (a) none; (b) cross-package change                                 | (a) uses existing curation flags                             | **(a) pinned+priority** | No `featured` column; `pinned` is the existing curation flag                                   |
| Project detail MDX     | (a) `evaluate()` + gfm/highlight, no component map; (b) copy blog's 7 MDX components | (a) `<Callout>` etc. unsupported; (b) 7 files, unused              | (a) minimal; (b) parity                                      | **(a) minimal**         | Project fixtures are prose; no custom-MDX force exists                                         |

### Explicitly NOT doing
- **Schema `role`/`date` columns (PORT-02 partial)** — no ingest/content support; out of scope per your decision. PORT-02 met for title, long-form MDX, tech stack (tags), and links; **role/dates flagged unmet**.
- **No vitest/test runner in the site** — Astro sites here have none (blog-site has zero tests); the convention is `astro check` + `tsc --noEmit` + a real `astro build` against a populated DB. Adding a runner for a couple of query fns is pattern theatre.
- **No Repository/Service wrapper over Drizzle** — Drizzle is already the data-access seam (blog precedent).
- **No question-gating on Recent Posts** — that filter is blog-specific (quiz). Portfolio lists recent published posts.
- **PORT-04 (tech-tag filtering) + portfolio tag-archive pages — deferred** — Should-Have; no current force. Revisit when asked.

## Delivery Plan

### G1 — A recruiter can view Paul's identity, skills, and work on the new portfolio-site
- Intent: Ship `/`, `/portfolio`, `/portfolio/[slug]/` on a new Astro SSG site, pipeline-driven (HOME-05), matching blog-site conventions and the newspaper design system.
- Gates:
  - TDD: N/A — no site test runner by convention; verified by `astro check` + `astro build` against a populated `content.db`.
  - BDD (acceptance, non-automated): `Given content.db has a profile, skills, and ≥3 projects, When I build & open /, Then I see name/headline/bio/photo, skills grouped by category, a curated projects preview, recent posts, and a CTA to /portfolio; When I open /portfolio, Then I see all projects featured-first; When I open a project, Then I see its long-form MDX, tech-stack tags, and links.`
  - Manual: stakeholder visual/UAT pass on a prod-like build; WCAG 2.1 AA spot-check (NFR-A1).
  - Deliverable: portfolio-site builds and serves the three routes from the content pipeline. Done-when: `pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site build` emits `dist/index.html`, `dist/portfolio/index.html`, and `dist/portfolio/<slug>/index.html` containing DB-sourced values.

---

#### G1.O1 — Scaffold the portfolio-site Astro app
- Intent: Greenfield Astro app that builds and serves a themed empty shell with working nav/chrome.
- References: mirrors `frontend/sites/blog-site/*`.
- Depends-on: none.
- Gates: TDD N/A (config/markup). BDD N/A. Manual: nav renders, dark-mode toggle works, mobile sheet opens. Deliverable: site builds with a placeholder home. Done-when: `pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site build` exits 0.

##### G1.O1.P1 — Buildable themed shell (mergeable increment)

- **G1.O1.P1.S1 — Create `package.json`**
  - Intent: Register the workspace package with the same toolchain as blog-site.
  - References: `frontend/sites/blog-site/package.json:1-39` (copy) · `frontend/sites/portfolio-site/package.json` [NEW]
  - Depends-on: none
  - Gates: TDD N/A (manifest). BDD N/A. Manual N/A. Deliverable: `package.json` with `name:"@prj--personal-portfolio--v3/frontend--portfolio-site"`, same scripts/deps/devDeps as blog-site. Done-when: `pnpm install` completes and the package resolves under the workspace.

- **G1.O1.P1.S2 — Create `astro.config.mjs`**
  - Intent: Static SSG config with portfolio `site` URL.
  - References: `frontend/sites/blog-site/astro.config.mjs:9-33` (copy, change `site:'https://paulserban.eu'`, change react `include` to `'**/frontend/sites/portfolio-site/**'`, `mdx()` with no components map) · `frontend/sites/portfolio-site/astro.config.mjs` [NEW]
  - Depends-on: S1
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: config file. Done-when: `astro check` loads config without error (after S10).

- **G1.O1.P1.S3 — Create `tsconfig.json`, `src/env.d.ts`, `.gitignore`**
  - Intent: Strict TS + Astro client types + ignore `dist`/`.astro`.
  - References: `frontend/sites/blog-site/tsconfig.json:1-11`, `frontend/sites/blog-site/src/env.d.ts:1-2` (copy) · `frontend/sites/portfolio-site/{tsconfig.json,src/env.d.ts,.gitignore}` [NEW]
  - Depends-on: S1
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: three files. Done-when: files exist; `tsc --noEmit` runnable (after pages exist).

- **G1.O1.P1.S4 — Create `src/styles/global.css` + `public/placeholder-cover.png`**
  - Intent: Tailwind v4 entry importing the shared newspaper theme; cover placeholder for cards/hero.
  - References: `frontend/sites/blog-site/src/styles/global.css:1-21` (copy; drop the `.quiz-widget-slot` block — no quiz widget here) · copy `frontend/sites/blog-site/public/placeholder-cover.png` · `frontend/sites/portfolio-site/src/styles/global.css` [NEW] · `frontend/sites/portfolio-site/public/placeholder-cover.png` [NEW]
  - Depends-on: S1
  - Gates: TDD N/A. BDD N/A. Manual: theme tokens (`bg-newsprint`, `text-ink`) apply after S10. Deliverable: css + asset. Done-when: files exist; `@source` globs resolve at build.

- **G1.O1.P1.S5 — Create `src/lib/db.ts`**
  - Intent: Build-time SQLite opener (identical depth ⇒ identical path).
  - References: `frontend/sites/blog-site/src/lib/db.ts:1-17` (copy verbatim) · `frontend/sites/portfolio-site/src/lib/db.ts` [NEW]
  - Depends-on: S1
  - Gates: TDD N/A — copy of verified file; behavior exercised by O3/O4 builds. BDD N/A. Manual N/A. Deliverable: `db.ts`. Done-when: imports type-check; `openDb()` returns a connection in a smoke build.

- **G1.O1.P1.S6 — Create `SiteHeader.astro` + `MobileNav.tsx` + `components.json`**
  - Intent: Persistent responsive nav (NAV-01/04) with Home/Portfolio/Blog/Quiz (NAV-02) and active-state (NAV-03).
  - References: `frontend/sites/blog-site/src/components/SiteHeader.astro:1-89`, `MobileNav.tsx:1-46`, `components.json:1-22` (copy; set `navLinks=[{Home,'/'},{Portfolio,'/portfolio/'},{Blog,'https://blog.paulserban.eu/'},{Quiz App, QUIZ_APP_URL}]`; add `const QUIZ_APP_URL='https://quiz.paulserban.eu/'; // TODO confirm`; `isActive` only for internal `/` paths) · `frontend/sites/portfolio-site/src/components/{SiteHeader.astro,MobileNav.tsx}` [NEW] · `frontend/sites/portfolio-site/components.json` [NEW]
  - Depends-on: S1
  - Trade-off: external links (Blog/Quiz) get no active state (correct — different origins).
  - Gates: TDD N/A. BDD N/A. Manual: on `/`, "Home" shows `aria-current="page"`; mobile `Sheet` opens/closes. Deliverable: header + island + shadcn aliases. Done-when: header renders with 4 links; toggling dark mode persists across reload.

- **G1.O1.P1.S7 — Create `SiteFooter.astro`**
  - Intent: Footer nav + credit line.
  - References: `frontend/sites/blog-site/src/components/SiteFooter.astro:1-29` (copy; set links Home/Portfolio/Blog/Quiz) · `frontend/sites/portfolio-site/src/components/SiteFooter.astro` [NEW]
  - Depends-on: S1
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: footer. Done-when: renders within BaseLayout.

- **G1.O1.P1.S8 — Create `TagList.astro` + `HeroBanner.astro`**
  - Intent: Shared display components reused by project cards and the detail page.
  - References: `frontend/sites/blog-site/src/components/TagList.astro:1-27`, `HeroBanner.astro:1-35` (copy verbatim; both use `shared--ui/cover-image` + `TagRow`) · `frontend/sites/portfolio-site/src/components/{TagList.astro,HeroBanner.astro}` [NEW]
  - Depends-on: S1
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: two components. Done-when: type-check passes; render in a consuming page.

- **G1.O1.P1.S9 — Create `src/layouts/BaseLayout.astro`**
  - Intent: HTML shell, SEO/OG head, dark-mode boot script, header/main/footer.
  - References: `frontend/sites/blog-site/src/layouts/BaseLayout.astro:1-59` (copy; change default `pageDescription` to a portfolio string) · `frontend/sites/portfolio-site/src/layouts/BaseLayout.astro` [NEW]
  - Depends-on: S4, S6, S7
  - Gates: TDD N/A. BDD N/A. Manual: `<html>` gets `.dark` per stored/preferred theme. Deliverable: layout. Done-when: imports resolve; used by S10.

- **G1.O1.P1.S10 — Add placeholder `src/pages/index.astro` + first green build**
  - Intent: Make the shell demoable/mergeable before data pages exist (replaced in O3).
  - References: `frontend/sites/portfolio-site/src/pages/index.astro` [NEW] (minimal `<BaseLayout title="Paul Serban">` with a "Coming soon" block)
  - Depends-on: S2, S9
  - Gates: TDD N/A. BDD N/A. Manual: open dev server, see themed shell + nav. Deliverable: placeholder page. Done-when: `pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site build` exits 0 and emits `dist/index.html`.

---

#### G1.O2 — Local content fixtures + ingest into `content.db`
- Intent: Populate `profile`, `skills`, `projects` (+ tags) so pages render real data and builds are reproducible.
- References: `tools/json-ingest`, `tools/mdx-ingest`, schema `shared/db-schema/index.ts`.
- Depends-on: none (parallel to O1).
- Gates: TDD N/A (data authoring). BDD N/A. Manual: inspect rows via `pnpm db:studio`. Deliverable: populated `database/output/content.db`. Done-when: `profile` has 1 row, `skills` ≥6 rows across ≥2 categories, `projects` ≥3 rows with `content_tags`.

##### G1.O2.P1 — Author fixtures and ingest

- **G1.O2.P1.S1 — Author `profile` fixture**
  - Intent: Singleton profile JSON.
  - References: required keys `name,headline,bio`; optional `photo_url,github_url,linkedin_url` (`tools/json-ingest/src/helpers/normalise.ts:23-37`) · `frontend/sites/portfolio-site/test-content/publish/profile/profile.json` [NEW]
  - Depends-on: none
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: `profile.json`. Done-when: valid JSON with the 3 required keys + a `photo_url` pointing to `/placeholder-cover.png` (or an asset URL).

- **G1.O2.P1.S2 — Author `skills` fixture**
  - Intent: Skills across ≥2 categories with `sort_order`.
  - References: array form, required `name,category` per item (`normalise.ts:40-51`) · `frontend/sites/portfolio-site/test-content/publish/skills/skills.json` [NEW]
  - Depends-on: none
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: `skills.json` (≥6 items, ≥2 categories). Done-when: valid JSON; each item has `name`+`category`.

- **G1.O2.P1.S3 — Author ≥3 `project` MDX fixtures**
  - Intent: Mix of pinned/priority and tags for featured-first + preview behavior.
  - References: required `title,status`; optional `subheading,excerpt,repo_url,demo_url,pinned,priority,tags` (`tools/mdx-ingest/src/helpers/normalise.ts:108-126`) · `frontend/sites/portfolio-site/test-content/publish/projects/<slug>.mdx` ×3 [NEW]
  - Depends-on: none
  - Gates: TDD N/A. BDD N/A. Manual N/A. Deliverable: ≥3 MDX files, all `status: published`, ≥1 with `pinned: true`, each with `tags:` array, ≥2 paragraphs of prose body. Done-when: files parse (valid YAML frontmatter + MDX body).

- **G1.O2.P1.S4 — Run ingest and verify rows**
  - Intent: Load fixtures into the DB.
  - References: run `CONTENT_DIR="$(pwd)/frontend/sites/portfolio-site/test-content/publish" pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start` then same for `tools--mdx-ingest` (both auto-migrate).
  - Depends-on: S1, S2, S3
  - Gates: TDD N/A. BDD N/A. Manual: `pnpm db:studio` shows the rows. Deliverable: populated `database/output/content.db`. Done-when: `profile`=1 row, `skills`≥6, `projects`≥3, `content_tags` has rows with `content_type='project'`.

---

#### G1.O3 — Home page (`/`)
- Intent: Render About-Me (HOME-01), Skills grouped (HOME-02), curated Projects preview (HOME-03/04/08), Recent Posts (HOME-07), CTA to portfolio (HOME-06) — all DB-driven (HOME-05).
- References: query pattern `blog-site/src/lib/queries/posts.ts`, card pattern `PostCard.astro`.
- Depends-on: O1 (P1.S5,S8,S9), O2 (for data-backed verification).
- Gates: TDD N/A (convention). BDD: acceptance scenario at G1. Manual: visual check all five sections; keyboard tab order; AA contrast. Deliverable: `/` renders from DB. Done-when: `dist/index.html` contains `profile.name`, a skill name, a project title, and a `/portfolio/` CTA link.

##### G1.O3.P1 — Query helpers, project card, and the page

- **G1.O3.P1.S1 — `src/lib/queries/profile.ts`**
  - Intent: Fetch the singleton profile.
  - References: pattern `posts.ts:75-77`; `profile` table, `ProfileRow` · `frontend/sites/portfolio-site/src/lib/queries/profile.ts` [NEW]
  - Depends-on: O1.P1.S1
  - Gates: TDD N/A — single `.get()`; defect surfaces at build/render. BDD N/A. Manual N/A. Deliverable: `getProfile(db): ProfileRow | undefined`. Done-when: type-checks; returns the row in a smoke build.

- **G1.O3.P1.S2 — `src/lib/queries/skills.ts`**
  - Intent: Skills grouped by `category`, ordered by `sort_order`.
  - References: `skills` table (`shared/db-schema/index.ts:44-52`), `SkillRow` · `frontend/sites/portfolio-site/src/lib/queries/skills.ts` [NEW]
  - Depends-on: O1.P1.S1
  - Trade-off: grouping done in TS (`Map<category, SkillRow[]>`) after an ordered `.all()` — simplest; no SQL GROUP BY needed.
  - Gates: TDD N/A (see Red-Team — grouping/order is the one candidate; deferred, no runner). BDD N/A. Manual: categories appear in order on `/`. Deliverable: `getSkillsGrouped(db): {category:string; skills:SkillRow[]}[]`. Done-when: type-checks; render shows ≥2 category groups.

- **G1.O3.P1.S3 — `src/lib/queries/projects.ts`**
  - Intent: All project read paths (shared with O4).
  - References: pattern `posts.ts:35-77` + `getTagsForPost:79-90` (adapt to `content_slug`); `projects` table, `ProjectRow`, `TagRow` · `frontend/sites/portfolio-site/src/lib/queries/projects.ts` [NEW]
  - Depends-on: O1.P1.S1
  - Trade-off: "featured-first" = ORDER BY `pinned` desc, `priority` desc, `title` asc.
  - Gates: TDD N/A (convention). BDD N/A. Manual: ordering verified on `/portfolio`. Deliverable: exports `getFeaturedPreview(db, limit=3)`, `getAllProjects(db)`, `getProjectBySlug(db, slug)`, `getAllProjectSlugs(db)`, `getTagsForProject(db, slug)`. Done-when: type-checks; functions return rows from the populated DB.

- **G1.O3.P1.S4 — `src/lib/queries/posts.ts` (recent only)**
  - Intent: Recent published posts for HOME-07, no quiz gating.
  - References: adapt `blog-site/src/lib/queries/posts.ts:35-48` but drop `inArray(...publishedQuestionPostSlugs)`; `posts` table, `PostRow` · `frontend/sites/portfolio-site/src/lib/queries/posts.ts` [NEW]
  - Depends-on: O1.P1.S1
  - Trade-off: explicitly omits blog's question-gate (documented above).
  - Gates: TDD N/A. BDD N/A. Manual: recent posts list shows newest-first. Deliverable: `getRecentPosts(db, limit=4): PostRow[]`. Done-when: type-checks; returns ≤4 published posts by date desc (empty array tolerated if none).

- **G1.O3.P1.S5 — `ProjectCard.astro`**
  - Intent: Reusable card linking to `/portfolio/[slug]/` with title, excerpt, tags, primary link (HOME-04/08).
  - References: copy/adapt `blog-site/src/components/PostCard.astro:1-53` (href → `/portfolio/${slug}/`; show `repo_url`/`demo_url` when present; `cover` via `shared--ui/cover-image`) · `frontend/sites/portfolio-site/src/components/ProjectCard.astro` [NEW]
  - Depends-on: O1.P1.S8 (TagList), O3.P1.S3 (types)
  - Gates: TDD N/A. BDD N/A. Manual: card shows ≥1 external link and links to the detail route. Deliverable: component. Done-when: renders a project with tags + a working detail link.

- **G1.O3.P1.S6 — `src/pages/index.astro` (replace placeholder)**
  - Intent: Compose all five home sections from the queries; CTA to `/portfolio/`.
  - References: page pattern `blog-site/src/pages/index.astro:1-70`; uses S1–S5 + `BaseLayout` + `HeroBanner`/inline About-Me; null-guards when `getProfile` is undefined · `frontend/sites/portfolio-site/src/pages/index.astro` [NEW] (replaces O1.P1.S10 placeholder)
  - Depends-on: O3.P1.S1,S2,S3,S4,S5; O2.P1.S4 (data)
  - Trade-off: one-use About-Me/Skills sections kept **inline** in the page (no premature component extraction).
  - Gates: TDD N/A. BDD: G1 acceptance (home portion). Manual: keyboard tab order through nav→sections→CTA; AA contrast on tokens; empty-data degrades gracefully. Deliverable: home page. Done-when: `astro check` passes and `dist/index.html` contains `profile.name`, a skill, a project title, and an `href="/portfolio/"` CTA.

---

#### G1.O4 — Portfolio listing + project detail
- Intent: `/portfolio` lists all projects featured-first (PORT-01/03); `/portfolio/[slug]/` renders long-form MDX, tech-stack tags, and links (PORT-02 partial).
- References: list pattern `blog-site/src/pages/post/index.astro`; detail pattern `blog-site/src/pages/post/[slug].astro:18-61`.
- Depends-on: O1, O3.P1.S3 (project queries), O3.P1.S5 (ProjectCard), O2 (data).
- Gates: TDD N/A. BDD: G1 acceptance (portfolio portion). Manual: featured ordering correct; MDX renders; links work; AA. Deliverable: two routes. Done-when: `dist/portfolio/index.html` + `dist/portfolio/<slug>/index.html` emit with DB content.

##### G1.O4.P1 — Listing and detail pages

- **G1.O4.P1.S1 — `src/pages/portfolio/index.astro`**
  - Intent: Grid of all projects, featured-first, with tech-stack tags.
  - References: `getAllProjects` + `getTagsForProject` (O3.P1.S3); `ProjectCard.astro`; grid markup from `blog-site/src/pages/index.astro:52-66` · `frontend/sites/portfolio-site/src/pages/portfolio/index.astro` [NEW]
  - Depends-on: O3.P1.S3, O3.P1.S5
  - Gates: TDD N/A. BDD N/A (covered by G1). Manual: pinned project appears before non-pinned; empty state renders a message. Deliverable: listing page. Done-when: `dist/portfolio/index.html` lists all `projects` rows with the pinned one first.

- **G1.O4.P1.S2 — `src/pages/portfolio/[slug].astro`**
  - Intent: Static per-project detail rendering MDX body + tags + repo/demo links.
  - References: copy/adapt `blog-site/src/pages/post/[slug].astro:18-61` (`getAllProjectSlugs`/`getProjectBySlug`/`getTagsForProject`; `evaluate(project.body, {...runtime, remarkPlugins:[remarkGfm], rehypePlugins:[rehypeHighlight]})` with **no** component map; `HeroBanner`; drop quiz-widget block; add repo/demo link buttons; "← Back to portfolio") · `frontend/sites/portfolio-site/src/pages/portfolio/[slug].astro` [NEW]
  - Depends-on: O3.P1.S3, O1.P1.S8 (HeroBanner)
  - Trade-off: no custom MDX components (prose-only assumption).
  - Gates: TDD N/A. BDD: `Given a published project, When I open /portfolio/<slug>/, Then its MDX body, tech-stack tags, and links render`. Manual: headings/links/code render via gfm+highlight; back-link works; nav "Portfolio" shows active. Deliverable: detail route. Done-when: `dist/portfolio/<slug>/index.html` contains the rendered MDX body and the project's tags.

## Dependency Graph

```
O1.S1 → O1.S2, O1.S3, O1.S4, O1.S5, O1.S6, O1.S7, O1.S8
O1.S4, O1.S6, O1.S7 → O1.S9
O1.S2, O1.S9 → O1.S10

O2.S1, O2.S2, O2.S3 → O2.S4        (independent of O1)

O1.S1 → O3.S1, O3.S2, O3.S3, O3.S4
O1.S8 + O3.S3 → O3.S5
O3.S1, O3.S2, O3.S3, O3.S4, O3.S5 + O2.S4 → O3.S6
(O3.S6 supersedes O1.S10)

O3.S3, O3.S5 → O4.S1
O3.S3, O1.S8 → O4.S2
O2.S4 → O4.S1, O4.S2   (data for build verification)
```
Acyclic. O1 and O2 run in parallel; O3 needs both; O4 needs O3 + O2.

## Red-Team Notes
- **Riskiest assumption:** project MDX is prose-only. If a real project body uses a JSX component (e.g. `<Callout>`), `evaluate()` with no component map throws at build. Mitigation: fixtures (O2.S3) are plain prose; if real content needs components later, port `blog-site/src/lib/mdx-components.ts` — flagged, not silently assumed.
- **Second risk:** `content/` fixture durability — I avoided `content/live` (wiped by `content-sync`) by committing fixtures under `frontend/sites/portfolio-site/test-content/` and overriding `CONTENT_DIR`. If you'd rather not commit test content, switch to `content/live` and accept it's ephemeral.
- **Cargo-cult test avoided:** a unit test asserting `getSkillsGrouped` orders by `sort_order` and groups by category (O3.P1.S2). Real logic, *could* be wrong — but there is no test runner in any Astro site here, so adding vitest for one function is disproportionate; the grouping is verified by the build + a one-line manual render check. Noted as the first thing to add if a runner ever lands.
- **Cargo-cult test avoided:** asserting `openDb()` returns a connection — that only tests `better-sqlite3`/Drizzle (library internals). It's a verbatim copy of a working file; skipped.
- **Pattern theatre avoided:** a shared `portfolio-queries`/Repository package and an `IProjectRepository` interface "for testability" — Drizzle is already the seam and there's no second consumer. Per-site `src/lib/queries/*` mirrors blog.
- **Over-decomposition check:** I kept About-Me and Skills sections **inline** in `index.astro` rather than minting one-use components; `ProjectCard`, `TagList`, and `HeroBanner` are extracted only because ≥2 pages consume them.
- **"Is any step two steps?"** O4.P1.S2 bundles MDX render + links + back-link — they share one file and one review; splitting would force a re-merge (one step). O1.P1.S6 bundles header+island+`components.json` because the header can't render its mobile nav without them.

---

## Machine-readable plan (YAML)

```yaml
- id: G1
  type: goal
  title: Recruiter can view identity, skills, and work on portfolio-site
  intent: Ship / , /portfolio, /portfolio/[slug]/ on a new Astro SSG site, pipeline-driven, matching blog-site conventions.
  references:
    - frontend/sites/blog-site/*
    - shared/db-schema/index.ts:29-120
  depends_on: []
  gates:
    tdd: "N/A: no site test runner by convention; verified by astro check + astro build"
    bdd: "Given content.db has profile/skills/>=3 projects, building shows home sections, portfolio listing (featured-first), and project detail with MDX/tags/links"
    manual: "Stakeholder UAT on prod-like build + WCAG 2.1 AA spot-check"
    deliverable: "portfolio-site build emits dist/index.html, dist/portfolio/index.html, dist/portfolio/<slug>/index.html with DB values"
  done_when: "pnpm --filter @prj--personal-portfolio--v3/frontend--portfolio-site build emits the three routes with DB-sourced content"

  children:
    - id: G1.O1
      type: objective
      title: Scaffold portfolio-site Astro app
      intent: Greenfield Astro app building a themed shell with working nav/chrome.
      references: [frontend/sites/blog-site/*]
      depends_on: []
      children:
        - id: G1.O1.P1
          type: phase
          title: Buildable themed shell
          depends_on: []
          children:
            - id: G1.O1.P1.S1
              type: step
              title: Create package.json
              references: ["frontend/sites/blog-site/package.json:1-39", "frontend/sites/portfolio-site/package.json [NEW]"]
              depends_on: []
              gates: {tdd: "N/A: manifest", bdd: "N/A", manual: "N/A", deliverable: "package.json named @prj--personal-portfolio--v3/frontend--portfolio-site"}
              done_when: "pnpm install resolves the package"
            - id: G1.O1.P1.S2
              type: step
              title: Create astro.config.mjs
              references: ["frontend/sites/blog-site/astro.config.mjs:9-33", "frontend/sites/portfolio-site/astro.config.mjs [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: "config site=https://paulserban.eu, react include portfolio-site glob, mdx() no components"}
              done_when: "astro check loads config without error"
            - id: G1.O1.P1.S3
              type: step
              title: Create tsconfig.json, env.d.ts, .gitignore
              references: ["frontend/sites/blog-site/tsconfig.json:1-11", "frontend/sites/blog-site/src/env.d.ts:1-2", "frontend/sites/portfolio-site/{tsconfig.json,src/env.d.ts,.gitignore} [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: "three config files"}
              done_when: "files exist; tsc --noEmit runnable"
            - id: G1.O1.P1.S4
              type: step
              title: Create global.css + placeholder-cover.png
              references: ["frontend/sites/blog-site/src/styles/global.css:1-21", "frontend/sites/portfolio-site/src/styles/global.css [NEW]", "frontend/sites/portfolio-site/public/placeholder-cover.png [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A", bdd: "N/A", manual: "theme tokens apply after build", deliverable: "css importing shared--ui/styles.css (no quiz-widget block) + cover asset"}
              done_when: "files exist; @source globs resolve"
            - id: G1.O1.P1.S5
              type: step
              title: Create src/lib/db.ts
              references: ["frontend/sites/blog-site/src/lib/db.ts:1-17", "frontend/sites/portfolio-site/src/lib/db.ts [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A: verbatim copy of verified file", bdd: "N/A", manual: "N/A", deliverable: "db.ts exporting openDb/closeConnection/DrizzleDb"}
              done_when: "imports type-check; openDb() opens a connection in smoke build"
            - id: G1.O1.P1.S6
              type: step
              title: Create SiteHeader.astro + MobileNav.tsx + components.json
              references: ["frontend/sites/blog-site/src/components/SiteHeader.astro:1-89", "frontend/sites/blog-site/src/components/MobileNav.tsx:1-46", "frontend/sites/blog-site/components.json:1-22", "frontend/sites/portfolio-site/src/components/{SiteHeader.astro,MobileNav.tsx} [NEW]", "frontend/sites/portfolio-site/components.json [NEW]"]
              depends_on: [G1.O1.P1.S1]
              tradeoff: "External Blog/Quiz links get no active state; QUIZ_APP_URL is a flagged constant"
              gates: {tdd: "N/A", bdd: "N/A", manual: "Home shows aria-current on /; mobile Sheet opens/closes", deliverable: "header + island + shadcn aliases with 4 nav links"}
              done_when: "header renders 4 links; dark-mode toggle persists across reload"
            - id: G1.O1.P1.S7
              type: step
              title: Create SiteFooter.astro
              references: ["frontend/sites/blog-site/src/components/SiteFooter.astro:1-29", "frontend/sites/portfolio-site/src/components/SiteFooter.astro [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: "footer with Home/Portfolio/Blog/Quiz links"}
              done_when: "renders within BaseLayout"
            - id: G1.O1.P1.S8
              type: step
              title: Create TagList.astro + HeroBanner.astro
              references: ["frontend/sites/blog-site/src/components/TagList.astro:1-27", "frontend/sites/blog-site/src/components/HeroBanner.astro:1-35", "frontend/sites/portfolio-site/src/components/{TagList.astro,HeroBanner.astro} [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: "two shared display components"}
              done_when: "type-check passes; render in a consuming page"
            - id: G1.O1.P1.S9
              type: step
              title: Create BaseLayout.astro
              references: ["frontend/sites/blog-site/src/layouts/BaseLayout.astro:1-59", "frontend/sites/portfolio-site/src/layouts/BaseLayout.astro [NEW]"]
              depends_on: [G1.O1.P1.S4, G1.O1.P1.S6, G1.O1.P1.S7]
              gates: {tdd: "N/A", bdd: "N/A", manual: "html gets .dark per stored/preferred theme", deliverable: "layout shell with SEO/OG head + header/main/footer"}
              done_when: "imports resolve; used by S10"
            - id: G1.O1.P1.S10
              type: step
              title: Placeholder index.astro + first green build
              references: ["frontend/sites/portfolio-site/src/pages/index.astro [NEW]"]
              depends_on: [G1.O1.P1.S2, G1.O1.P1.S9]
              gates: {tdd: "N/A", bdd: "N/A", manual: "dev server shows themed shell + nav", deliverable: "placeholder home page"}
              done_when: "build exits 0 and emits dist/index.html"

    - id: G1.O2
      type: objective
      title: Local content fixtures + ingest into content.db
      intent: Populate profile/skills/projects (+tags) for reproducible data-backed builds.
      references: ["tools/json-ingest", "tools/mdx-ingest", "shared/db-schema/index.ts"]
      depends_on: []
      children:
        - id: G1.O2.P1
          type: phase
          title: Author fixtures and ingest
          depends_on: []
          children:
            - id: G1.O2.P1.S1
              type: step
              title: Author profile fixture
              references: ["tools/json-ingest/src/helpers/normalise.ts:23-37", "frontend/sites/portfolio-site/test-content/publish/profile/profile.json [NEW]"]
              depends_on: []
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: "profile.json with name/headline/bio (+photo_url/github_url/linkedin_url)"}
              done_when: "valid JSON with 3 required keys"
            - id: G1.O2.P1.S2
              type: step
              title: Author skills fixture
              references: ["tools/json-ingest/src/helpers/normalise.ts:40-51", "frontend/sites/portfolio-site/test-content/publish/skills/skills.json [NEW]"]
              depends_on: []
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: "skills.json with >=6 items across >=2 categories"}
              done_when: "valid JSON; each item has name+category"
            - id: G1.O2.P1.S3
              type: step
              title: Author >=3 project MDX fixtures
              references: ["tools/mdx-ingest/src/helpers/normalise.ts:108-126", "frontend/sites/portfolio-site/test-content/publish/projects/<slug>.mdx [NEW]"]
              depends_on: []
              gates: {tdd: "N/A", bdd: "N/A", manual: "N/A", deliverable: ">=3 published project MDX, >=1 pinned, each with tags + prose body"}
              done_when: "files parse (valid frontmatter + MDX)"
            - id: G1.O2.P1.S4
              type: step
              title: Run ingest and verify rows
              references: ["CONTENT_DIR=<abs>/frontend/sites/portfolio-site/test-content/publish pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start", "...tools--mdx-ingest start"]
              depends_on: [G1.O2.P1.S1, G1.O2.P1.S2, G1.O2.P1.S3]
              gates: {tdd: "N/A", bdd: "N/A", manual: "pnpm db:studio shows rows", deliverable: "populated database/output/content.db"}
              done_when: "profile=1, skills>=6, projects>=3, content_tags has content_type='project' rows"

    - id: G1.O3
      type: objective
      title: Home page (/)
      intent: DB-driven About-Me, Skills, Projects preview, Recent Posts, CTA.
      references: ["frontend/sites/blog-site/src/lib/queries/posts.ts", "frontend/sites/blog-site/src/components/PostCard.astro"]
      depends_on: [G1.O1, G1.O2]
      children:
        - id: G1.O3.P1
          type: phase
          title: Query helpers, project card, and the page
          depends_on: [G1.O1.P1, G1.O2.P1]
          children:
            - id: G1.O3.P1.S1
              type: step
              title: queries/profile.ts
              references: ["frontend/sites/blog-site/src/lib/queries/posts.ts:75-77", "frontend/sites/portfolio-site/src/lib/queries/profile.ts [NEW]"]
              depends_on: [G1.O1.P1.S1]
              gates: {tdd: "N/A: single .get()", bdd: "N/A", manual: "N/A", deliverable: "getProfile(db): ProfileRow | undefined"}
              done_when: "type-checks; returns the row in smoke build"
            - id: G1.O3.P1.S2
              type: step
              title: queries/skills.ts
              references: ["shared/db-schema/index.ts:44-52", "frontend/sites/portfolio-site/src/lib/queries/skills.ts [NEW]"]
              depends_on: [G1.O1.P1.S1]
              tradeoff: "Group in TS after ordered .all(); no SQL GROUP BY"
              gates: {tdd: "N/A: no runner (see red-team)", bdd: "N/A", manual: "categories appear ordered on /", deliverable: "getSkillsGrouped(db): {category, skills[]}[]"}
              done_when: "type-checks; render shows >=2 groups"
            - id: G1.O3.P1.S3
              type: step
              title: queries/projects.ts
              references: ["frontend/sites/blog-site/src/lib/queries/posts.ts:35-90", "shared/db-schema/index.ts:75-90", "frontend/sites/portfolio-site/src/lib/queries/projects.ts [NEW]"]
              depends_on: [G1.O1.P1.S1]
              tradeoff: "featured-first = ORDER BY pinned desc, priority desc, title asc"
              gates: {tdd: "N/A: convention", bdd: "N/A", manual: "ordering verified on /portfolio", deliverable: "getFeaturedPreview/getAllProjects/getProjectBySlug/getAllProjectSlugs/getTagsForProject"}
              done_when: "type-checks; returns rows from populated DB"
            - id: G1.O3.P1.S4
              type: step
              title: queries/posts.ts (recent only)
              references: ["frontend/sites/blog-site/src/lib/queries/posts.ts:35-48", "frontend/sites/portfolio-site/src/lib/queries/posts.ts [NEW]"]
              depends_on: [G1.O1.P1.S1]
              tradeoff: "Omits blog quiz-question gate"
              gates: {tdd: "N/A", bdd: "N/A", manual: "recent posts newest-first", deliverable: "getRecentPosts(db, limit=4): PostRow[]"}
              done_when: "type-checks; returns <=4 published posts by date desc (empty ok)"
            - id: G1.O3.P1.S5
              type: step
              title: ProjectCard.astro
              references: ["frontend/sites/blog-site/src/components/PostCard.astro:1-53", "frontend/sites/portfolio-site/src/components/ProjectCard.astro [NEW]"]
              depends_on: [G1.O1.P1.S8, G1.O3.P1.S3]
              gates: {tdd: "N/A", bdd: "N/A", manual: "card shows >=1 link and links to /portfolio/<slug>/", deliverable: "ProjectCard component"}
              done_when: "renders a project with tags + working detail link"
            - id: G1.O3.P1.S6
              type: step
              title: src/pages/index.astro (replace placeholder)
              references: ["frontend/sites/blog-site/src/pages/index.astro:1-70", "frontend/sites/portfolio-site/src/pages/index.astro [NEW]"]
              depends_on: [G1.O3.P1.S1, G1.O3.P1.S2, G1.O3.P1.S3, G1.O3.P1.S4, G1.O3.P1.S5, G1.O2.P1.S4]
              tradeoff: "About-Me/Skills sections inline (no one-use component extraction)"
              gates: {tdd: "N/A", bdd: "Home portion of G1 acceptance", manual: "tab order nav->sections->CTA; AA contrast; empty-data degrades", deliverable: "home page"}
              done_when: "astro check passes; dist/index.html contains profile.name, a skill, a project title, href=/portfolio/ CTA"

    - id: G1.O4
      type: objective
      title: Portfolio listing + project detail
      intent: /portfolio lists all projects featured-first; /portfolio/[slug]/ renders MDX + tags + links.
      references: ["frontend/sites/blog-site/src/pages/post/index.astro", "frontend/sites/blog-site/src/pages/post/[slug].astro:18-61"]
      depends_on: [G1.O1, G1.O3, G1.O2]
      children:
        - id: G1.O4.P1
          type: phase
          title: Listing and detail pages
          depends_on: [G1.O3.P1]
          children:
            - id: G1.O4.P1.S1
              type: step
              title: src/pages/portfolio/index.astro
              references: ["frontend/sites/blog-site/src/pages/index.astro:52-66", "frontend/sites/portfolio-site/src/pages/portfolio/index.astro [NEW]"]
              depends_on: [G1.O3.P1.S3, G1.O3.P1.S5]
              gates: {tdd: "N/A", bdd: "N/A (covered by G1)", manual: "pinned project precedes non-pinned; empty state message", deliverable: "portfolio listing page"}
              done_when: "dist/portfolio/index.html lists all projects, pinned first"
            - id: G1.O4.P1.S2
              type: step
              title: src/pages/portfolio/[slug].astro
              references: ["frontend/sites/blog-site/src/pages/post/[slug].astro:18-61", "frontend/sites/portfolio-site/src/pages/portfolio/[slug].astro [NEW]"]
              depends_on: [G1.O3.P1.S3, G1.O1.P1.S8]
              tradeoff: "No custom MDX components (prose-only assumption)"
              gates: {tdd: "N/A", bdd: "Given a published project, opening /portfolio/<slug>/ renders MDX body + tags + links", manual: "gfm/highlight render; back-link works; Portfolio nav active", deliverable: "project detail route"}
              done_when: "dist/portfolio/<slug>/index.html contains rendered MDX body + the project's tags"
```

**Plan Quality Bar:** all steps reference real files or `[NEW]` paths; every unit rolls up to G1; DAG is acyclic/complete; every gate is specified or N/A-with-reason; each pattern/tech is force-justified or recorded as YAGNI; red-team names the avoided tests/abstractions; each step has a binary done-when and no remaining design choice.

Two quick confirmations when you're ready to execute (both non-blocking): the **Quiz App URL**, and whether you want the `test-content` fixtures **committed**.