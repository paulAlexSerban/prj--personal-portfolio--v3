Now I have all the context I need.

---

# Plan: Navigation Structure — Grouping, CV Removal & Hover Dropdown

## Context Ledger

**Known** (verified)
- `shared/navigation/src/types.ts:1-5` — `NavLink = { label, href, active? }`; no discriminated-union support
- `shared/navigation/src/MobileNav.tsx:8-43` — takes `links: NavLink[]`, renders flat `<a>` list inside a Sheet
- `shared/navigation/index.ts:1-3` — exports `MobileNav`, `urls.ts`, `types.ts`; no dropdown exported yet
- `frontend/sites/portfolio-site/src/components/SiteHeader.astro:5-11` — 6 links: Home · Experience · Portfolio · Blog · Quiz · CV; `MobileNav` hydrated as `client:load`
- `frontend/sites/portfolio-site/src/components/SiteFooter.astro:4-11` — same 6 links including CV
- `frontend/sites/blog-site/src/components/SiteHeader.astro:5-11` — 5 links: Posts · Snippets · Book Notes · Portfolio · Quiz; `MobileNav` as `client:load`
- `frontend/apps/quiz-web-app/src/components/layout/Masthead.tsx:15-22` — 6 internal `navItems` (TanStack `Link`), then 2 cross-app `<a>` tags; Sheet inline (does **not** use shared `MobileNav`)
- `shared/navigation/src/urls.ts:53-54` — `externalLinkAttrs` already handles `target`/`rel` for cross-app links
- Portfolio's `SiteHeader.astro` + `SiteFooter.astro` already import `siteUrls.cv` — CV page exists at `/cv/`; removing it from nav does not delete the route
- Tailwind classes are scanned via `@source` directives; new classes inside `.astro` and `.tsx` files under existing `@source` paths will be generated without additional config

**Assumed**
- The quiz `Sites ▾` dropdown in row 1 replaces the previous right-aligned Portfolio+Blog links entirely; the mobile Sheet retains them with a visual separator — not confirmed in a screenshot, but follows from the two-row decision
- Blog `SiteFooter.astro` does not include CV (blog never had CV in footer) — assumed correct based on summary; no change needed there

**Unverified**
- Whether any Astro page imports or links to the CV route programmatically other than `SiteHeader`/`SiteFooter` — no blocking risk; we are not removing the `/cv/` page, only removing two nav links

---

## Current-State Audit (target area)

**Safety-net:** **Unprotected** — no unit or integration tests exist for `SiteHeader.astro`, `SiteFooter.astro`, or `Masthead.tsx`. The CI build (`pnpm typecheck && pnpm test`) exercises TypeScript types and the `urls.test.ts` unit suite; it does not assert rendered markup.

**"Already safe to touch without a net" justification (per prime directive):** Every change in this plan is additive/subtractive markup or new component creation. Logic being touched (URL references, `isNavLinkActive`) is already tested in `urls.test.ts`. A wrong Tailwind class name produces a visual defect detectable by a manual browser check in the DEV deployment — it does not corrupt data, crash the app, or alter routing. The cost of setting up DOM-snapshot or visual-regression infrastructure exceeds the risk of these template-level edits. Manual gate covers the gap.

**Blast radius:**
- `SiteHeader.astro` (portfolio): consumed by `BaseLayout.astro` (portfolio) only
- `SiteFooter.astro` (portfolio): same
- `SiteHeader.astro` (blog): consumed by `BaseLayout.astro` (blog) only
- `Masthead.tsx` (quiz): consumed by `Layout.tsx` (quiz) only
- `shared/navigation/index.ts`: consumers are portfolio `SiteHeader`, blog `SiteHeader`, quiz `Masthead`; new export doesn't break existing imports

**Baseline metric:** No perf or bundle metric targeted. This is a pure UX/structural improvement measured by manual review. N/A for numeric baseline.

---

## Findings Register

| ID | Finding | Evidence | Severity | Blast radius | Effort | Recommended action |
|---|---|---|---|---|---|---|
| F1 | Quiz desktop nav is a single horizontal strip of 8 items crowding the masthead strip | `Masthead.tsx:44-67` | Medium — readability/UX | quiz only | Low | Split into two rows: cross-app row + internal row |
| F2 | CV link in portfolio nav and footer is not in the stated nav spec and adds noise | `SiteHeader.astro:11`, `SiteFooter.astro:10` | Low | portfolio only | Trivial | Remove from both nav and footer |
| F3 | Cross-app links (Blog, Quiz on portfolio; Portfolio, Quiz on blog; Portfolio, Blog on quiz) are visually undifferentiated from internal links; no grouping cue for users | All three headers | Medium — UX/discoverability | all three sites | Low–Medium | Group under a labeled "Sites ▾" hover dropdown on desktop |
| F4 | Quiz mobile Sheet has no visual boundary between internal app links and cross-app links | `Masthead.tsx:85-111` | Low | quiz only | Trivial | Add a section label/divider before cross-app links |
| F5 | `NavDropdown` does not exist in `shared/navigation`; each site would otherwise re-implement the hover-dropdown pattern independently | `shared/navigation/index.ts:1-3` | Low — DX/maintainability | all three sites (future) | Low | Create shared `NavDropdown.tsx` before implementing it in headers |

---

## Open Questions

All `[BLOCKING]` questions were answered interactively. No open questions remain.

---

## Trade-off Decisions

| Decision | Options | Cost | Benefit | Chosen | Named force |
|---|---|---|---|---|---|
| Dropdown trigger mechanism | hover (CSS `group-hover` + `focus-within`) vs click (`useState`) vs `<details>/<summary>` | hover is pointer-centric but covered by `focus-within` for keyboard; no JS state needed | Zero hydration overhead; consistent with the print/newspaper aesthetic; smallest bundle delta | **CSS hover + `focus-within`** | The sites are SSG-first; adding `useState` for a dropdown that works fine with CSS is pattern theatre |
| NavDropdown location | Inline HTML in each `.astro` file vs shared React component in `shared/navigation` | Shared component adds minor `client:load` hydration (~same cost as existing `MobileNav`); inline duplicates markup | Shared: single source of truth for hover styles, link rendering, `externalLinkAttrs`; already follows the existing `MobileNav` island pattern | **Shared `NavDropdown.tsx`** | `MobileNav` is already a React island in both Astro sites; the pattern is established; future style changes hit one file |
| CV from portfolio nav/footer | Leave as-is vs remove | No dev cost; inconsistency with spec | Cleaner nav, matches stated spec | **Remove from nav and footer** | F2; zero change-frequency value for CV in the nav bar once Portfolio section link exists |
| Blog mobile nav grouping | Add section headers to shared `MobileNav` vs leave flat | Changing `MobileNav` API is a breaking change to 2 callers; blog has only 5 nav items | Flat 5-item mobile list is perfectly readable; no grouping benefit at this count | **Leave blog mobile nav flat** — no force justifies breaking the `MobileNav` API |
| Quiz mobile Sheet cross-app grouping | Inline section divider in `Masthead.tsx` vs change shared `MobileNav` API | Inline divider is 3 lines of JSX; `MobileNav` API change is a breaking refactor | Quiz builds its Sheet directly in `Masthead.tsx` (not through shared `MobileNav`), so inline divider costs nothing | **Inline section label in `Masthead.tsx`** |

### Explicitly NOT doing / leaving as-is

- `shared/navigation/src/MobileNav.tsx` API — no second caller shape exists yet; changing `links: NavLink[]` to a grouped structure is YAGNI and would be an API break for 2 callers with no named force
- `shared/navigation/src/urls.ts` — `siteUrls.cv` URL left in place; the CV page route still exists; removing an export is not needed and would break any future caller
- `shared/navigation/src/types.ts` — `NavLink` type unchanged; a discriminated union for section-headers has no current consumer; pattern theatre
- Blog `SiteFooter.astro` — already has Portfolio + Quiz links without CV; no change needed
- Any Astro layout file other than the two `SiteHeader.astro` files and `SiteFooter.astro` (portfolio) — out of scope
- `frontend/sites/portfolio-site/src/lib/urls.ts` — `siteUrls.cv` stays as an export; removing it would be refactor theatre with no named force

---

## Delivery Plan

### G1 — Unify and restructure navigation across all three apps

**Intent:** Remove CV from portfolio nav/footer, introduce a shared hover-dropdown component for cross-app links, and split the quiz masthead into two rows to separate internal from cross-app navigation.

**Gates (goal-level):** TDD: N/A at goal level — gating happens per step. BDD: N/A. Manual: full browser pass on all three DEV deployments after all phases merged. Deliverable: all three sites render the new nav structure with CV absent from portfolio and "Sites ▾" dropdown visible on desktop.

---

#### G1.O1 — Create `NavDropdown` component in `shared/navigation` [expand]

**Intent:** Add a new export without touching any existing export; callers can adopt it independently.

**References:** `shared/navigation/src/NavDropdown.tsx` [NEW] · `shared/navigation/index.ts:3` (append export)

**Gates:** Zero existing behavior changed; no characterization net needed.

---

##### G1.O1.P1 — Build and export `NavDropdown` [expand]

**Depends-on:** none
**Rollback:** revert the two file changes; no other code references `NavDropdown` yet

---

**G1.O1.P1.S1 — Create `shared/navigation/src/NavDropdown.tsx`** [expand]

- **Intent:** Implement a pure-CSS hover+focus-within dropdown React component, consistent with existing `MobileNav` styling conventions.
- **References:** `shared/navigation/src/NavDropdown.tsx` [NEW] · `shared/navigation/src/urls.ts:53-54` (import `externalLinkAttrs`) · `shared/navigation/src/types.ts:1-5` (import `NavLink`)
- **Depends-on:** none
- **Technique:** none (new file)
- **Reversible by:** delete the file; no callers yet
- **Gates:**
  - TDD: N/A — pure markup component; no logic beyond `externalLinkAttrs` (already tested in `urls.test.ts`)
  - BDD: N/A — internal UI primitive
  - Manual: render in isolation is verified in S4/S7 browser checks
  - Deliverable: `NavDropdown.tsx` exists and passes `pnpm typecheck`. Done-when: `tsc --noEmit` exits 0.

The component accepts `{ label: string; links: NavLink[] }`. It wraps a `<div className="group relative">`, renders a styled `<span>` trigger, and a `<ul>` panel with `hidden group-hover:block focus-within:block` to show on hover or keyboard focus-within. Uses `externalLinkAttrs` for cross-app link attributes. Styled to match the existing masthead typographic scale (`text-[11px] smallcaps text-ink`).

---

**G1.O1.P1.S2 — Export `NavDropdown` from `shared/navigation/index.ts`** [expand]

- **Intent:** Make `NavDropdown` available to all three consuming apps via the package barrel.
- **References:** `shared/navigation/index.ts:3` (append `export { NavDropdown } from './src/NavDropdown.tsx';`)
- **Depends-on:** G1.O1.P1.S1
- **Technique:** none
- **Reversible by:** remove the export line
- **Gates:**
  - TDD: N/A — barrel re-export
  - BDD: N/A
  - Manual: N/A
  - Deliverable: `pnpm typecheck` green. Done-when: tsc exits 0.

---

#### G1.O2 — Remove CV from portfolio nav and footer [improve]

**Intent:** CV appears in neither the stated nav spec nor the confirmed target set. Removing two link entries reduces nav items from 6 to 5 and eliminates the inconsistency. The `/cv/` route is **not** removed.

**References:** `frontend/sites/portfolio-site/src/components/SiteHeader.astro:5-11` · `frontend/sites/portfolio-site/src/components/SiteFooter.astro:4-11`

**Safety-net assessment:** Unprotected markup — justified above (visual-only change, CI build catches TypeScript errors, manual gate covers rendering).

---

##### G1.O2.P1 — Remove CV link from portfolio SiteHeader and SiteFooter [improve]

**Depends-on:** none (independent of G1.O1)
**Rollback:** revert the two file changes

---

**G1.O2.P1.S1 — Remove CV entry from `SiteHeader.astro` navLinks array** [improve]

- **Intent:** Delete the `{ label: 'CV', href: siteUrls.cv }` entry from the `navLinks` array and the corresponding `mobileLinks` derivation picks it up automatically.
- **References:** `frontend/sites/portfolio-site/src/components/SiteHeader.astro:11` (delete that line)
- **Depends-on:** none
- **Technique:** none
- **Reversible by:** revert single line deletion
- **Gates:**
  - TDD: N/A — link deletion; no logic
  - BDD: N/A
  - Manual: verify CV link is absent from desktop nav and mobile Sheet after deploy
  - Deliverable: `pnpm typecheck` green; CV absent from rendered nav. Done-when: both conditions true.

---

**G1.O2.P1.S2 — Remove CV entry from `SiteFooter.astro` footerLinks array** [improve]

- **Intent:** Delete the `{ label: 'CV', href: siteUrls.cv }` entry from `footerLinks`.
- **References:** `frontend/sites/portfolio-site/src/components/SiteFooter.astro:10` (delete that line)
- **Depends-on:** G1.O2.P1.S1 (logical group; can be one commit)
- **Technique:** none
- **Reversible by:** revert single line deletion
- **Gates:**
  - TDD: N/A
  - BDD: N/A
  - Manual: verify CV absent from footer
  - Deliverable: CV absent from footer in browser. Done-when: visual check passes.

---

#### G1.O3 — Add "Sites ▾" hover dropdown to portfolio desktop nav [expand]

**Intent:** Replace the standalone Blog and Quiz cross-app links with a single `NavDropdown` island, reducing top-level nav items from 5 (post-CV removal) to 4 (Home · Experience · Portfolio · Sites ▾).

**References:** `frontend/sites/portfolio-site/src/components/SiteHeader.astro` · `shared/navigation/src/NavDropdown.tsx` [NEW] · `frontend/sites/portfolio-site/astro.config.mjs` (already has `shared--navigation` in `noExternal` and `react.include`)

---

##### G1.O3.P1 — Integrate NavDropdown into portfolio SiteHeader [expand]

**Depends-on:** G1.O1.P1.S2 (NavDropdown must be exported first), G1.O2.P1.S1 (CV already removed)
**Rollback:** revert SiteHeader.astro; NavDropdown component itself is unaffected

---

**G1.O3.P1.S1 — Rewrite navLinks in portfolio SiteHeader to use NavDropdown** [expand]

- **Intent:** Remove Blog and Quiz from the flat `navLinks` array; import `NavDropdown` from the shared package; render it `client:load` after the desktop nav links; keep `mobileLinks` (passed to `MobileNav`) intact with Blog and Quiz still present as flat links for the mobile Sheet.
- **References:** `frontend/sites/portfolio-site/src/components/SiteHeader.astro:2` (add import) · `:5-11` (remove Blog, Quiz entries from navLinks) · `:36-50` (desktop nav block — add `NavDropdown` after mapped links) · `:16` (mobileLinks — keep Blog+Quiz by building a separate `crossAppLinks` array passed to MobileNav at the bottom of the mobile list)
- **Depends-on:** G1.O1.P1.S2
- **Technique:** expand (new island rendered alongside existing links)
- **Reversible by:** revert SiteHeader.astro
- **Trade-off:** `mobileLinks` must still include Blog and Quiz for the mobile Sheet. The approach: keep a separate `crossAppLinks` array `[{ label:'Blog', href: siteUrls.blog }, { label:'Quiz', href: siteUrls.quiz }]`, pass `[...mobileLinks, ...crossAppLinks]` to `MobileNav`. This avoids any `MobileNav` API change.
- **Gates:**
  - TDD: N/A — markup change; no testable logic introduced
  - BDD: N/A
  - Manual: on desktop, confirm "Sites ▾" label appears, hover reveals Blog and Quiz links, keyboard tab into dropdown reveals links. On mobile, confirm Blog and Quiz still appear in the Sheet.
  - Deliverable: `pnpm typecheck` green; browser confirms dropdown behavior. Done-when: both conditions true.

---

#### G1.O4 — Add "Sites ▾" hover dropdown to blog desktop nav [expand]

**Intent:** Same pattern as G1.O3 for blog: replace Portfolio and Quiz cross-app links with a single `NavDropdown` island; blog mobile Sheet retains them flat.

**References:** `frontend/sites/blog-site/src/components/SiteHeader.astro:2,5-11,38-51`

---

##### G1.O4.P1 — Integrate NavDropdown into blog SiteHeader [expand]

**Depends-on:** G1.O1.P1.S2
**Rollback:** revert blog SiteHeader.astro

---

**G1.O4.P1.S1 — Rewrite navLinks in blog SiteHeader to use NavDropdown** [expand]

- **Intent:** Remove Portfolio and Quiz from the flat `navLinks` (leaving Posts · Snippets · Book Notes); import `NavDropdown`; render it `client:load` with `[{ label:'Portfolio', href: siteUrls.portfolio }, { label:'Quiz', href: siteUrls.quiz }]`; keep both in `mobileLinks` via a `crossAppLinks` array identical in pattern to G1.O3.P1.S1.
- **References:** `frontend/sites/blog-site/src/components/SiteHeader.astro:2` (import) · `:5-11` (remove Portfolio, Quiz from navLinks) · `:38-51` (desktop nav block)
- **Depends-on:** G1.O1.P1.S2
- **Technique:** expand
- **Reversible by:** revert blog SiteHeader.astro
- **Gates:**
  - TDD: N/A
  - BDD: N/A
  - Manual: desktop — "Sites ▾" hover reveals Portfolio and Quiz. Mobile — Portfolio and Quiz still in Sheet.
  - Deliverable: `pnpm typecheck` green; browser check passes. Done-when: both.

---

#### G1.O5 — Split quiz Masthead into two nav rows with Sites dropdown [improve]

**Intent:** Eliminate the 8-item crowded single row. Row 1 = dateline (left) + Sites ▾ dropdown (right) + mobile trigger. Row 2 (desktop only) = 6 internal links. Mobile Sheet gains a labeled section divider between internal and cross-app links.

**References:** `frontend/apps/quiz-web-app/src/components/layout/Masthead.tsx:1-119`

---

##### G1.O5.P1 — Restructure Masthead layout and add Sites dropdown [improve]

**Depends-on:** G1.O1.P1.S2 (NavDropdown exported)
**Rollback:** revert Masthead.tsx

---

**G1.O5.P1.S1 — Restructure quiz Masthead.tsx into two-row nav** [improve]

- **Intent:** Split the current single `<div className="flex items-center justify-between mt-2 ...">` block into two blocks: (1) a row with `formatDateline()` on the left and a `NavDropdown` + mobile Sheet trigger on the right; (2) a `<nav>` with only the 6 internal TanStack `Link` items, visible `md:flex` below the separator. In the mobile Sheet, add a `<p className="kicker ...">Other Sites</p>` label before the cross-app `<a>` links.
- **References:** `frontend/apps/quiz-web-app/src/components/layout/Masthead.tsx:1` (add `NavDropdown` import) · `:15-22` (`navItems` unchanged) · `:41-67` (replace the single nav row block) · `:85-111` (mobile Sheet — add section divider before cross-app links)
- **Depends-on:** G1.O1.P1.S2
- **Technique:** parallel-change — new rows added, old row removed, in one atomic step (small enough; single file)
- **Reversible by:** revert Masthead.tsx
- **Gates:**
  - TDD: N/A — layout change; no routing or business logic changed
  - BDD: N/A
  - Manual: desktop — confirm two visible rows; "Sites ▾" in row 1 hover-reveals Portfolio and Blog; row 2 shows Posts · Questions · Tags · My Sets · Progress · Settings with TanStack active-link styling intact. Mobile — Sheet shows internal items, then a "Other Sites" label, then Portfolio and Blog links.
  - Deliverable: `pnpm typecheck` green; browser manual check passes on both desktop and mobile viewport. Done-when: both conditions true.

---

## Dependency Graph

```
G1.O1.P1.S1  (create NavDropdown.tsx)
     │
G1.O1.P1.S2  (export from index.ts)
     │
     ├──► G1.O3.P1.S1  (portfolio SiteHeader — Sites dropdown)
     ├──► G1.O4.P1.S1  (blog SiteHeader — Sites dropdown)
     └──► G1.O5.P1.S1  (quiz Masthead — two rows + Sites dropdown)

G1.O2.P1.S1  (remove CV from portfolio SiteHeader)  ← independent
     │
G1.O2.P1.S2  (remove CV from portfolio SiteFooter)

G1.O2.P1.S1 → G1.O3.P1.S1  (logical: CV already gone before Sites dropdown step)
```

Acyclic. G1.O2 and G1.O1 are parallel; G1.O3/O4/O5 are parallel once G1.O1.P1.S2 lands.

---

## Red-Team Notes

**Riskiest step to existing behavior:** G1.O5.P1.S1 (Masthead restructure). The TanStack Router `Link` active-link styling is applied automatically by the router; if the restructuring accidentally removes the `to` prop or wraps links in a non-router element, active states silently break. The safety net is: (a) `pnpm typecheck` will catch wrong prop shapes, and (b) the manual gate explicitly calls out "TanStack active-link styling intact" as a check criterion.

**Refactor theatre avoided:** Did not rename `navItems` in Masthead.tsx, did not restructure `urls.ts`, did not refactor `isNavLinkActive` — none of these have a change-force behind them.

**Coverage theatre avoided:** No snapshot tests added for nav component markup — the components are pure presentation; a snapshot would restate the template and break on every CSS class edit.

**Pattern theatre avoided:** Did not introduce a `NavigationStrategy` pattern, a `NavConfig` registry, or a typed `NavItem` discriminated union — one dropdown shape, one flat list shape; a second variant doesn't exist yet. Did not add a DI wrapper around `siteUrls`.

**Irreversible steps:** None. Every step reverts by reverting one file or one appended export line. No database migrations, no schema changes, no network-visible API changes.

**Junior execution risk:** G1.O3.P1.S1 has the highest junior-confusion risk: the `mobileLinks` array needs to pass Blog+Quiz **without** them appearing in the desktop flat nav. The step note explicitly calls out the `crossAppLinks` array pattern and the `[...mobileLinks, ...crossAppLinks]` merge. G1.O4.P1.S1 is the same pattern; executor should follow G1.O3 as the template.