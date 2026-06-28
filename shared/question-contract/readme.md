# Question Contract (`shared/question-contract/`)

The **validation and normalization rules for flashcard questions** — the
authoritative definition of what a valid question looks like, shared by the ingest
pipeline and the export. Built on Zod.

**Package:** `@prj--personal-portfolio--v3/shared--question-contract`

## Why it exists

Questions are authored as MDX frontmatter. Before a question can be trusted in the
database (and later shipped to the app), its frontmatter must be checked: is the
`answer_format` valid? Do multiple-choice options exist and do the
`correct_option_keys` actually point at real options? This package is the one place
that answers those questions, so the ingest tool and the export never disagree on
the rules.

## The vocabulary it defines

| Field                    | Allowed values                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `answer_format`          | `multiple_choice`, `multiple_select`, `true_false`, `free_text`                       |
| `cognitive_style`        | `factual_recall`, `comprehension`, `application`, `scenario`, `open_ended`, `analogy` |
| `difficulty`             | `beginner`, `intermediate`, `advanced`                                                |
| `grading_mode` (derived) | `auto` (MC/MS/TF) or `self` (free_text)                                               |

## API

```ts
import { parseQuestionFrontmatter, deriveGradingMode } from '@prj--personal-portfolio--v3/shared--question-contract';

const result = parseQuestionFrontmatter(frontmatter);
if (!result.ok) throw new Error(result.error); // human-readable validation message
```

| Export                              | Role                                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseQuestionFrontmatter(fm)`      | Validate + normalize frontmatter (a discriminated union by `answer_format`). Returns `{ ok: true, data }` or `{ ok: false, error }`. Applies defaults and cross-checks correct-key references. |
| `deriveGradingMode(answerFormat)`   | `free_text → 'self'`, everything else `→ 'auto'`.                                                                                                                                              |
| `buildQuestionPayload(fm)`          | Serialize the extra fields (`concept`, `concepts_tested`, true/false `answer`, …) into the JSON `payload` column, or `null` if empty.                                                          |
| `buildQuestionOptionRows(slug, fm)` | Turn MC/MS options into `question_options` rows with `sort_order` + `is_correct`.                                                                                                              |
| Enums + types                       | `ANSWER_FORMATS`, `COGNITIVE_STYLES`, `DIFFICULTIES`, `GRADING_MODES`, `ParsedQuestionFrontmatter`, etc.                                                                                       |

## Validation rules worth knowing

- `multiple_choice` requires **exactly one** correct key; `multiple_select` requires ≥1.
- Every `correct_option_keys` entry must match an actual `options[].key` (else a clear error).
- Missing `answer_format`/`cognitive_style`/`difficulty` default to `free_text`/`factual_recall`/`intermediate`.

## How to run it

```bash
pnpm --filter @prj--personal-portfolio--v3/shared--question-contract test
```

## Where it sits

- **Depends on:** `zod` only.
- **Consumed by:** `tools/mdx-ingest` (validate + normalize on ingest); `shared--quiz-export` (reuses the types + `deriveGradingMode`).

## Related docs

- `shared/AGENTS.md` — all shared packages.
- `_docs/01 spikes/types-of-questions.md` — the question taxonomy and authoring formats.
