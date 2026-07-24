---
name: Cheat sheets and learning plans
overview: 'Add cheat sheets and learning plans as first-class, DB-backed companion content for posts/book-notes/snippets: ingest them from MDX, expose them at /post|booknote|snippet/[slug]/cheat_sheet/[itemSlug] and .../learning_plans/[itemSlug], link them from the bottom of the parent content page, and surface matching buttons on the quiz app''s set detail page next to the existing "Read post on blog" button.'
todos:
    - id: schema
      content: Add cheat_sheets and learning_plans tables + types to shared/db-schema, generate + apply migration
      status: completed
    - id: scanner
      content: Update markdownFileScanner.ts to exclude intermediary/cheat_sheet/learning_plan from ordinary walk and emit companion file lists
      status: completed
    - id: parser-normalise
      content: Extend markdownParser, validateParsedFiles, normalise.ts for cheat_sheet/learning_plan content types
      status: completed
    - id: upsert
      content: Extend upsertRecords.ts to upsert cheat_sheets/learning_plans with parent-post FK check
      status: completed
    - id: blog-queries
      content: Add companions.ts queries + urls.ts path helpers in blog-site
      status: completed
    - id: blog-routes
      content: Add CompanionTemplate.astro and 6 nested route pages for post/booknote/snippet x cheat_sheet/learning_plans
      status: completed
    - id: post-template-links
      content: Add Resources section linking cheat sheets/learning plans at bottom of PostTemplate.astro
      status: completed
    - id: quiz-contract
      content: Extend ExportedPostEntry + export.ts with cheatSheets/learningPlans arrays
      status: completed
    - id: quiz-buttons
      content: Add blog cheat sheet/learning plan URL helpers and buttons on quiz set detail page
      status: completed
    - id: pipeline-rerun
      content: Regenerate migrations, re-run mdx-ingest and quiz-export
      status: completed
isProject: false
---

## Context

Example content folder (`content/live/content/publish/posts/2024/06/<slug>/`):

```
<slug>.mdx              # the post itself
cheat_sheet.mdx         # single cheat sheet today (title + status only, no date)
learning_plan/
  20hours_paretto_plan.mdx
questions/*.mdx         # already ingested
intermediary/*.md       # AI authoring scratch files — not content, currently swept up accidentally
```

Today, `tools/mdx-ingest`'s scanner (`markdownFileScanner.ts`) only special-cases a `questions/` subfolder; everything else (`cheat_sheet.mdx`, `learning_plan/*.mdx`, `intermediary/*.md`) is walked as an ordinary sibling post and silently upserted (or skipped with a warning if frontmatter is incomplete). There is no schema, no FK, and no routes for cheat sheets/learning plans.

Per your answers: this applies to **all three post-bearing types** (`post`, `book-note`, `snippet`, i.e. any row in the `posts` table), and **cheat sheets are multi-per-post** just like learning plans, so both get an item-slug segment in their route: `/post/[slug]/cheat_sheet/[itemSlug]/` and `/post/[slug]/learning_plans/[itemSlug]/` (same nested-slug shape for both, matching your requested paths). To stay backward-compatible with the existing flat `cheat_sheet.mdx` file, the scanner will accept **either** a flat `cheat_sheet.mdx` file **or** a `cheat_sheet/*.mdx` folder (same as `learning_plan/` already does) — both feed the same table.

## 1. Schema — [shared/db-schema/index.ts](shared/db-schema/index.ts)

Add two tables, modeled directly on the existing `questions` FK pattern (`post_slug -> posts.slug`):

```ts
export const cheat_sheets = sqliteTable('cheat_sheets', {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(), // `{post_slug}--{file_basename}`
    post_slug: text('post_slug')
        .notNull()
        .references(() => posts.slug),
    title: text('title').notNull(),
    body: text('body').notNull(),
    status: text('status').notNull(),
    sort_order: integer('sort_order').default(0),
    sync_source: text('sync_source').default('mdx'),
    locked: integer('locked', { mode: 'boolean' }).default(false),
    updated_at: integer('updated_at', { mode: 'timestamp' }),
});

export const learning_plans = sqliteTable('learning_plans', {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(), // `{post_slug}--{file_basename}`
    post_slug: text('post_slug')
        .notNull()
        .references(() => posts.slug),
    title: text('title').notNull(),
    body: text('body').notNull(),
    status: text('status').notNull(),
    sort_order: integer('sort_order').default(0),
    sync_source: text('sync_source').default('mdx'),
    locked: integer('locked', { mode: 'boolean' }).default(false),
    updated_at: integer('updated_at', { mode: 'timestamp' }),
});
```

Plus inferred `*Row` / `New*Row` types, exported like the rest of the file. Run `pnpm db:generate` then `pnpm db:migrate` to create/apply the migration under `database/migrations/`.

## 2. `tools/mdx-ingest` changes

**[markdownFileScanner.ts](tools/mdx-ingest/src/helpers/markdownFileScanner.ts)**

- Exclude `intermediary` (new) alongside `questions` when recursing for ordinary post/booknote/snippet files (`collectContentMarkdownFiles`).
- Also exclude the literal filename `cheat_sheet.mdx`/`cheat_sheet.md` and the directory names `cheat_sheet` and `learning_plan` from that same walk, so they're never double-counted as ordinary posts.
- Add `collectCompanionFiles(typeDir, companionDirName)` (parallel to `collectNestedQuestionFiles`): walks each post directory for
    - a flat `<postDir>/cheat_sheet.mdx|.md` file, and/or
    - a `<postDir>/cheat_sheet/*.mdx|.md` folder,
      emitting relative paths the same way nested questions are emitted today. Do the same for `learning_plan/*.mdx|.md`.
- Emit two more synthetic `ScannedDirectory` entries: `typeName: 'cheat_sheets'` and `typeName: 'learning_plans'` (same shape as the existing synthetic `'questions'` entry), populated whenever any posts/booknotes/snippets type dir is scanned.

**[markdownParser.ts](tools/mdx-ingest/src/helpers/markdownParser.ts)**

- Extend `ContentType` with `'cheat_sheet' | 'learning_plan'`; extend `CONTENT_TYPE_MAP` (`cheat_sheets -> cheat_sheet`, `learning_plans -> learning_plan`).
- Add `deriveCompanionParentSlug(relativeFile)`: takes the basename of the file's parent directory; if that directory is literally named `cheat_sheet` or `learning_plan` (folder form), go one level further up. This covers both the flat-file and folder forms.
- Set `parentPostSlug` for these two types using that helper (reusing the existing `ParsedFile.parentPostSlug` field).

**[validateParsedFiles.ts](tools/mdx-ingest/src/helpers/validateParsedFiles.ts)**

- Add `REQUIRED_FIELDS.cheat_sheet = ['title', 'status']` and `.learning_plan = ['title', 'status']` (no `date`, matching the real frontmatter).

**[normalise.ts](tools/mdx-ingest/src/helpers/normalise.ts)**

- Add `NormalisedRows.cheatSheets: NewCheatSheetRow[]` / `.learningPlans: NewLearningPlanRow[]`.
- Add `normaliseCheatSheet`/`normaliseLearningPlan`: `slug = ${file.parentPostSlug}--${file.slug}`, `post_slug = file.parentPostSlug`, `title`, `body: file.body`, `status`, `sort_order` from optional frontmatter, `sync_source: 'mdx'`. Skip (warn) if `parentPostSlug` is missing.
- Wire the two new cases into the main `switch`.

**[upsertRecords.ts](tools/mdx-ingest/src/helpers/upsertRecords.ts)**

- Import the two new tables; after questions, upsert cheat sheets/learning plans the same way questions are upserted: require the parent post to already exist (reuse/generalize `loadExistingPostSlugs`), skip with a warning otherwise, and fold counts into `UpsertSummary` (`cheatSheetsSkipped`, `learningPlansSkipped`, etc.).

## 3. Blog site routes — `frontend/sites/blog-site/`

**Queries** — new `src/lib/queries/companions.ts`:

- `getCheatSheetsForPost(db, postSlug)`, `getCheatSheetBySlugs(db, postSlug, itemSlug)`, `getCheatSheetStaticPaths(db, type)`
- `getLearningPlansForPost(db, postSlug)`, `getLearningPlanBySlugs(db, postSlug, itemSlug)`, `getLearningPlanStaticPaths(db, type)`
- All gated on `status === 'published'` (own row + parent post, mirroring `getPostBySlugAndType`/`isPublishedOnOrBefore`).

**[urls.ts](frontend/sites/blog-site/src/lib/urls.ts)**

- Add `cheatSheetDetailPath(type, postSlug, itemSlug)` and `learningPlanDetailPath(type, postSlug, itemSlug)`, reusing `DETAIL_SEGMENT`.

**New shared template** — `src/core/system/templates/CompanionTemplate.astro` (parallel to `PostTemplate.astro`): given `slug`, `contentType`, `companionKind: 'cheat_sheet' | 'learning_plan'`, `itemSlug`, it loads the row, MDX-evaluates `body` (same `evaluate`/`mdxComponents` as `PostTemplate.astro`), renders a "← Back to `<post title>`" link (`postDetailPath`), and — for learning plans — a small list of sibling learning plans on the same post.

**New pages** (6 files, one per `{post, booknote, snippet} × {cheat_sheet, learning_plans}`), each following the existing `getStaticPaths()` + thin-wrapper pattern of `pages/post/[slug].astro`:

- `pages/post/[slug]/cheat_sheet/[itemSlug].astro`
- `pages/post/[slug]/learning_plans/[itemSlug].astro`
- `pages/booknote/[slug]/cheat_sheet/[itemSlug].astro`
- `pages/booknote/[slug]/learning_plans/[itemSlug].astro`
- `pages/snippet/[slug]/cheat_sheet/[itemSlug].astro`
- `pages/snippet/[slug]/learning_plans/[itemSlug].astro`

**[PostTemplate.astro](frontend/sites/blog-site/src/core/system/templates/PostTemplate.astro)**

- Load `cheatSheets`/`learningPlans` for the slug alongside `tags`/`questionCount`.
- After the quiz-widget slot, render a "Resources" section (styled like the existing `TagList`/border-rule conventions) with one link per cheat sheet (`cheatSheetDetailPath`) and one per learning plan (`learningPlanDetailPath`), only when there are any.

## 4. Quiz export contract — `tools/quiz-export/`

**[contract.ts](tools/quiz-export/src/contract.ts)** — extend `ExportedPostEntry`:

```ts
cheatSheets: {
    slug: string;
    title: string;
}
[];
learningPlans: {
    slug: string;
    title: string;
}
[];
```

(`slug` here = the item-slug only, i.e. with the `{post_slug}--` prefix stripped, ready to build a blog URL.)

**[export.ts](tools/quiz-export/src/export.ts)** — query `cheat_sheets`/`learning_plans` filtered to `status = 'published'`, join by `post_slug`, strip the prefix, and populate the new fields per post entry. `write.ts`/`cli.ts` need no changes (they serialize `ExportedPostEntry` generically).

## 5. Quiz web app buttons — `frontend/apps/quiz-web-app/`

**[lib/urls.ts](frontend/apps/quiz-web-app/src/lib/urls.ts)** — add `blogCheatSheetUrl(postType, postSlug, itemSlug)` and `blogLearningPlanUrl(postType, postSlug, itemSlug)`, mirroring `blogPostUrl`.

**[routes/sets.$postSlug.index.tsx](frontend/apps/quiz-web-app/src/routes/sets.$postSlug.index.tsx)** — right after the existing "Read post on blog ↗" link (~line 187-199), render one additional ghost-stamp `<a>` per `meta.cheatSheets` entry and per `meta.learningPlans` entry, same `stampClasses("ghost", "md")` styling, opening in a new tab, e.g. "Cheat Sheet ↗" / "Learning Plan: `<title>` ↗".

## 6. Re-run pipeline

After code changes: `pnpm db:generate && pnpm db:migrate`, re-run `tools/mdx-ingest` against synced content, then re-run `shared/quiz-export`'s CLI (`tools/quiz-export`) to regenerate `posts.json` with the new fields for the quiz app.

## Open implementation details (no user decision needed, will follow existing conventions)

- Companion `sort_order` defaults to 0 / array order when frontmatter omits it (same as `projects`/`coursework`).
- `intermediary/` exclusion in the scanner is a small correctness fix riding along with this change (those files are prompt scratch notes, not content, and currently get scanned + skipped-with-warning every ingest run).
