---
name: Blog preview images (cover) — cards + post hero, sketch placeholder fallback
overview: >
  Add an optional `cover` image to blog content. It flows MDX frontmatter → new posts.cover_image
  column (migration) → ingest mapping → a single tested URL resolver → render sites: all three card
  types (post/snippet/book-note, both the Astro hub card and the React listing-island card) and the
  post/snippet/booknote detail hero. When a post has no cover, a locally-served sketch-style
  (excalidraw) placeholder PNG is shown on cards and the hero. Everything is additive/nullable and
  reversible; the only new logic (URL resolution + placeholder fallback) is unit-tested in shared/ui.
todos:
  - id: o1-pipeline
    content: G1.O1 — schema cover_image column + migration + ingest mapping (S1–S3)
    status: pending
  - id: o2-resolver
    content: G1.O2 — shared tested coverImageUrl resolver + export path (S1–S2)
    status: pending
  - id: o3-placeholder
    content: G1.O3 — generate + commit sketch-style placeholder PNG to blog public/ (S1)
    status: pending
  - id: o4-render
    content: G1.O4 — render covers on cards (P1) + post hero (P2)
    status: pending
isProject: false
---

# Plan: blog post cards/teasers + post pages show preview (cover) images with a sketch placeholder

CHANGE_REQUEST: cards/teasers get preview images; placeholder when none; all imagery is
sketch-style (excalidraw); post pages showcase the preview image in the hero. WORK_TYPES: auto →
**expand** (new capability across pipeline + UI); no refactor/improve needed. MODE: ask — resolved
via 5 answered questions.

## Context Ledger

**Known (verified)**
- `posts` table has **no** image column (`shared/db-schema/index.ts:55–71`). `PostRow = $inferSelect`
  (`:185`) → adding a column auto-flows to every `db.select().from(posts)` consumer.
- Ingest maps frontmatter→row in `tools/mdx-ingest/src/helpers/normalise.ts:86–105` (`normalisePost`);
  `str()` helper at `:29`. Validation (required fields only) `validateParsedFiles.ts:16–23` — a new
  **optional** field needs no validation change.
- No `cover`/`image` frontmatter exists in any current content (verified across `content/live/.../posts`,
  `booknotes`, `snippets`). So initial state after this feature = every post null cover → placeholder everywhere.
- Existing images are **external**, hardcoded `https://paulserban.eu/assets/diagrams/{name}.svg`
  (`components/mdx/ImageResponsive.tsx:10`, `ImageSvg.tsx:9`). No abstraction; no local `public/` images
  (blog `public/` is absent/empty).
- Card render sites: `components/PostCard.astro:33–42` (Astro, hub `index.astro`), `components/PostCardReact.tsx`
  (React, used by `PostListIsland.tsx` on the 3 listing pages). Both currently text-only.
- Listing pages map `PostRow`→`BlogPostFilterItem` for the island: `pages/post/index.astro`,
  `pages/snippet/index.astro`, `pages/booknote/index.astro` (the `posts.map(...)` block). The type is
  `BlogPostFilterItem` in `shared/ui/src/lib/postFilters.ts`.
- Hero: `components/HeroBanner.astro:1–21` (props `title, subheading, tags, kicker`). Detail pages pass it:
  `pages/post/[slug].astro:53`, `pages/snippet/[slug].astro`, `pages/booknote/[slug].astro`.
- Migration workflow (`database/AGENTS.md`): edit schema → `pnpm db:generate` (writes
  `database/migrations/NNNN_*.sql` + `meta/`) → `pnpm db:migrate`. Last migration `0004_*`; SQLite
  `ALTER TABLE … ADD` is the established additive pattern (`0004_bitter_starhawk.sql:11–17`).
- shared/ui has vitest + per-feature export paths precedent (`./post-filters`, `./pagination`).

**Assumed (single, flagged)**
- `cover` frontmatter holds a path appended to a base, i.e. `coverImageUrl(cover)` =
  cover is absolute (`/^https?:\/\//`) ? cover : `${ASSET_BASE_URL}/${cover}`, with
  `ASSET_BASE_URL = 'https://paulserban.eu/assets'`. Author writes e.g.
  `cover: covers/my-post.png` → `https://paulserban.eu/assets/covers/my-post.png`. The base lives in ONE
  constant; if the exact host/path template differs, the executor edits that single constant. (Derived
  from the answer "resolved to https://paulserban.eu/assets/{path}.{image_name}.{format}".)

**Unverified** — none blocking.

## Current-State Audit (target area)
- **Safety-net:**
  - Schema/migration/ingest: additive, nullable column → safe by construction (nothing reads it until O4).
    Ingest mapping is a one-line `str(fm['cover'])`; `dry-run` is the check.
  - `coverImageUrl` resolver → **unit-tested** in shared/ui (the net for the only branching logic).
  - Blog render sites → **unprotected** (no Astro/React island test infra) → gate = `astro build` +
    `astro check` + manual, consistent with prior blog plans. New logic is delegated to the tested resolver,
    so the untested surface is pure JSX wiring.
- **Blast radius:** new column read by `PostCard.astro`, `PostCardReact.tsx`, `HeroBanner.astro`, the 3
  detail pages, and the 3 listing `.astro` mappers. `PostRow` type gains an optional field → typecheck flags
  any consumer that destructures exhaustively (none do). Quiz app does not read `posts.cover_image` (its data
  comes from `shared/quiz-export`; out of scope, unaffected).
- **Baseline:** N/A — expand (new capability), not a metric-improve.

## Open Questions — all resolved
- [resolved] Source = new `cover` frontmatter field → resolved against `https://paulserban.eu/assets/` base.
- [resolved] Add a `cover_image` DB column + migration + ingest mapping (yes).
- [resolved] Placeholder = one generated sketch-style excalidraw **PNG**, committed to blog `public/`, served locally.
- [resolved] Scope = all three card types (post, snippet, book-note).
- [resolved] Detail placement = integrated into the existing `HeroBanner`.

## Trade-off Decisions

| Decision | Options (incl. leave-as-is) | Cost | Benefit | Chosen | Named force |
|---|---|---|---|---|---|
| Cover storage | derive-by-convention (no column); **DB column (chosen)** | migration + ingest line | queryable, SSG-friendly, explicit null→placeholder | `cover_image` column | user: yes_column; convention can't detect "missing" at build for clean fallback |
| URL resolution | inline in each render site; **one shared tested fn (chosen)** | tiny fn + test + export | 5+ consumers, absolute-vs-relative + null→placeholder branching | `coverImageUrl` in shared/ui | multiple consumers × real fallback defect class |
| Asset base | hardcode per site (as ImageResponsive does); **single constant (chosen)** | one constant | one edit point if host/template changes | `ASSET_BASE_URL` const | the source template is the one ambiguous input |
| Placeholder hosting | external CDN; CSS-only box; **local public/ PNG (chosen)** | commit a binary asset | works offline/SSG, no extra upload, deterministic | `public/placeholder-cover.png` | user choice; placeholder is app-chrome not content |
| Scope | posts only; **all 3 types (chosen)** | snippets/booknotes also render images | uniform grid; cards are already shared | all three | user choice; PostCard/PostCardReact are shared components |
| Detail placement | full-width banner; skip-if-none; **in hero (chosen)** | hero gains an optional image block | cohesive masthead; one component to change | integrate into `HeroBanner` | user choice |
| Card image ratio | natural; **fixed `aspect-video` + object-cover (chosen)** | crops tall art | uniform card heights; no layout shift | `aspect-video object-cover` | layout stability across mixed art |

### Explicitly NOT doing / leaving as-is
- Not refactoring `ImageResponsive`/`ImageSvg`/`Figure` to use the new resolver — different concern (in-body
  diagrams vs. cover), they work, no change-force. Leave as-is.
- Not adding `cover` to the **quiz** export/contract — quiz cards are out of scope; no request, no consumer.
- Not validating/Requiring `cover` in ingest — it's optional by design (null → placeholder).
- Not building responsive `srcset`/image optimization — covers are pre-rendered excalidraw assets on an
  external host; Astro can't optimize remote URLs here. YAGNI until a perf baseline says otherwise.
- Not adding image columns to `projects`/`coursework` — not in scope.

## Delivery Plan

### G1 — Blog cards and post detail show a cover image (or a sketch placeholder), sourced from MDX frontmatter through the DB
- Gates: TDD (resolver unit tests); BDD N/A; Manual (cards + hero show cover when set, placeholder when not,
  light+dark, 3 breakpoints); Deliverable: `pnpm db:generate` clean, `pnpm typecheck` + blog `astro build`/`astro check` exit 0, shared/ui tests green.

#### G1.O1 — Add `cover_image` to schema + migration + ingest  [expand]
- Intent: persist an optional cover path on `posts`; additive, nullable, no existing-data risk.

##### G1.O1.P1 — Pipeline column · Depends-on: none · Rollback: revert PR (+ column is nullable, ignored if unread)

- **G1.O1.P1.S1 — Add `cover_image` to the posts schema** [expand]
  - Intent: declare the nullable column on the Drizzle table.
  - References: `shared/db-schema/index.ts:62` (modify — add after `excerpt`)
  - Add: `cover_image: text('cover_image'),`
  - Depends-on: none. Technique: parallel-change (additive). Reversible by: revert PR.
  - Gates: TDD N/A (declaration); Manual N/A; Deliverable: `pnpm -F shared--db-schema typecheck` exits 0. Done-when: green.

- **G1.O1.P1.S2 — Generate + commit the migration** [expand]
  - Intent: produce the `ALTER TABLE posts ADD cover_image` SQL + drizzle meta snapshot.
  - References: `database/migrations/0005_*.sql` [NEW, generated], `database/migrations/meta/*` (generated)
  - Command: `pnpm db:generate` (from repo root), then `pnpm db:migrate` to apply to `content.db`.
  - Depends-on: S1. Technique: none. Reversible by: revert PR (drop migration file + meta entry; never edit meta by hand — regenerate).
  - Gates: TDD N/A; Manual: open generated SQL, confirm it is a single additive `ALTER TABLE \`posts\` ADD \`cover_image\` text;` and touches nothing else. Deliverable: committed migration + meta. Done-when: `pnpm db:migrate` applies clean; `content.db` has the column.

- **G1.O1.P1.S3 — Map `cover` frontmatter in ingest** [expand]
  - Intent: copy frontmatter `cover` → `cover_image` row field.
  - References: `tools/mdx-ingest/src/helpers/normalise.ts:95` (modify `normalisePost` — add after `excerpt`)
  - Add: `cover_image: str(fm['cover']),`
  - Depends-on: S1 (type), S2 (column exists). Technique: none. Reversible by: revert PR.
  - Gates: TDD N/A (one-line passthrough; no logic worth a test — coverage theatre avoided); Manual:
    `pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start:dry-run` runs without error and logs posts.
    Deliverable: ingest writes `cover_image` when `cover` present (null otherwise). Done-when: dry-run clean; a
    manual `start` + a spot-check row shows null today (no content has `cover` yet).

#### G1.O2 — Shared, tested cover URL resolver  [expand]
- Intent: one pure function both Astro and React render sites import; handles absolute passthrough, relative
  prefix, and null/empty → placeholder.

##### G1.O2.P1 — Resolver + export + tests · Depends-on: none · Rollback: revert PR

- **G1.O2.P1.S1 — Create `shared/ui/src/lib/coverImage.ts` + export path** [expand]
  - Intent: define `ASSET_BASE_URL` + `coverImageUrl(cover, placeholder)`.
  - References: `shared/ui/src/lib/coverImage.ts` [NEW]; `shared/ui/package.json:exports` (add `./cover-image`)
  - Content:
    ```ts
    export const ASSET_BASE_URL = "https://paulserban.eu/assets";
    /** Resolve a post cover to a render URL; falls back to a placeholder when unset. */
    export function coverImageUrl(cover: string | null | undefined, placeholder: string): string {
      const c = cover?.trim();
      if (!c) return placeholder;
      if (/^https?:\/\//.test(c) || c.startsWith("/")) return c;
      return `${ASSET_BASE_URL}/${c.replace(/^\/+/, "")}`;
    }
    ```
  - Export: `"./cover-image": { "types": "./src/lib/coverImage.ts", "import": "./src/lib/coverImage.ts" }`
  - Depends-on: none. Technique: none. Reversible by: revert PR.
  - Gates: TDD → S2; Deliverable: typechecks; resolves from consumers. Done-when: O4 typecheck passes.

- **G1.O2.P1.S2 — Create `shared/ui/src/lib/coverImage.test.ts`** [expand]
  - Intent: pin the resolver branches; this is the net for all render wiring.
  - References: `shared/ui/src/lib/coverImage.test.ts` [NEW]
  - Depends-on: S1. Reversible by: revert PR.
  - Gates: TDD cases — null→placeholder, undefined→placeholder, `""`/whitespace→placeholder, absolute
    `https://…`→passthrough, root `/local.png`→passthrough, relative `covers/x.png`→`${ASSET_BASE_URL}/covers/x.png`,
    leading-slash dedupe. Each fails on a real defect. BDD/Manual N/A. Deliverable: `pnpm -F shared--ui test` green. Done-when: green.

#### G1.O3 — Sketch-style placeholder asset  [expand]
##### G1.O3.P1 — Placeholder PNG · Depends-on: none · Rollback: revert PR (delete asset)

- **G1.O3.P1.S1 — Generate + commit `placeholder-cover.png`** [expand]
  - Intent: a hand-drawn/excalidraw-style neutral cover served locally at `/placeholder-cover.png`.
  - References: `frontend/sites/blog-site/public/placeholder-cover.png` [NEW] (create `public/` dir)
  - How: generate a 1200×675 (16:9) sketch-style PNG — off-white paper background, hand-drawn frame + a
    simple "no image" doodle (e.g. a sketched picture/mountains glyph), monochrome ink to match the newspaper
    theme; keep it light so it reads in both light/dark. Commit it.
  - Depends-on: none. Technique: none. Reversible by: revert PR.
  - Gates: TDD/BDD N/A (static asset); Manual: file loads at `http://localhost:4321/placeholder-cover.png`
    during dev; visually sketch-style and theme-neutral. Deliverable: committed PNG. Done-when: served + looks right.

#### G1.O4 — Render covers on cards and post hero  [expand]
- Depends-on: G1.O1.P1.S1 (PostRow has `cover_image`), G1.O2.P1.S1 (resolver), G1.O3.P1.S1 (placeholder path).

##### G1.O4.P1 — Cards (hub + listing island)  [expand]
- Rollback: revert PR.

- **G1.O4.P1.S1 — Add `cover` to `BlogPostFilterItem` + 3 listing mappers** [expand]
  - Intent: carry the cover into the React island.
  - References: `shared/ui/src/lib/postFilters.ts` (add `cover: string | null` to `BlogPostFilterItem`);
    `pages/post/index.astro`, `pages/snippet/index.astro`, `pages/booknote/index.astro` (add
    `cover: item.cover_image ?? null,` in each `posts.map(...)`)
  - Depends-on: G1.O1.P1.S1. Reversible by: revert PR.
  - Gates: TDD N/A (type + passthrough); Manual N/A (covered by S2 render). Deliverable: `astro check` exits 0. Done-when: green.

- **G1.O4.P1.S2 — Render cover in `PostCardReact.tsx`** [expand]
  - Intent: image at the top of the React card, placeholder when null.
  - References: `frontend/sites/blog-site/src/components/PostCardReact.tsx` (modify); import
    `coverImageUrl` from `@prj--personal-portfolio--v3/shared--ui/cover-image`
  - Add (above the kicker, inside `<article>`):
    ```tsx
    <a href={href} className="mb-3 block overflow-hidden border border-rule">
      <img src={coverImageUrl(post.cover, "/placeholder-cover.png")} alt="" loading="lazy"
           className="aspect-video w-full object-cover" />
    </a>
    ```
  - Depends-on: G1.O4.P1.S1, G1.O2.P1.S1, G1.O3.P1.S1. Reversible by: revert PR.
  - Gates: Manual: listing cards show cover/placeholder; no layout shift; dark mode ok. Deliverable:
    `astro build` + `astro check` exit 0. Done-when: green + manual ✓.

- **G1.O4.P1.S3 — Render cover in `PostCard.astro` (hub)** [expand]
  - Intent: same image block on the Astro hub card; uses `post.cover_image` directly.
  - References: `frontend/sites/blog-site/src/components/PostCard.astro` (modify); import `coverImageUrl` in frontmatter
  - Add the equivalent `<a><img class="aspect-video w-full object-cover" …></a>` above the kicker, using
    `coverImageUrl(post.cover_image, '/placeholder-cover.png')`.
  - Depends-on: G1.O1.P1.S1, G1.O2.P1.S1, G1.O3.P1.S1. Reversible by: revert PR.
  - Gates: Manual: hub (`/`) cards show cover/placeholder. Deliverable: `astro build`/`astro check` exit 0. Done-when: green + ✓.

##### G1.O4.P2 — Post/snippet/booknote detail hero  [expand]
- Rollback: revert PR.

- **G1.O4.P2.S1 — Add optional cover to `HeroBanner.astro`** [expand]
  - Intent: render a contained cover image inside the hero masthead when provided.
  - References: `frontend/sites/blog-site/src/components/HeroBanner.astro:6–21` (modify — add `cover?: string`
    prop; import `coverImageUrl`); render an `<img>` block (only when `cover` truthy) above the title:
    ```astro
    {cover && (
      <img src={coverImageUrl(cover, '/placeholder-cover.png')} alt="" loading="eager"
           class="mb-6 aspect-video w-full border border-rule object-cover" />
    )}
    ```
  - Note: HeroBanner is also used by listing pages (`post/index.astro` etc.) WITHOUT `cover` → the block is
    skipped there (no regression). Detail pages opt in via S2.
  - Depends-on: G1.O2.P1.S1, G1.O3.P1.S1. Reversible by: revert PR.
  - Gates: Manual: listing hero unchanged (no image). Deliverable: `astro check` exits 0. Done-when: green.

- **G1.O4.P2.S2 — Pass cover from the 3 detail pages** [expand]
  - Intent: detail pages always pass a cover so the hero shows cover-or-placeholder.
  - References: `pages/post/[slug].astro:53`, `pages/snippet/[slug].astro`, `pages/booknote/[slug].astro`
    (modify the `<HeroBanner …>` call — add `cover={post.cover_image ?? '/placeholder-cover.png'}`)
  - Note: passing the placeholder explicitly here = detail pages always showcase an image (cover or placeholder),
    while listing heroes stay text-only. Matches "post pages should showcase preview image".
  - Depends-on: G1.O4.P2.S1, G1.O1.P1.S1. Reversible by: revert PR.
  - Gates: Manual: `/post/<slug>/` shows cover when set, placeholder otherwise, in the hero; light+dark; 375/800/1100px.
    Deliverable: `astro build` + `astro check` exit 0. Done-when: green + manual ✓.

## Dependency Graph
```
G1.O1.P1.S1 → G1.O1.P1.S2 → G1.O1.P1.S3
G1.O2.P1.S1 → G1.O2.P1.S2
G1.O3.P1.S1            (independent)
G1.O4.P1.S1 ← G1.O1.P1.S1
G1.O4.P1.S2 ← G1.O4.P1.S1, G1.O2.P1.S1, G1.O3.P1.S1
G1.O4.P1.S3 ← G1.O1.P1.S1, G1.O2.P1.S1, G1.O3.P1.S1
G1.O4.P2.S1 ← G1.O2.P1.S1, G1.O3.P1.S1
G1.O4.P2.S2 ← G1.O4.P2.S1, G1.O1.P1.S1
```
O1, O2, O3 are independent tracks; O4 integrates all three. Migration (O1.P1.S2) must apply before a real
ingest run, but render wiring only needs the schema *type* (O1.P1.S1).

## Red-Team Notes
- **Riskiest to existing behavior:** the migration (G1.O1.P1.S2). Mitigation: it's a single additive,
  nullable `ALTER TABLE … ADD` (same shape as the proven `0004` migration); existing rows untouched; the
  manual gate reads the generated SQL to confirm it touches only `posts.cover_image`. Reversible by reverting
  the migration + regenerating meta (never hand-edit `meta/`).
- **Second:** `HeroBanner` is shared by listing and detail pages — a naive always-on image would put covers on
  listing heroes too. Mitigated by making the image block render only when the `cover` prop is truthy, and only
  detail pages pass it (S2). Manual check explicitly verifies listing heroes stay text-only.
- **Refactor theatre avoided:** did NOT retrofit `ImageResponsive`/`ImageSvg`/`Figure` onto the new resolver —
  different concern, no change-force.
- **Coverage theatre avoided:** no test on the one-line ingest passthrough or on JSX render; the only real
  logic (URL branching + placeholder fallback) gets focused unit tests.
- **Pattern theatre avoided:** one pure function + one constant, not an ImageProvider/Strategy.
- **Irreversible:** none — every step reverts by PR; the column is nullable and inert until read.
- **Junior traps flagged:** (a) run `pnpm db:generate` — do NOT hand-write the migration or edit `meta/`;
  (b) placeholder lives in blog `public/` and is referenced as root-absolute `/placeholder-cover.png` (Astro
  serves `public/` at site root) — not a relative import; (c) only detail pages pass `cover` to HeroBanner;
  (d) the asset base lives in ONE constant (`ASSET_BASE_URL`) — if the real cover URL template differs, edit
  only that.
