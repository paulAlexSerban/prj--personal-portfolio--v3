# Question types — critical review & phased implementation plan

**Status:** draft plan (Phase 0 docs **done** — spike, MDX guide, SRS PRD, `tools/AGENTS.md`)  
**Inputs:** [`01 spikes/types-of-questions.md`](../01%20spikes/types-of-questions.md), [`migrating-question-mdx-content.md`](../01%20spikes/migrating-question-mdx-content.md), `shared/db-schema`, `tools/mdx-ingest`, `tools/json-ingest`, product PRDs (quiz / SM-2)  
**Out of scope here:** `frontend/`, `packages/quiz-ui`, SM-2 engine implementation (referenced only where they constrain schema)

---

## Executive summary

The spike now uses **`answer_format`** + **`cognitive_style`** (see legacy mapping in the spike). The codebase still implements **one flashcard shape** (`front` + `back` MDX). Product PRDs require **SM-2 + Again/Hard/Good/Easy for all cards**; **`grading_mode: auto`** vs **`self`** distinguishes structured vs free-text review, with LLM grading deferred to v0.3+.

Recommendation: **do not create nine tables**. Use a **thin `questions` core** plus **`question_options`** (for MC/MS) and a **`payload` JSON column** for rare frontmatter fields. Authoring is **MDX only** (`publish/questions/*.mdx`); **`mdx-ingest`** parses frontmatter + stores raw explanation body for JSX/images. A **new `shared/question-contract` package** (Zod) validates parsed frontmatter at ingest. Build-time **JSON export** to `/data/questions/` is delivery for the quiz app, not an authoring format.

---

## 1. Critical review of the spike

### 1.1 The `type` field is overloaded (blocking issue)

The spike defines two top-level groupings:

| Axis                               | Values in spike                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| **Answer format**                  | `multiple_choice`, `multiple_select`, `true_false`                                    |
| **Cognitive / presentation style** | `factual_recall`, `comprehension`, `application`, `scenario`, `open_ended`, `analogy` |

But JSON examples use **`type` for both**:

- `type: "multiple_choice"` + separate `style: "factual_recall | …"`
- `type: "factual_recall"` with **no** `style` field

So `type` means “how the user answers” in some files and “what kind of thinking we test” in others. **Ingest validation, DB columns, and quiz UI cannot be generated from this consistently.**

**Required doc fix (Phase 0):** split into two explicit enums, e.g.:

- `answer_format`: `multiple_choice` \| `multiple_select` \| `true_false` \| `free_text`
- `cognitive_style`: `factual_recall` \| `comprehension` \| `application` \| `scenario` \| `open_ended` \| `analogy`

Map legacy spike names in a one-page compatibility table; do not use `type` alone.

### 1.2 Nine JSON schemas ≠ nine domain types

Several spike entries are **the same interaction model** with different pedagogy labels:

| Spike `type`                                       | Actual interaction                               | Fits current `front`/`back`?  |
| -------------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| `factual_recall`, `comprehension`, `application`   | Show prompt → user recalls → reveal model answer | Yes (classic flashcard)       |
| `scenario`, `open_ended`                           | Same, with longer rubric on back                 | Yes                           |
| `analogy`                                          | Same + extra metadata (`concept_source`, etc.)   | Yes (metadata in frontmatter) |
| `multiple_choice`, `multiple_select`, `true_false` | Structured options + machine-checkable answer    | **No**                        |

**Brutal truth:** you do not need nine tables or nine ingest pipelines. You need **at most two answer formats in storage** (`structured` vs `free_text`) and a **cognitive_style** tag for filtering/analytics.

### 1.3 SRS / SM-2 mismatch (product risk)

PRDs require SM-2 with Again / Hard / Good / Easy ([spaced repetition PRD](../product/01%20prd%20-%20feature%20requirements%20-%20spaced%20repetition%20behavior.md)). That assumes:

- One **card** = one **question slug** in `UserStats.cardStates`.
- User can judge recall quality after seeing whether they were right.

| Answer format                                      | Auto-gradable in v0.1?                       | SM-2 without extra UX?                                          |
| -------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `multiple_choice`, `multiple_select`, `true_false` | Yes                                          | Yes (if UI enforces answer before reveal)                       |
| `free_text` (all “style-only” types)               | **No** (unless exact string match — brittle) | Only with **self-grading** (user sees model answer, then rates) |

**Open-ended and scenario questions are not “flashcards” in the Anki sense** unless you accept self-graded cards. The spike does not state this; the PRDs do not either. **Decide in Phase 0** or you will build schema for content the quiz cannot run fairly.

Suggested v0.1 product cut:

| Ship in v0.1                                                                     | Defer                                                                 |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `multiple_choice`, `true_false`, `free_text` + `cognitive_style: factual_recall` | `multiple_select` (UX + partial credit ambiguity)                     |
| Self-graded `free_text` for comprehension/application                            | Auto-graded open-ended (needs LLM or rubric — out of scope)           |
|                                                                                  | `open_ended` as a distinct engine path (same as free_text + metadata) |

### 1.4 Internal inconsistencies in the spike JSON

| Issue                                                                        | Example                                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Field naming                                                                 | `concept` vs `concepts_tested` vs `concept_target` / `concept_source`     |
| `style` on MC but not on `factual_recall`                                    | Cognitive style is optional in one shape, mandatory in another            |
| `difficulty` on all types but `open_ended` only allows intermediate/advanced | Fine, but must be in shared enum + validator                              |
| `answer` type varies                                                         | string, string[], boolean — needs discriminated union per `answer_format` |
| MC answer by **exact option text**                                           | Fragile if author edits option copy; prefer stable `option_id` (Phase 2+) |

### 1.5 Authoring: MDX only (resolved)

- **Authoring:** all questions in `publish/questions/*.mdx` — frontmatter for stem/options/metadata, body for answer + rich explanation (JSX/images).
- **Implemented today:** `mdx-ingest` maps `question` → `front`, body → `back` only.
- **json-ingest** remains for `profile`, `skills`, `pages` only — **never** for questions.
- **Build export:** static `/data/questions/*.json` for quiz/PWA is generated at SSG time from the DB, not authored in the content repo.

### 1.6 What already works (do not over-credit gaps)

| Item                          | Reality                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Scanner excludes `questions/` | **Outdated.** `markdownFileScanner.ts` default pattern already includes `questions`. Update `tools/AGENTS.md`. |
| `post_slug` FK                | Implemented; slug convention `{post-slug}--{uid}` enforced in `normalise.ts`.                                  |
| Question tags                 | `question_tags` junction — good; reuse for all formats.                                                        |
| `upsertWithLockCheck`         | Requires `slug` + `locked` — any new table needs the same or a shared upsert variant.                          |

---

## 2. Current state (`shared/` + `tools/`)

### 2.1 `shared/db-schema` — `questions` table

```122:135:shared/db-schema/index.ts
export const questions = sqliteTable('questions', {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    post_slug: text('post_slug')
        .notNull()
        .references(() => posts.slug),
    front: text('front').notNull(),
    back: text('back').notNull(),
    status: text('status').notNull(),
    sync_source: text('sync_source').default('mdx'),
    locked: integer('locked', { mode: 'boolean' }).default(false),
    created_at: integer('created_at', { mode: 'timestamp' }),
    updated_at: integer('updated_at', { mode: 'timestamp' }),
});
```

**Gap:** no `answer_format`, `cognitive_style`, `difficulty`, structured options, or explanation field separate from “back”.

### 2.2 `tools/mdx-ingest`

- Maps MDX → `front` / `back` only (`normaliseQuestion`).
- Validates `question`, `status` only.
- No JSON schema, no type discrimination.

### 2.3 `tools/json-ingest`

- No scanner path for questions.
- Pattern to copy: scan → parse → validate → normalise → upsert (same task graph as MDX).

### 2.4 Build output (planned, not implemented)

Architecture targets `/data/questions/{post-slug}.json` and `_all.json`. **No exporter exists yet** in repo; schema choices must match that JSON contract.

---

## 3. Target data model (recommended)

### 3.1 Why not nine tables?

| Approach                                      | Verdict                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **9 tables** (one per spike `type`)           | High migration and ingest cost; shared columns duplicated; CMS complexity; **not justified** while row counts are in the hundreds. |
| **Single `questions` + JSON blob**            | Fast to ship; weak querying; options not FK-safe. **Acceptable for Phase 1–2 only.**                                               |
| **Core + `question_options` + typed payload** | **Recommended steady state.**                                                                                                      |

### 3.2 Steady-state schema (SQLite / Drizzle)

**Table: `questions` (core — every card)**

| Column                                        | Notes                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `id`, `slug`, `post_slug`                     | Unchanged                                                                                    |
| `status`, `sync_source`, `locked`, timestamps | Unchanged                                                                                    |
| `answer_format`                               | `multiple_choice` \| `multiple_select` \| `true_false` \| `free_text`                        |
| `cognitive_style`                             | enum from spike styles                                                                       |
| `difficulty`                                  | `beginner` \| `intermediate` \| `advanced`                                                   |
| `stem`                                        | Question text (replaces `front`; keep `front` as deprecated alias during migration)          |
| `explanation`                                 | Post-answer explanation (move out of unstructured `back`)                                    |
| `grading_mode`                                | `auto` \| `self` — derived from `answer_format` but stored for export clarity                |
| `payload`                                     | JSON text — type-specific extras: `concept`, `concepts_tested`, analogy fields, etc.         |
| `back`                                        | **Deprecated** — optional mirror of `explanation` + legacy MDX body until migration complete |

**Table: `question_options` (only for MC / multiple_select)**

| Column          | Notes                                                  |
| --------------- | ------------------------------------------------------ |
| `question_slug` | FK → `questions.slug`, ON DELETE CASCADE               |
| `option_key`    | Stable id (`a`, `b`, … or uuid) — **not** display text |
| `sort_order`    | int                                                    |
| `label`         | Display text                                           |
| `is_correct`    | boolean                                                |

**Table: `question_concepts` (optional Phase 4+)**

Only if you need SQL queries like “all questions touching concept X”. Otherwise keep `concepts_tested` inside `payload`.

**Do not add** separate tables for `factual_recall` vs `comprehension` — that is `cognitive_style` on the same row.

### 3.3 MDX authoring file (content repo)

One file per question: `publish/questions/{post-slug}--{uid}.mdx`. Frontmatter holds stem, options, and metadata; the MDX body holds **Answer** (free_text) and **Explanation** (all formats, with JSX/images). See [types-of-questions](../01%20spikes/types-of-questions.md). `post_slug` derived from filename (ADR cross-surface FK).

### 3.4 New shared package

Add `@prj--personal-portfolio--v3/shared--question-contract`:

- Zod schemas per `answer_format` (discriminated union).
- Inferred TS types exported to ingest tools and (later) Astro/quiz-ui.
- **Single source of truth** — validates MDX frontmatter after `gray-matter` parse; MDX examples in the spike are authoritative for authors.

---

## 4. Phased implementation

Each phase should land with: migration (if any), ingest support, tests on validators, and doc updates (`shared/AGENTS.md`, `tools/AGENTS.md`, `database/AGENTS.md`).

---

### Phase 0 — Taxonomy & decisions (docs only, ~1 day) ✅ largely complete

**Goal:** unblock schema and ingest design without code churn.

| Deliverable                                                             | Location                                                                | Status  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| Fix spike: `answer_format` + `cognitive_style`; remove ambiguous `type` | `01 spikes/types-of-questions.md`                                       | Done    |
| MDX author migration guide                                              | `01 spikes/migrating-question-mdx-content.md`                           | Done    |
| SRS PRD: SM-2 + auto/self grading                                       | `product/01 prd - feature requirements - spaced repetition behavior.md` | Done    |
| Widget / web app PRD cross-links                                        | `product/…flashcard…`                                                   | Done    |
| Align `tools/AGENTS.md`                                                 | `tools/AGENTS.md`                                                       | Done    |
| Authoring: **MDX only** (no JSON question files in content repo)        | spike + MDX guide + this plan                                           | Done    |
| ADR: question storage & grading                                         | `architectural-decision-log/drafts/adr-question-model.md`               | Pending |
| Update architecture MDX “Question” section                              | `01 architecture document.md`                                           | Pending |

**Exit criteria:** explicit list of **v0.1 answer formats** and grading behaviour; no open “nine types” ambiguity. **Met** for taxonomy; ADR optional before Phase 1 code.

---

### Phase 1 — Contract package + DB core columns (~2–3 days)

**`shared/`**

1. Create `shared/question-contract/` with Zod + discriminated unions for v0.1 formats.
2. Extend `questions` in `shared/db-schema/index.ts`:
   - `answer_format`, `cognitive_style`, `difficulty`, `stem`, `explanation`, `grading_mode`, `payload` (text JSON).
   - Keep `front`/`back` nullable or populated from `stem`/`explanation` for backward compatibility.
3. `pnpm db:generate` → migration `0004_…`.

**`tools/`**

- None yet (schema only).

**Tests**

- Unit tests: parse valid/invalid fixtures per format.

**Exit criteria:** migrated empty DB accepts new columns; old rows still readable; types importable from ingest.

---

### Phase 2 — `question_options` + mdx-ingest for structured types (~3–5 days)

**`shared/`**

- Add `question_options` table + types.

**`tools/mdx-ingest`**

1. Extend `validateParsedFiles` — required fields per `answer_format` (e.g. `options` + `correct_option_keys` for MC).
2. Normaliser: parse frontmatter with Zod from `shared--question-contract`; map options → `question_options`; store raw MDX body as explanation.
3. Upsert: parent question then options (delete-and-replace per slug); respect `locked`.

**`tools/json-ingest`**

- No question changes.

**Exit criteria:** sample MC + T/F MDX fixtures round-trip into `content.db`; dry-run test.

---

### Phase 3 — MDX legacy bridge + free-text types (~2 days)

**`tools/mdx-ingest`**

- `normaliseQuestion`: set `answer_format: 'free_text'`, `grading_mode: 'self'`, `cognitive_style` from optional frontmatter (default `factual_recall`), map `question` → `stem`, body → `explanation` (+ optional legacy `back`).
- Extend validation: allow optional `answer_format` / `cognitive_style` in frontmatter for new MDX.

**Exit criteria:** existing MDX flashcards still ingest with defaults (`free_text`, `factual_recall`); new frontmatter fields persisted.

---

### Phase 4 — Build-time JSON export (~2–3 days)

**Not in `tools/` ingest — Astro build or small `tools/question-export` CLI**

- Query `questions` + `question_options` + `question_tags`.
- Emit `/data/questions/{post_slug}.json` matching contract consumed by quiz-ui.
- Emit `_all.json` for mobile offline bundle (per architecture doc).

**`shared/`**

- Reuse `shared--question-contract` for export shape (do not invent a third schema).

**Exit criteria:** widget can load one post’s questions without reading SQLite in the browser.

---

### Phase 5 — `multiple_select` + richer metadata (~2 days)

- Extend Zod + `question_options` (multiple `is_correct`).
- UI spec for partial credit (recommend: **no partial credit in v0.1** — all-or-nothing).
- `payload` fields for `concepts_tested`, analogy metadata.

**Exit criteria:** spike’s `multiple_select` example validates and exports.

---

### Phase 6 — CMS, analytics, cleanup (later)

- Directus collection aligned with `questions` + options.
- Drop `front`/`back` columns (breaking migration) once normaliser uses `stem` + dedicated explanation storage.
- Optional `question_concepts` junction if SQL reporting needs it.

---

## 5. Work breakdown by package

| Package / area                    | Phase 0 | 1   | 2              | 3   | 4   | 5   |
| --------------------------------- | ------- | --- | -------------- | --- | --- | --- |
| `01 spikes/types-of-questions.md` | ✓       |     |                |     |     |     |
| `shared/question-contract` (new)  |         | ✓   | ✓              | ✓   | ✓   | ✓   |
| `shared/db-schema`                |         | ✓   | ✓              |     |     | ✓   |
| `shared/db` upsert                |         |     | ✓ (child rows) |     |     |     |
| `tools/json-ingest`               |         |     | —              |     |     |     |
| `tools/mdx-ingest`                |         | ✓   | ✓              | ✓   |     | ✓   |
| `database/migrations`             |         | ✓   | ✓              |     |     | ✓   |
| `frontend` / quiz-ui              |         |     |                |     | ✓   | ✓   |

---

## 6. Risks (honest)

| Risk                                           | Severity | Mitigation                                                         |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Building all nine spike types before quiz UI   | High     | Phase 0 scope cut; ship MC + T/F + self-graded free text first     |
| Exact-text MC answers in spike                 | Medium   | Introduce `option_key` in Phase 2; never match on label text in UI |
| Rich explanation MDX in quiz UI                | Medium   | Store raw body in DB; compile MDX at SSG/quiz build, not in ingest |
| `upsertWithLockCheck` assumes one row per slug | Low      | Options table uses composite PK; sync deletes children on update   |
| SM-2 on self-graded cards feels unlike Anki    | Medium   | Product copy + UI: “Reveal answer” then rate; document in quiz PRD |
| No `02 plans/` culture yet                     | Low      | This file; link from `_docs/AGENTS.md` implementation status table |

---

## 7. Immediate next actions

1. **Phase 1:** scaffold `shared/question-contract` + migration; extend **mdx-ingest** normaliser.
2. Optional ADR for question model (reject nine-table layout).
3. Update architecture doc § Question to reference spike + MDX migration guide.

---

## 8. References

- Spike: [`01 spikes/types-of-questions.md`](../01%20spikes/types-of-questions.md)
- Question MDX convention: [architecture doc § Question](../architectural-knowledge-management/01%20architecture%20document.md)
- FK from filename: [draft ADR cross-surface FK](../architectural-knowledge-management/architectural-decision-log/_drafts/adr-000--cross-surface-foreign-key.md)
- Quiz JSON delivery: [draft ADR quiz delivery targets](../architectural-knowledge-management/architectural-decision-log/_drafts/adr-000--quiz-delivery-targets.md)
- Current schema: `shared/db-schema/index.ts`
- MDX normalise: `tools/mdx-ingest/src/helpers/normalise.ts`
