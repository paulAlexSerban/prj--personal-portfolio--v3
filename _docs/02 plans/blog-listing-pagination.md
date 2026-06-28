---
name: Blog listing pagination (URL-synced) + shared pagination utils
overview: >
  Add client-side pagination (12 cards/page) to the three blog listing pages that already
  carry the search+sort island (post/snippet/booknote). The current page is synced to a
  ?page= URL query param (shareable, survives reload) and resets to page 1 whenever search
  or sort changes — so search keeps working exactly as it does today, just over paginated
  results. Pagination math (paginate/totalPages/clampPage) is extracted into shared/ui as
  "common functionality" and the quiz browser is refactored to import the shared copies,
  matching the search/sort precedent. Net = unit tests for the shared math, the relocated
  quiz tests staying green, and build+check+manual on the unprotected blog island.
todos:
  - id: o1-shared
    content: G1.O1 — shared/ui pagination.ts (paginate/totalPages/clampPage) + export + tests
    status: pending
  - id: o2-quiz
    content: G1.O2 — quiz browse imports shared pagination; remove local copies; relocate tests
    status: pending
  - id: o3-blog
    content: G1.O3 — PostListIsland pagination (12/page) + ?page= URL sync + reset-on-filter
    status: pending
isProject: false
---

# Plan: implement pagination on blog listing pages (search unchanged)

CHANGE_REQUEST: implement pagination on the listing ("hub") pages — ensure search continues
to work in the same manner.
WORK_TYPES: expand (blog island + shared math) · refactor (quiz adopts shared math).
MODE: ask — resolved via 4 answered questions (see Trade-off Decisions).

## Context Ledger

**Known (verified)**
- Search/sort live only in `blog-site/src/components/PostListIsland.tsx:14–64` (used by `/post/`,
  `/snippet/`, `/booknote/`). The front page `index.astro` is pinned-only with no search → out of scope.
- `PostListIsland.tsx:18–21` — `rows = sortBlogPosts(filterByQuery(posts, search, …), sortBy)`; rendered
  as a single `<ul>` grid at `:54–60`; empty state at `:49–52`.
- Quiz already has tested pagination math: `quiz-web-app/src/lib/questionFilters.ts:97–104`
  (`paginate<T>`, `totalPages`), tested at `questionFilters.test.ts:129–135`.
- Quiz consumer: `browse.tsx:13,15` import `paginate`/`totalPages` from `@/lib/questionFilters`;
  `:21` `PAGE_SIZE = 25`; `:70–71` compute pages/pageItems; `:73–75` reset page to 1 on filter change;
  `:165` renders inline `Pagination` (`browse.tsx:265–306`, stamp-ghost Prev/Next + page indicator).
- shared/ui pattern established last change: `shared/ui/src/lib/postFilters.ts` + export path
  `./post-filters` + vitest; both apps import filterByQuery from it.
- shared/ui `package.json:exports` currently: `.`/`./blocks`/`./utils`/`./post-filters`/`./styles.css`;
  `test` = `vitest run --passWithNoTests`.
- Blog is SSG; `PostListIsland` is a `client:load` island → can read `window`/`history` at runtime.

**Assumed**
- React renders the island during SSG with `window` undefined; reading the URL must happen in a
  post-mount `useEffect` (not in a `useState` initializer) to avoid a hydration mismatch.

**Unverified** — none blocking.

## Current-State Audit
- **Safety-net:**
  - shared pagination math → will be unit-tested (`pagination.test.ts` [NEW]) = the net.
  - quiz `paginate`/`totalPages` → currently protected by `questionFilters.test.ts:129–135`; that
    coverage **relocates** to the shared test (net-first: shared test green before quiz copies removed).
  - blog island → **unprotected** (no test infra for Astro/React islands); gate = `astro build` +
    `astro check` + manual. The only new *logic* (page clamp) is pushed into the tested shared `clampPage`.
- **Blast radius:** `paginate`/`totalPages` consumed only by `browse.tsx` (quiz) — single consumer.
  `PostListIsland` consumed by the 3 listing pages only. `index.astro` and `PostCard.astro` untouched.
- **Baseline:** N/A — this is expand (new capability) + a behavior-neutral refactor, not a metric-improve.

## Open Questions — all resolved
- [resolved] Scope = the 3 listing pages with search (not the pinned front page).
- [resolved] Pagination math is common (shared/ui); quiz refactored to import it.
- [resolved] Page size = 12.
- [resolved] Page synced to `?page=` URL query param (shareable, survives reload).

## Trade-off Decisions

| Decision | Options (incl. leave-as-is) | Cost | Benefit | Chosen | Named force |
|---|---|---|---|---|---|
| Pagination math placement | leave in quiz; **shared/ui (chosen)** | small refactor (net-first) | one source of truth; matches search/sort precedent | shared/ui `./pagination` | user: "common functionality"; precedent set by filterByQuery |
| Quiz adoption | leave quiz copy; **import shared (chosen)** | one swap step | no divergent pagination logic | swap browse.tsx, remove local copies | user choice; avoids two copies |
| Page size | 9 / **12 (chosen)** / 24 | none | balanced grid density | 12 | user choice |
| Page persistence | component state; **?page= URL (chosen)** | URL read/write + clamp | shareable, survives reload | `?page=` via `history.replaceState` | user choice |
| Reset on search/sort | clamp only; **reset to page 1 (chosen)** | none | matches quiz behavior ("same manner") | setPage(1) in handlers | request: "search works in the same manner" (quiz resets on filter change `browse.tsx:73`) |
| Clamp logic | inline in island (untested); **shared `clampPage` (chosen)** | one tiny fn + test | bookmarked `?page=999` can't break render; tested | `clampPage` in shared/ui | real defect class (out-of-range page) on the URL feature |
| History API | pushState; **replaceState (chosen)** | back-button won't step through pages | no history spam while typing search | replaceState | typing search must not pollute history |

### Explicitly NOT doing
- No pagination on the front page `index.astro` — pinned-only, small, no search. Force absent.
- No shared **Pagination React component** — quiz uses a table-context inline control; blog uses a grid
  control with blog tokens. Two visual contexts, one consumer each → pattern theatre. Share the math, not the UI.
- Not adopting `clampPage` into the quiz — quiz resets to 1 and never overshoots; YAGNI there.
- Not touching `PostCard.astro` / `PostCardReact.tsx` / `index.astro`.
- No server-side/paginated data fetch — all post data is already in the island props; pagination is pure client slicing.

## Delivery Plan

### G1 — Blog listings paginate at 12/page with a shareable ?page= URL; search/sort still filter the full set and reset to page 1; pagination math is shared and the quiz uses it
- Gates: TDD (shared math unit tests + relocated quiz tests stay green); Manual (search filters across all
  pages + resets to page 1; Prev/Next + indicator correct; `?page=` updates, survives reload, clamps);
  Deliverable: `pnpm build` + `pnpm typecheck` exit 0 in both apps; shared/ui + quiz test suites green.

#### G1.O1 — Add `paginate` + `totalPages` + `clampPage` to shared/ui  [expand]
- Intent: pure, tested pagination math both apps can import; additive (no existing shared code touched).

##### G1.O1.P1 — New `pagination.ts` + export path + tests  · Depends-on: none · Rollback: revert PR

- **G1.O1.P1.S1 — Create `shared/ui/src/lib/pagination.ts`** [expand]
  - Intent: define `paginate<T>`, `totalPages`, `clampPage` (copy the exact quiz impl + add clamp).
  - References: `shared/ui/src/lib/pagination.ts` [NEW]; mirrors `quiz-web-app/src/lib/questionFilters.ts:97–104`
  - Technique: none (new file). Reversible by: revert PR.
  - Gates: TDD → covered by S3. BDD/Manual: N/A (pure fns). Deliverable: typechecks. Done-when: `pnpm -F shared--ui typecheck` exits 0.
  - Content:
    ```ts
    export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
      const start = (page - 1) * pageSize;
      return items.slice(start, start + pageSize);
    }
    export function totalPages(count: number, pageSize: number): number {
      return Math.max(1, Math.ceil(count / pageSize));
    }
    /** Clamp a (possibly out-of-range / non-finite) page into [1, max(1, pages)]. */
    export function clampPage(page: number, pages: number): number {
      const max = Math.max(1, pages);
      if (!Number.isFinite(page) || page < 1) return 1;
      return Math.min(Math.floor(page), max);
    }
    ```

- **G1.O1.P1.S2 — Add `"./pagination"` export to `shared/ui/package.json`** [expand]
  - References: `shared/ui/package.json:exports` (modify — add one key after `./post-filters`)
  - Depends-on: S1. Reversible by: revert PR.
  - Gates: TDD/Manual N/A — verified by consumer typecheck. Deliverable: `import … from '@prj--personal-portfolio--v3/shared--ui/pagination'` resolves. Done-when: O2/O3 typechecks pass.
  - Add:
    ```json
    "./pagination": { "types": "./src/lib/pagination.ts", "import": "./src/lib/pagination.ts" }
    ```

- **G1.O1.P1.S3 — Create `shared/ui/src/lib/pagination.test.ts`** [expand]
  - Intent: unit-test all three fns; this is the net that lets G1.O2 remove the quiz copies safely.
  - References: `shared/ui/src/lib/pagination.test.ts` [NEW]
  - Depends-on: S1. Reversible by: revert PR.
  - Gates: TDD → `paginate` (page 1, page 2, out-of-range→[]), `totalPages` (ceil, 0 items→1, exact multiple), `clampPage` (in-range, <1→1, >max→max, non-finite→1, pages=0→1). Each fails for a real defect. BDD/Manual: N/A. Deliverable: `pnpm -F shared--ui test` green. Done-when: green.

#### G1.O2 — Quiz browser adopts shared pagination math  [refactor]
- Intent: replace the quiz's local `paginate`/`totalPages` with the shared copies; zero behavior change.
- Depends-on: G1.O1.P1.S3 (shared net green before local copies removed).

##### G1.O2.P1 — Swap import + remove local copies + relocate tests · Rollback: revert PR

- **G1.O2.P1.S1 — Point quiz at shared pagination; delete local copies & relocated tests** [refactor]
  - Intent: behavior-neutral relocation; `browse.tsx` keeps identical pagination behavior via the shared fns.
  - References (all modify, must land together to compile):
    - `quiz-web-app/src/routes/browse.tsx:8–17` — remove `paginate,` and `totalPages,` from the
      `@/lib/questionFilters` import; add `import { paginate, totalPages } from "@prj--personal-portfolio--v3/shared--ui/pagination";`
    - `quiz-web-app/src/lib/questionFilters.ts:97–104` — delete the two function definitions.
    - `quiz-web-app/src/lib/questionFilters.test.ts:3–9,129–136` — remove `paginate`/`totalPages` from the
      import and delete the `describe("paginate", …)` block (coverage now lives in shared `pagination.test.ts`).
  - Depends-on: G1.O1.P1.S3. Technique: branch-by-abstraction (swap impl behind the same call sites). Reversible by: revert PR.
  - Gates:
    - TDD: full quiz suite (`pnpm -F frontend--quiz-web-app test`) stays green — behavior-neutrality proof; the
      relocated assertions live in `pagination.test.ts`.
    - BDD: N/A — internal.
    - Manual: quiz `/browse` loads; Prev/Next + "Page X of Y · N total" identical to before.
    - Deliverable: `pnpm typecheck` + `pnpm test` exit 0 in quiz; shared `pagination.test.ts` green. Done-when: all green, browse pagination unchanged.

#### G1.O3 — Blog island pagination (12/page) with ?page= URL sync  [expand]
- Intent: paginate the filtered+sorted rows; sync page to `?page=`; reset to page 1 on search/sort; clamp.
- Safety-net: unprotected island → gate = `astro build` + `astro check` + manual; new clamp logic is the tested shared `clampPage`.

##### G1.O3.P1 — Add pagination to PostListIsland · Depends-on: G1.O1.P1.S2 · Rollback: revert PR

- **G1.O3.P1.S1 — Extend `PostListIsland.tsx` with paging + URL + controls** [expand]
  - Intent: slice rows to 12/page, render Prev/Next + indicator, sync `?page=`, reset to page 1 when search/sort change.
  - References: `blog-site/src/components/PostListIsland.tsx:1–64` (modify); imports from `@prj--personal-portfolio--v3/shared--ui/pagination`
  - Depends-on: G1.O1.P1.S2. Technique: none (expand). Reversible by: revert PR.
  - Implementation contract (one obvious way):
    - `const PAGE_SIZE = 12;`
    - `const [page, setPage] = useState(1);` (initializer returns 1 → matches SSR; do NOT read URL here).
    - URL helpers (module-scope, window-guarded):
      ```ts
      function readPageFromUrl(): number {
        if (typeof window === 'undefined') return 1;
        const p = Number(new URLSearchParams(window.location.search).get('page'));
        return Number.isInteger(p) && p > 0 ? p : 1;
      }
      function writePageToUrl(page: number): void {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (page <= 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        window.history.replaceState({}, '', url);
      }
      ```
    - `useEffect(() => { const p = readPageFromUrl(); if (p > 1) setPage(p); }, []);` (sync from URL after mount).
    - `const goToPage = (p: number) => { setPage(p); writePageToUrl(p); };`
    - Search `onChange`: `setSearch(e.target.value); goToPage(1);`  · each sort button `onClick`: `setSortBy(s); goToPage(1);`
    - After `rows` memo: `const pages = totalPages(rows.length, PAGE_SIZE);` `const current = clampPage(page, pages);`
      `const pageItems = paginate(rows, current, PAGE_SIZE);`
    - Render `pageItems` (not `rows`) in the grid.
    - Below the grid, when `rows.length > 0 && pages > 1`, render a control: Prev (`disabled={current<=1}` → `goToPage(current-1)`),
      `Page {current} of {pages} · {rows.length} total` (`kicker`/smallcaps), Next (`disabled={current>=pages}` → `goToPage(current+1)`),
      styled with `stamp stamp-ghost` to match the blog buttons.
    - Empty state (`rows.length === 0`) unchanged; no controls shown.
  - Gates:
    - TDD: N/A — island has no test infra; new math is the already-tested shared `paginate`/`totalPages`/`clampPage`.
    - BDD: N/A.
    - Manual (the core "search still works the same" check), on `/post/`, `/snippet/`, `/booknote/`:
      1. With >12 items: only 12 cards show; Prev/Next + indicator correct.
      2. Type a query → results filter across the *whole* set (not just current page) and view jumps to page 1.
      3. Change sort → page resets to 1; order correct.
      4. Click to page 2 → URL shows `?page=2`; reload → still on page 2.
      5. Manually visit `?page=999` → clamps to last page, no crash.
      6. Page 1 → URL has no `page` param. Dark mode unaffected.
    - Deliverable: `astro build` + `astro check` exit 0; manual checklist passes. Done-when: all green + checklist ✓.

## Dependency Graph
```
G1.O1.P1.S1 → G1.O1.P1.S2
G1.O1.P1.S1 → G1.O1.P1.S3
G1.O1.P1.S3 → G1.O2.P1.S1        (net-first: shared test green before quiz copies removed)
G1.O1.P1.S2 → G1.O3.P1.S1        (island needs the ./pagination export)
```
O2 and O3 are independent; both require O1.

## Red-Team Notes
- **Riskiest:** G1.O3.P1.S1 — SSG/hydration. Reading the URL in a `useState` initializer would desync server
  HTML (page 1) from client (`?page=N`) → hydration mismatch. Mitigated by reading the URL in a post-mount
  `useEffect`; the contract above forbids the initializer read. `astro build` + manual reload check catch regressions.
- **Second:** G1.O2.P1.S1 touches 3 files at once — but it's one behavior-neutral relocation; the full quiz suite
  (which exercises `browse` math via the relocated-then-shared functions) plus `pagination.test.ts` prove neutrality.
- **Refactor theatre avoided:** not renaming `Pagination`/`BrowsePage`; not "tidying" `questionFilters.ts` beyond the two moved fns.
- **Coverage theatre avoided:** no test asserting the island "renders"; the math net asserts real invariants (slicing, ceil, clamp bounds).
- **Pattern theatre avoided:** no shared Pagination React component (one consumer per visual context); no clampPage forced into the quiz.
- **Irreversible:** none — every step reverts by PR.
- **Junior traps flagged:** (a) URL read goes in `useEffect`, never the `useState` initializer; (b) render `pageItems`, not `rows`; (c) do not paginate or modify `index.astro` (front page) — only the island.
