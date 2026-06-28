G1 — Blog listing pages have client-side search+sort; shared filterByQuery is imported by both apps; blog card layout matches quiz card structure
Intent: three listing pages gain search (title/slug/tag) + sort (title/newest) via a React island; the filter function lives in shared/ui and both apps use it; blog cards rendered in the island match PostCard.astro visuals.
Gates: TDD (new unit tests in shared/ui + quiz characterization test); Manual (search works + cards render at 375/800/1100px); Deliverable: pnpm build and pnpm typecheck exit 0 in both apps.
G1.O1 — Add filterByQuery + sortBlogPosts to shared/ui [expand]
Intent: pure, tested utilities that both apps can import; zero existing code in shared/ui touched.
Gates: TDD: vitest unit tests green before any consumer uses the fns; BDD: N/A (no UI); Manual: N/A; Deliverable: pnpm test passes in shared/ui.
G1.O1.P1 — New postFilters.ts + export path + vitest [expand]
Intent: Additive only — new file, new export, new devDep. Rollback: revert PR; no flag needed.
Depends-on: none
Rollback: revert PR
G1.O1.P1.S1 — Create shared/ui/src/lib/postFilters.ts [expand]

Intent: define BlogPostTag, BlogPostFilterItem, BlogSortBy, generic filterByQuery<T>, and sortBlogPosts.
References: shared/ui/src/lib/postFilters.ts [NEW]
Depends-on: none
Technique: none (new file)
Reversible by: revert PR
Gates:
TDD: postFilters.test.ts (S4) → can import these; types compile → N/A until S4.
BDD: N/A — pure functions.
Manual: N/A.
Deliverable: file typechecks (tsc -b in shared/ui). Done-when: pnpm typecheck exits 0 in shared/ui.
Exact content:

export interface BlogPostTag { name: string; slug: string; }
export interface BlogPostFilterItem {
  title: string;
  slug: string;
  excerpt: string | null;
  date: string | null;
  tags: BlogPostTag[];
  type: 'post' | 'snippet' | 'book-note';
}
export type BlogSortBy = 'title' | 'date';
/** Generic text filter over title, slug, and an app-provided tag-string extractor.
 *  Quiz usage: filterByQuery(posts, q, p => p.tags)         // tags: string[]
 *  Blog usage: filterByQuery(posts, q, p => p.tags.map(t => t.name))  // tags: BlogPostTag[]
 */
export function filterByQuery<T extends { title: string; slug: string }>(
  items: T[],
  query: string,
  getTagStrings: (item: T) => string[] = () => [],
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      getTagStrings(p).some((t) => t.toLowerCase().includes(q)),
  );
}
export function sortBlogPosts(items: BlogPostFilterItem[], sort: BlogSortBy): BlogPostFilterItem[] {
  const sorted = [...items];
  if (sort === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }
  return sorted;
}
G1.O1.P1.S2 — Add "./post-filters" export to shared/ui/package.json [expand]

Intent: make @prj--personal-portfolio--v3/shared--ui/post-filters resolvable by both consumers.
References: shared/ui/package.json:exports (modify — add one key)
Depends-on: G1.O1.P1.S1
Reversible by: revert PR
Gates:
TDD: N/A — package resolution verified by typecheck of consumers.
Manual: N/A.
Deliverable: import { filterByQuery } from '@prj--personal-portfolio--v3/shared--ui/post-filters' resolves without error in quiz and blog typechecks. Done-when: both pnpm typecheck exits 0 after consumers import from this path.
Add to exports object in shared/ui/package.json:

"./post-filters": {
  "types": "./src/lib/postFilters.ts",
  "import": "./src/lib/postFilters.ts"
}
G1.O1.P1.S3 — Add vitest devDep + test script to shared/ui/package.json [expand]

Intent: give shared/ui a working test runner so the new filter logic has a real safety net.
References: shared/ui/package.json:devDependencies, shared/ui/package.json:scripts (modify)
Depends-on: none (independent of S1/S2)
Reversible by: revert PR
Gates:
TDD: N/A (this step just installs the runner).
Manual: pnpm test in shared/ui exits 0 (no test files yet → vitest reports 0 tests, exit 0 by default with --passWithNoTests).
Deliverable: "test": "vitest run --passWithNoTests" in scripts, vitest in devDependencies. Done-when: pnpm -F @prj--personal-portfolio--v3/shared--ui test exits 0.
G1.O1.P1.S4 — Add shared/ui/src/lib/postFilters.test.ts [expand]

Intent: unit-test filterByQuery and sortBlogPosts. This is the TDD gate for G1.O1 AND the safety net that makes G1.O3's refactor meaningful.
References: shared/ui/src/lib/postFilters.test.ts [NEW]
Depends-on: G1.O1.P1.S1, G1.O1.P1.S3
Reversible by: revert PR
Gates:
TDD: 7 filterByQuery cases + 3 sortBlogPosts cases (see below) — each can fail for a real defect; no mock returns.
BDD: N/A.
Manual: N/A.
Deliverable: pnpm -F @prj--personal-portfolio--v3/shared--ui test exits 0, all tests green. Done-when: green.
Test cases to cover:

filterByQuery — empty query → returns all.
filterByQuery — title match (case-insensitive).
filterByQuery — slug match.
filterByQuery — tag name match (via extractor).
filterByQuery — no match → empty.
filterByQuery — string[] tags (quiz usage pattern: (p) => p.tags).
sortBlogPosts — 'title' → ascending alpha.
sortBlogPosts — 'date' → newest first.
sortBlogPosts — does not mutate input array.
G1.O2 — Blog: React island for search+sort on 3 listing pages [expand]
Intent: post/index.astro, snippet/index.astro, booknote/index.astro each get a client:load React island that owns search+sort+card rendering. Existing PostCard.astro untouched (still used on hub).
Safety-net: no tests on blog; gate = astro build exit 0 + astro check clean + manual.
G1.O2.P1 — React components: PostCardReact + PostListIsland [expand]
Depends-on: G1.O1.P1.S1 (needs BlogPostFilterItem type), G1.O1.P1.S2 (needs ./post-filters import path)
Rollback: revert PR; listing pages revert to static PostCard.astro in P2's rollback.
G1.O2.P1.S1 — Create blog-site/src/components/PostCardReact.tsx [expand]

Intent: React card that visually matches PostCard.astro — same structure (kicker, title link, excerpt, rule-thin, tag chips, "Read →"), same Tailwind classes, tags as bordered chips matching TagList.astro:19.
References: frontend/sites/blog-site/src/components/PostCardReact.tsx [NEW]; mirrors PostCard.astro:33–42 and TagList.astro:14–26
Depends-on: G1.O1.P1.S1
Technique: none (new file, expand)
Reversible by: revert PR (P2 pages still reference PostCard.astro until P2 steps)
Trade-off: PostCard.astro and PostCardReact.tsx will be two parallel implementations of the same visual card — acceptable because PostCard.astro serves the SSG hub page and PostCardReact.tsx serves the interactive island. The shared force is absent (different rendering contexts).
Gates:
TDD: N/A — visual component in unprotected surface; no test infra for Astro/React integration.
BDD: N/A.
Manual: card renders in browser — kicker, title, excerpt, tag chips link to /tags/<slug>/, "Read →" links to detail page; rule-thin visible. Check dark mode. Done-when: ✓ at 375/800px.
Deliverable: file typechecks (astro check). Done-when: astro check exits 0.
G1.O2.P1.S2 — Create blog-site/src/components/PostListIsland.tsx [expand]

Intent: React island with controlled search: string + sort: BlogSortBy state; calls filterByQuery + sortBlogPosts from shared; renders PostCardReact grid. Search UI matches quiz: border-2 border-ink text input + inline Sort: Title | Newest toggle buttons with active-underline.
References: frontend/sites/blog-site/src/components/PostListIsland.tsx [NEW]; imports from @prj--personal-portfolio--v3/shared--ui/post-filters
Depends-on: G1.O2.P1.S1, G1.O1.P1.S2
Reversible by: revert PR
Gates:
TDD: N/A (same reasoning as S1).
BDD: N/A.
Manual: search input filters cards live; sort toggle reorders; empty state shows italic "No posts match your search." Done-when: verified on post/index after P2.
Deliverable: file typechecks. Done-when: astro check exits 0.
G1.O2.P2 — Wire 3 Astro pages to use PostListIsland [expand]
Depends-on: G1.O2.P1.S2
Rollback: revert PR (each page is independent)
G1.O2.P2.S1 — Update post/index.astro [expand]

Intent: serialize PostRow[] + TagRow[][] to BlogPostFilterItem[] at build time; replace <ul>…PostCard…</ul> block with <PostListIsland posts={posts} client:load />.
References: frontend/sites/blog-site/src/pages/post/index.astro:1–29 (modify)
Depends-on: G1.O2.P1.S2, G1.O1.P1.S2
Reversible by: revert PR
Gates:
TDD: N/A.
Manual: /post/ builds and renders; search + sort work; 0 network errors in console. Done-when: ✓.
Deliverable: astro build + astro check exit 0. Done-when: both green.
Serialization in frontmatter (add after closeConnection(db)):

import type { BlogPostFilterItem } from '@prj--personal-portfolio--v3/shared--ui/post-filters';
const posts: BlogPostFilterItem[] = items.map((item) => ({
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt ?? null,
    date: item.date ?? null,
    type: item.type as 'post',
    tags: (tagsMap.get(item.slug) ?? []).map((t) => ({ name: t.name, slug: t.slug })),
}));
Replace the items.length > 0 ? <ul>…</ul> : <p>No…</p> block with:

<PostListIsland posts={posts} client:load />
G1.O2.P2.S2 — Update snippet/index.astro [expand]

Same pattern as S1; type: 'snippet'; no other changes.
References: frontend/sites/blog-site/src/pages/snippet/index.astro:1–33 (modify)
Depends-on: G1.O2.P1.S2
Reversible by: revert PR
Gates: same as S1 (build + check + manual /snippet/).
G1.O2.P2.S3 — Update booknote/index.astro [expand]

Same pattern; type: 'book-note'.
References: frontend/sites/blog-site/src/pages/booknote/index.astro:1–33 (modify)
Depends-on: G1.O2.P1.S2
Reversible by: revert PR
Gates: same as S1 (build + check + manual /booknote/).
G1.O3 — Quiz: adopt shared filterByQuery for post catalogue search [refactor]
Intent: replace the 5-line inline filter (routes/index.tsx:47–55) with a call to filterByQuery. No behavioral change in the happy path; one minor improvement: tag comparison is now case-insensitive (original did t.includes(q) with q already lowercased, but tags were not lowercased; new fn does t.toLowerCase().includes(q) — strictly more correct, preserved bug: none).
Depends-on: G1.O1.P1.S4 (the shared fn must be tested before the refactor swaps to it)
Safety-net: characterization test pins current filter behavior before S2 modifies the code.
G1.O3.P1 — Characterization test → swap [refactor]
Rollback: revert PR (independent of O1 and O2)
G1.O3.P1.S1 — Add characterization test for inline filter [refactor]

Intent: pin the observable output of the inline filter at routes/index.tsx:47–55 BEFORE changing it. The test imports filterByQuery (the shared replacement) and proves it produces the same results — this is the equivalence proof, not a test of the old code directly (which can't be tested in isolation since it's inside a useMemo).
References: frontend/apps/quiz-web-app/src/lib/index.filter.characterization.test.ts [NEW]; verifies against routes/index.tsx:47–55
Depends-on: G1.O1.P1.S4 (shared fn + its tests must be green)
Technique: characterization test
Reversible by: delete file
Note: Original filter on tags: t.includes(q) where q is already lowercased. Tags in the quiz are stored lowercase (verified by ExportedPostEntry usage). The shared filterByQuery uses t.toLowerCase().includes(q) — equivalent for lowercase tags, more correct for any mixed-case tag. Not a preserved bug; minor improvement.
Gates:
TDD: 5 cases (empty query, title match, slug match, tag match, no match) against filterByQuery — proves shared fn is behaviorally equivalent. Must be green before S2.
BDD: N/A — internal.
Manual: N/A.
Deliverable: pnpm -F @prj--personal-portfolio--v3/quiz-web-app test exits 0 with new test green. Done-when: green, unchanged source.
G1.O3.P1.S2 — Replace inline filter with filterByQuery [refactor]

Intent: delete 5 lines of inline filtering from routes/index.tsx:47–55; replace with filterByQuery(posts, q, (p) => p.tags). Sort logic (by title / questionCount) at lines 59–61 is not touched — it's quiz-specific.
References: frontend/apps/quiz-web-app/src/routes/index.tsx:1 (add import), routes/index.tsx:47–55 (modify — remove if (q) { filtered = posts.filter(…) }, replace with const filtered = filterByQuery(posts, q, (p) => p.tags);)
Depends-on: G1.O3.P1.S1 (characterization test must be green first), G1.O1.P1.S2 (export path must exist)
Technique: branch-by-abstraction (simple — inline → named fn at same call site)
Reversible by: revert PR
Gates:
TDD: pnpm test in quiz → index.filter.characterization.test.ts from S1 stays green (behavior-neutrality proof).
BDD: N/A — internal refactor of filtering logic, no UI scenario changes.
Manual: quiz / route loads, search input filters posts correctly, sort still works. Done-when: ✓ verified manually.
Deliverable: pnpm typecheck && pnpm test in quiz-web-app exit 0, S1 suite green. Done-when: both green.
Dependency Graph
G1.O1.P1.S1  ← (none)
G1.O1.P1.S2  ← S1
G1.O1.P1.S3  ← (none, parallel with S1)
G1.O1.P1.S4  ← S1, S3
G1.O2.P1.S1  ← G1.O1.P1.S1  (type BlogPostFilterItem)
G1.O2.P1.S2  ← G1.O2.P1.S1, G1.O1.P1.S2  (filter fns import path)
G1.O2.P2.S1  ← G1.O2.P1.S2, G1.O1.P1.S2
G1.O2.P2.S2  ← G1.O2.P1.S2
G1.O2.P2.S3  ← G1.O2.P1.S2
G1.O3.P1.S1  ← G1.O1.P1.S4  (shared fn must be tested)
G1.O3.P1.S2  ← G1.O3.P1.S1, G1.O1.P1.S2
O2 and O3 are independent of each other; O1 must be complete first.

Red-Team Notes
Riskiest step: G1.O2.P2.S1–S3. Converting SSG pages to React islands means Astro must serialize the full post list as JSON props at build time; if any PostRow field is not JSON-serializable (e.g., Date object), the build will fail. Mitigation: PostRow.date is text (string) in the schema; PostRow.published_at and updated_at are timestamp integers but are not included in BlogPostFilterItem. The serialized shape uses only primitive strings and nulls — safe. Gate: astro build catches this immediately.

Second risk: G1.O3.P1.S2. The quiz's useMemo deps array ([posts, search, sortBy]) references the filtered variable after refactor — need to ensure the variable is correctly named. Original code assigns let filtered = posts then conditionally filters. After refactor: const filtered = filterByQuery(posts, q, (p) => p.tags) (always returns a value, no conditional branch needed). The sorted variable below still works. The characterization test (S1) catches any behavioral drift.

Refactor theatre avoided: Not renaming BrowsePage in routes/index.tsx; not extracting a usePostFilter hook (single call site, no reuse); not moving the sort logic to shared (quiz-specific field questionCount).

Coverage theatre avoided: No snapshot tests on rendered card HTML; no test asserting "component renders without crashing." The filterByQuery tests each assert a real invariant that would catch a real defect (wrong match logic, case sensitivity regression, mutation of input).

Pattern theatre avoided: Not creating a PostFilterRepository or FilterStrategy interface — one function, tested, done.

Irreversible steps: None. Every step is revertible by PR revert. vitest added to shared/ui devDeps can be removed cleanly.

Junior trap — PostListIsland.tsx client:load: The Astro client:load directive is required on the component usage site in the .astro file, not in the .tsx definition. If the executor adds it to the TSX file, it will error. The plan correctly places client:load in the .astro page at G1.O2.P2.S1–S3, not in the island component file.

Junior trap — PostCard.astro on hub: index.astro (hub) is NOT in the blast radius. The executor must not touch it. It still uses PostCard.astro. Only the 3 full-listing pages change.

Plan Quality Bar check:


 Every step references real files/symbols or is [NEW].

 No unprotected code modified before its net (G1.O3.P1.S2 depends on S1 characterization test; G1.O2 has no existing code to protect — it's an expand).

 G1.O3 refactor step: zero new behavioral assertions; S1 characterization test pins existing behavior; sort untouched.

 No improve steps without baseline (card visual is an expand, not improve with a metric).

 Every step reversible by PR revert; no big-bang.

 DAG is acyclic and complete.

 Every gate specified or N/A with reason.

 Every pattern/abstraction justified by named force.

 Refactor/coverage/pattern theatre named and avoided in Red-Team.

 No judgment calls left for the executor.