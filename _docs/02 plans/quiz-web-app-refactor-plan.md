# Quiz Web App — refactor & data-export plan (phased, gated)

**Status:** ✅ complete — all phases (0–7) shipped. The POC is gone; the app is
CSR-only, zustand-managed, and fed by `shared/quiz-export` JSON. This doc is now a
historical record of *why* and *how*; for current behaviour read the app
[`readme.md`](../../frontend/apps/quiz-web-app/readme.md) and
[`AGENTS.md`](../../frontend/apps/quiz-web-app/AGENTS.md), and `shared/AGENTS.md`
for the export module. Follow-on work lives in
[`quiz-web-app-enhancements-plan.md`](./quiz-web-app-enhancements-plan.md).

**Outcome in one line:** a Lovable SSR POC (`ink-and-recall`, bun) became a strict
CSR React 19 app (`frontend/apps/quiz-web-app`, pnpm) plus a new
`shared/quiz-export` package that turns `content.db` into static JSON.

**Inputs (at planning time):**
[`frontend/poc/ink-and-recall/`](../../frontend/poc/ink-and-recall) (Lovable POC),
[`product/01 prd - feature requirements - flascard quiz web app.md`](../product/01%20prd%20-%20feature%20requirements%20-%20flascard%20quiz%20web%20app.md),
[`02 plans/question-types-implementation-plan.md`](./question-types-implementation-plan.md) (esp. **Phase 4 — build-time JSON export**),
[`shared/db-schema`](../../shared/db-schema), [`shared/db`](../../shared/db), [`shared/question-contract`](../../shared/question-contract),
[quiz delivery targets ADR draft](../architectural-knowledge-management/architectural-decision-log/_drafts/adr-000--quiz-delivery-targets.md).

---

## 1. Goal

Two coupled deliverables:

1. **`shared/quiz-export`** — a new shared module that reads `database/output/content.db`, extracts flashcard questions (`questions` + `question_options` + `question_tags` joined to `posts`), and **exposes them as static JSON** matching a versioned contract, for consumption by browser/PWA surfaces.
2. **`frontend/apps/quiz-web-app`** — the Lovable POC at `frontend/poc/ink-and-recall/` **refactored into a strict CSR React app**:
   - **No SSR** (drop TanStack Start, nitro, cloudflare server entry, `server.ts`/`start.ts`).
   - **No Lovable references** (drop `@lovable.dev/*`, `lovable-error-reporting.ts`, Lovable meta/branding, `componentTagger`, `.lovable/`).
   - **Zustand for state management** (already in the POC; formalise content vs. user-progress separation).
   - Consumes the JSON from `shared/quiz-export` instead of hardcoded seed data.

### Non-goals (this plan)

- Mobile app (Capacitor) — only keep the door open via `_all.json`.
- Blog quiz **widget** (`packages/quiz-ui`) — separate surface.
- LLM grading, `multiple_select` partial credit, new cognitive-style engines (defer per question-types plan §1.3, §5).
- Schema changes to `questions` (the export consumes the schema as-is).

---

## 2. Current-state findings (why each phase exists)

| Area             | Finding                                                                                                                                                                                     | Consequence                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Runtime          | POC is **TanStack Start SSR** via `@lovable.dev/vite-tanstack-config`, `nitro` (cloudflare target), `src/server.ts`, `src/start.ts`.                                                        | Must replace build + entry with CSR-only Vite.                                                                |
| Routing          | File-based routing, `routeTree.gen.ts`, `__root.tsx` ships `<html>/<head>/<Scripts>/<HeadContent>` shell.                                                                                   | Keep TanStack Router in **CSR mode** (recommended) — route components mostly survive; shell/SSR bits removed. |
| State            | Already **zustand 5 + `persist`** (`the-review-state` localStorage key). Generic `Deck`/`Card` model.                                                                                       | Keep zustand; split **content (from JSON)** from **user progress (localStorage)**.                            |
| Domain           | Decks are user-created; cards are `{front, back}`; seeded from `utils/seed.ts`.                                                                                                             | Re-map: **deck ⇒ post (study set)**, **card ⇒ question**; replace seed with JSON.                             |
| SM-2             | Complete engine: `algorithms/sm2.ts`, `queue.ts`, `intervals.ts`; review logs, sessions, stats.                                                                                             | Reuse as-is; satisfies WEB-06, WEB-13.                                                                        |
| Lovable          | References in `vite.config.ts`, `package.json`, `server.ts`, `start.ts`, `__root.tsx` (meta), `lib/lovable-error-reporting.ts`, `lib/api/example.functions.ts`, `bunfig.toml`, `.lovable/`. | Enumerated removal list (Phase 2 + Phase 7).                                                                  |
| Package mgr      | POC uses **bun** (`bun.lock`, `bunfig.toml`); monorepo uses **pnpm**.                                                                                                                       | New app is a **pnpm workspace member**.                                                                       |
| Workspace globs  | `pnpm-workspace.yaml` uses `frontend/*`, which **does not match** `frontend/apps/quiz-web-app` (confirmed: 0 `frontend/*/package.json`).                                                    | Must add `frontend/apps/*` (and optionally `frontend/poc/*`) to `pnpm-workspace.yaml`.                        |
| Export           | JSON export is **Phase 4 of question-types plan** and **does not exist yet**.                                                                                                               | Build it as `shared/quiz-export` (user requirement: live in `shared/`).                                       |
| Question formats | DB supports `multiple_choice`/`multiple_select`/`true_false`/`free_text`; POC UI only renders `front`/`back` HTML + cloze.                                                                  | New study UI must branch on `answer_format`; v0.1 cut = MC + TF + self-graded free_text.                      |

---

## 3. Key decisions (lock at Phase 0 gate)

| #   | Decision                   | Recommendation                                                                                                                                                            | Alternatives                                              |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| D1  | Routing library            | **Keep `@tanstack/react-router` in CSR-only mode** (browser history, `RouterProvider` in `main.tsx`, file-based routes via `@tanstack/router-plugin/vite`). Lowest churn. | React Router v7 (bigger rewrite); hand-rolled.            |
| D2  | Content ⇄ user-state model | **deck = post (study set)**, **card = question**; `front=stem`, `back=explanation/answer`. User progress keyed by **question slug** (stable), never by random uid.        | Keep generic decks + import JSON as one deck.             |
| D3  | JSON delivery shape        | `posts.json` (index) + `questions/{post_slug}.json` (per-post) + `_all.json` (offline bundle). Served from app `public/data/`.                                            | Single bundle only; embedded import.                      |
| D4  | Export module name         | `@prj--personal-portfolio--v3/shared--quiz-export` exposing a **library function** + a thin **CLI** (`start` script) that writes files.                                   | `tools/question-export` (rejected: user wants `shared/`). |
| D5  | Correct-answer exposure    | Ship `is_correct`/correct keys to the client (auto-grading is client-side; acceptable for v0.1 no-backend).                                                               | Hash answers (overkill for v0.1).                         |
| D6  | Contract source of truth   | Reuse/extend `shared--question-contract` types; do **not** invent a third schema.                                                                                         | New zod schema in export pkg.                             |
| D7  | App new vs. in-place       | **Build fresh in `frontend/apps/quiz-web-app`, port from POC**; keep POC until Phase 7 cutover.                                                                           | Mutate POC in place (risky, mixes bun/pnpm).              |

> **Gate 0 requires explicit sign-off on D1–D7.** Everything downstream assumes them.

---

## 4. Target JSON contract (D3 / D6)

Output root: `frontend/apps/quiz-web-app/public/data/` (overridable via env).

```jsonc
// data/posts.json — study-set index (only posts that have ≥1 published question)
{
  "version": 1,
  "generatedAt": "<ISO>",
  "posts": [
    { "slug": "react-hooks", "title": "React Hooks", "type": "post",
      "excerpt": "...", "questionCount": 12, "tags": ["react"] }
  ]
}
```

```jsonc
// data/questions/<post_slug>.json — one file per post
{
  "version": 1,
  "postSlug": "react-hooks",
  "questions": [
    {
      "slug": "react-hooks--abc123",
      "postSlug": "react-hooks",
      "answerFormat": "multiple_choice",      // multiple_choice|multiple_select|true_false|free_text
      "cognitiveStyle": "factual_recall",
      "difficulty": "intermediate",
      "gradingMode": "auto",                  // auto|self (derived)
      "stem": "Which hook ...?",
      "explanation": "<raw MDX/HTML answer body>",
      "payload": { "...": "parsed JSON or null" },
      "options": [                            // MC/MS only; [] otherwise
        { "key": "a", "label": "useState", "isCorrect": true, "sortOrder": 0 }
      ],
      "answer": true,                          // true_false only
      "tags": ["react", "hooks"]
    }
  ]
}
```

`data/_all.json` = `{ version, generatedAt, posts, questions }` (every post + every question) for the offline PWA bundle / future mobile.

**Rules:** only `status` published rows; exclude `locked`-CMS rows per existing convention if applicable; `is_correct` included (D5); `explanation` is raw `back` (MDX/HTML not compiled in export — same policy as ingest).

---

## 5. Phased, gated plan

> Each phase has **Entry gate → Work → Exit gate (acceptance)**. Do not start a phase until the prior **Exit gate** is green. Every phase ends with `pnpm typecheck` (+ `pnpm test` where tests exist) passing for touched packages.

### Phase 0 — Decisions, workspace wiring, scaffold

**Entry gate:** this plan reviewed.

**Work**
1. Sign off **D1–D7** (§3).
2. Fix `pnpm-workspace.yaml`: add `frontend/apps/*` (and `frontend/poc/*` if the POC should be a member during transition).
3. Create empty `frontend/apps/quiz-web-app/package.json` (pnpm, `type: module`, name `@prj--personal-portfolio--v3/frontend--quiz-web-app`) and confirm `pnpm install` links it.
4. Decide JSON output location + env overrides (`QUIZ_DATA_OUT`, `DATABASE_PATH`).

**Exit gate (G0)**
- `pnpm -w install` recognises the new package (`pnpm ls -r` shows it).
- D1–D7 recorded in this doc / an ADR draft.

**Rollback:** revert workspace YAML + delete scaffold dir.

---

### Phase 1 — `shared/quiz-export` module (DB → JSON)

**Entry gate:** G0; `content.db` exists with at least sample questions (run ingest if empty).

**Work**
1. New package `shared/quiz-export/` (`@prj--personal-portfolio--v3/shared--quiz-export`):
   - deps: `shared--db`, `shared--db-schema`, `shared--question-contract`, `drizzle-orm`; dev: `better-sqlite3` types, `vitest`.
   - `src/contract.ts` — exported TS types + (optional) zod for the §4 shapes, derived from `question-contract`.
   - `src/export.ts` — `buildQuizData(db): QuizData` (pure): joins `questions`→`posts`, attaches `question_options` (ordered by `sort_order`), `question_tags`, parses `payload`, derives `gradingMode` via `deriveGradingMode`.
   - `src/write.ts` — `writeQuizJson(data, outDir)` → `posts.json`, `questions/*.json`, `_all.json`.
   - `src/index.ts` — library exports.
   - `src/cli.ts` + `start` script — open connection (`openConnection`), run `buildQuizData`, `writeQuizJson`; env: `DATABASE_PATH`, `QUIZ_DATA_OUT`; `--dry-run`.
2. Unit tests (vitest) with an in-memory/temp SQLite fixture covering each `answer_format`, options ordering, tag attachment, `free_text` with empty options.
3. Update `shared/AGENTS.md` (new package) — describe role + API.

**Exit gate (G1)**
- `pnpm --filter @prj--personal-portfolio--v3/shared--quiz-export test` green.
- Running the CLI against `content.db` produces valid `posts.json` + per-post files + `_all.json`; every file parses against the contract; counts match `SELECT COUNT(*)`.
- `--dry-run` writes nothing.

**Rollback:** delete `shared/quiz-export/`; no other package depends on it yet.

---

### Phase 2 — CSR app skeleton (strip SSR + Lovable, app boots blank)

**Entry gate:** G0 (G1 not required — uses fixture JSON until Phase 3 wiring).

**Work**
1. In `frontend/apps/quiz-web-app/`, stand up a **CSR-only Vite + React 19 + TS** app:
   - `index.html` (static shell, app title — **no Lovable meta**), `src/main.tsx` (`createRoot` + `RouterProvider`), `src/router.tsx` (CSR `createRouter`, browser history, no `QueryClient`-in-context requirement).
   - `vite.config.ts`: `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, `@tanstack/router-plugin/vite` (autoCodeSplitting). **Remove** `@lovable.dev/vite-tanstack-config`, `tanstackStart`, `nitro`.
   - `tsconfig.json`, `eslint.config.js` (de-Lovable), `.prettierrc`.
2. **Do NOT port** (SSR/Lovable): `src/server.ts`, `src/start.ts`, `src/lib/lovable-error-reporting.ts`, `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `src/lib/config.server.ts`, `src/lib/api/example.functions.ts`, `bunfig.toml`, `bun.lock`, `.lovable/`.
3. Port `src/styles.css`, `components/ui/*` (shadcn), `lib/utils.ts`, `hooks/use-mobile.tsx` as-is.
4. Rewrite `routes/__root.tsx`: drop `<html>/<head>/<Scripts>/<HeadContent>`, `shellComponent`, Lovable meta and `reportLovableError`; keep `<Outlet/>`, NotFound, a plain `ErrorComponent` (console-only). Replace per-route `head()` meta with a small client-side title helper (or drop).
5. Remove TanStack Start / nitro / cloudflare / Lovable from `package.json`; keep React, zustand, TanStack Router, Tailwind, Radix, date-fns, lucide, etc. Add `@tanstack/router-plugin`.

**Exit gate (G2)**
- `pnpm --filter ...quiz-web-app dev` serves a blank routed app (CSR) with **no SSR** and **no network/Lovable** calls.
- `pnpm --filter ...quiz-web-app build` produces a static `dist/` (client-only; no server bundle, no nitro output).
- `rg -i "lovable|tanstack/react-start|nitro|server-entry"` over `src/` + config = **0 hits**.
- `pnpm typecheck` green for the app.

**Rollback:** app is isolated; delete `frontend/apps/quiz-web-app/src` additions.

---

### Phase 3 — State layer: content (JSON) vs. user progress (zustand)

**Entry gate:** G1 + G2.

**Work**
1. **Content store/loader** (read-only): `src/data/loadQuizData.ts` fetches `/data/posts.json` and lazily `/data/questions/<slug>.json`; types imported from `shared--quiz-export` contract. (Reuse the published contract types — no re-declaration.)
2. **User-progress store** (zustand + `persist`, key e.g. `quiz-web-app:v1`) — refactor POC `store/`:
   - State keyed by **question slug** (D2): `cardStates: Record<questionSlug, CardState>` (SM-2 fields), `addedPosts: string[]`, `ignored: Set<string>`/map, `reviewLogs`, `studySessions`, `settings`.
   - Actions: `addPost(slug)` (additive — never resets existing card states; WEB-04), `removePost(slug)` (keeps progress; WEB-05), `reviewCard(slug, rating, ms)`, `ignoreQuestion(slug)` (WEB-08), `resetPost(slug)`/`resetAll` (WEB-12), session start/end.
   - **Decouple from content:** card SM-2 state lives here; question text/options come from the content loader at render time (join by slug).
3. Keep `algorithms/sm2.ts`, `queue.ts`, `intervals.ts`, `utils/dates.ts` (port unchanged). Adapt `buildQueue` to operate on `(addedPosts → questions) × cardStates`.
4. Migration/seed shim: `seedIfEmpty` removed; first run = empty study set (browse to add).

**Exit gate (G3)**
- Unit tests: `addPost` is additive; `removePost` preserves `cardStates`; `reviewCard` advances SM-2 by slug; `ignoreQuestion` excludes from queue.
- Manual: load app, progress persists across reload in localStorage under the new key.
- `pnpm typecheck` + store tests green.

**Rollback:** revert store; Phase 2 skeleton still boots.

---

### Phase 4 — Browse & study-set management UI (WEB-02..05)

**Entry gate:** G3.

**Work**
1. Routes (CSR, ported/renamed from POC deck routes):
   - `/` — **Browse posts** (from `posts.json`) with “Add to study set” / “Remove”; show `questionCount`, added state. (Replaces POC “Your Decks”.)
   - `/sets` or reuse `/` — list of **added** study sets with per-post stats (total / due / new) via `getDeckStats`-equivalent computed over slugs.
   - `/sets/$postSlug` — browse questions in a set (read-only list), remove set, reset progress.
   - Remove POC `decks.new`, `decks.$deckId.add`, `cards.$cardId.edit` (no user-authored cards — content is read-only from DB). Keep `import-export`/`settings`/`stats` (adapt).
2. Wire `addPost`/`removePost`; lazy-load that post’s `questions/<slug>.json` on add.

**Exit gate (G4)**
- Browsing lists posts from JSON; adding a post makes its questions appear as cards; removing keeps progress (verified by re-adding → states intact).
- `pnpm typecheck` + lint green.

**Rollback:** route-scoped; revert new route files.

---

### Phase 5 — Study session, SM-2 ratings, question formats, progress (WEB-06,07,08,13)

**Entry gate:** G4.

**Work**
1. `/sets/$postSlug/study` (+ optional global) — port `decks.$deckId.study.tsx`:
   - Reveal → rate **Again/Hard/Good/Easy** (SM-2), keyboard shortcuts, session stats, end screen.
2. **Question renderer** branching on `answerFormat` (new — POC only had front/back):
   - `free_text` → stem → reveal `explanation` → **self-grade** (`gradingMode: self`) → SM-2 rating. (Reuse `CardRenderer` for cloze/HTML; drop its SSR `document===undefined` guard.)
   - `multiple_choice` / `true_false` → interactive answer → **auto-grade** (`gradingMode: auto`) using `isCorrect`/`answer` → show explanation → SM-2 rating (enforce answer-before-reveal).
   - `multiple_select` → **defer** (out of scope) or all-or-nothing if cheap; gate decides.
3. **Progress screen** (`/stats` adapt): total cards, due today, upcoming review schedule across added sets (WEB-07).
4. **Ignore** action in study + browse (WEB-08) → excluded from all queues.

**Exit gate (G5)**
- End-to-end: add post → study → MC auto-graded, TF auto-graded, free_text self-graded → SM-2 schedules next due correctly; ignored questions never reappear; progress screen totals match.
- `pnpm typecheck` + lint + any component tests green.

**Rollback:** revert study route + renderer; Phase 4 browse still usable.

---

### Phase 6 — PWA / offline, study-all, reset (WEB-10,11,12) — ✅ DONE

**Entry gate:** G5.

> **Status: implemented.** `vite-plugin-pwa` (autoUpdate) precaches the app shell +
> `posts.json`/`tags.json`; per-post/per-tag question files are runtime-cached
> stale-while-revalidate (`quiz-data` cache). Study-all (`/study`) runs a global
> queue across all added sets; per-post reset (`resetPost`) and global reset
> (`resetAll`) are wired with confirm dialogs. Build pipeline documented in the
> app `readme.md`. `vite build` emits the service worker + PWA assets.

**Work**
1. PWA: add `vite-plugin-pwa`; precache app shell + `posts.json`; runtime-cache `questions/*.json` (stale-while-revalidate); optionally preload `_all.json` for full offline (WEB-10).
2. **Study all due** across added sets (WEB-11) — global queue over all `addedPosts`.
3. **Reset** per-post / global progress (WEB-12) wired to store actions + confirm dialog.
4. Build pipeline doc: `ingest → shared--quiz-export → copy/emit to app public/data → quiz build`.

**Exit gate (G6)**
- Lighthouse PWA installable; app loads & runs a session **offline** after first visit.
- Study-all queue works; reset clears the right scope.
- `pnpm --filter ...quiz-web-app build` succeeds with PWA assets.

**Rollback:** disable PWA plugin (app still works online).

---

### Phase 7 — Cutover, cleanup, docs — ✅ DONE

**Entry gate:** G6.

**Work**
1. Remove POC `frontend/poc/ink-and-recall/` once parity confirmed. — ✅ done (`git rm -r` of 95 tracked files — no nested `.git`/submodule — plus leftover `node_modules`).
2. Remove `frontend/poc/*` from workspace globs. — ✅ done; `pnpm install` reports 11 workspace projects (was 12), 106 packages pruned.
3. Add `frontend/apps/quiz-web-app/AGENTS.md` and a real `readme.md`; update `_docs/AGENTS.md` implementation-status table (quiz web app + JSON export → Implemented). — ✅ done.
4. Cross-link: mark **question-types plan Phase 4** satisfied by `shared/quiz-export`; update `tools/AGENTS.md` note that export now lives in `shared/`. — ✅ done.
5. Root scripts: ensure `pnpm -r start`/`build`/`typecheck`/`test` include new packages; document build order. — ✅ `pnpm -r test`/`start` cover new packages; root `tsc -b` references `shared/quiz-export` + `shared/quiz-markdown`; the app is typechecked per-filter (TS 5.x + Vite types) — documented in the app `AGENTS.md`. Build order documented in the app `readme.md`.

**Exit gate (G7) — met**
- ✅ Root `tsc -b` + app typecheck green; `pnpm -r test` green (quiz-markdown 7, quiz-export 16, app 78); app `vite build` emits PWA assets.
- ✅ `rg -i lovable` → 0 hits in app/shared code (only this plan doc references it historically; the POC is gone).
- ✅ App is CSR-only, zustand-managed, JSON-fed; WEB-01..13 mapped (SM-2 **and** FSRS schedulers shipped per the enhancements plan).
- ✅ Docs/AGENTS updated (`_docs/AGENTS.md`, `tools/AGENTS.md`, new app `AGENTS.md`, question-types plan P4 cross-link).

---

## 6. Requirement → phase traceability

| Req                                     | Where                        |
| --------------------------------------- | ---------------------------- |
| WEB-01 standalone URL                   | P2 (CSR build) / P6 (deploy) |
| WEB-02/03 browse posts → add questions  | P4                           |
| WEB-04 additive add                     | P3 (`addPost`) / P4          |
| WEB-05 remove keeps progress            | P3 (`removePost`) / P4       |
| WEB-06 SM-2 ratings                     | P5 (reuse engine)            |
| WEB-07 progress screen                  | P5                           |
| WEB-08 ignore questions                 | P3/P5                        |
| WEB-09 client storage every interaction | P3 (zustand persist)         |
| WEB-10 offline PWA                      | P6                           |
| WEB-11 study all due                    | P6                           |
| WEB-12 reset progress                   | P3/P6                        |
| WEB-13 auto/self grading                | P5                           |
| Data export (user req)                  | P1 (`shared/quiz-export`)    |
| CSR / no SSR / no Lovable               | P2 (+P7 audit)               |
| zustand state mgmt                      | P3                           |

---

## 7. Risks

| Risk                                                      | Sev | Mitigation                                              |
| --------------------------------------------------------- | --- | ------------------------------------------------------- |
| TanStack Router used without Start has rough edges in CSR | Med | Spike in P2 gate; React Router fallback (D1)            |
| Empty/partial `content.db` blocks P1 testing              | Med | Use vitest SQLite fixtures; run ingest for manual check |
| Re-keying card state to slugs breaks POC migration        | Low | No prod users yet; new localStorage key, no migration   |
| `multiple_select` UX ambiguity                            | Low | Deferred (P5 gate decision)                             |
| Workspace glob miss → app not linked                      | Low | Fixed + verified at G0                                  |
| Shipping correct answers to client                        | Low | Accepted for v0.1 no-backend (D5)                       |

---

## 8. Suggested package layout

```
shared/quiz-export/
  package.json            # @prj--personal-portfolio--v3/shared--quiz-export
  src/{contract,export,write,index,cli}.ts
  src/*.test.ts
frontend/apps/quiz-web-app/
  index.html              # CSR shell, no Lovable meta
  vite.config.ts          # plugin-react + tailwind + router-plugin (no Start/nitro/Lovable)
  src/main.tsx            # createRoot + RouterProvider
  src/router.tsx          # CSR createRouter
  src/data/loadQuizData.ts
  src/store/              # zustand: user progress (slug-keyed)
  src/algorithms/         # sm2, queue, intervals (ported)
  src/routes/             # browse, sets, study, stats, settings, import-export
  src/components/         # ui/*, card renderer, layout
  public/data/            # posts.json, questions/*.json, _all.json (generated)
```
