# Question MDX authoring guide

Guide for the **content repository** (`content--paulserban.eu`). All question types — including multiple choice and true/false — are **`publish/questions/*.mdx` only**. No JSON question files.

**Why MDX only:** explanations can use **JSX**, custom components, and **images**; the ingest pipeline stores the raw body and the quiz/blog build compiles it at render time.

See also: [types-of-questions](./types-of-questions.md).

---

## File rules (unchanged)

- **Path:** `publish/questions/{post-slug}--{uid}.mdx`
- **Parent post** must exist under `publish/posts/` (or scope you adopt later).
- **Required frontmatter:** `question`, `status`
- **Recommended:** `answer_format`, `cognitive_style`, `difficulty`

---

## Legacy files (no urgent change)

If you omit `answer_format`, ingest treats the card as:

| Field | Default |
|-------|---------|
| `answer_format` | `free_text` |
| `cognitive_style` | `factual_recall` |
| `grading_mode` | `self` |

```mdx
---
question: "Why is parallel execution described as a feature?"
status: draft
tags:
  - Algorithms
---

## Answer

Your model answer.

## Explanation

Why this matters — plain Markdown is fine; add JSX when you need it.
```

---

## `free_text` (most existing content)

```mdx
---
question: "Your stem here"
status: published
answer_format: free_text
cognitive_style: comprehension
difficulty: intermediate
concept: "Topological sort"
tags:
  - Algorithms
---

## Answer

Short model answer shown after recall.

## Explanation

Rich content: **bold**, lists, images, imported components.

![Diagram](./images/topo-sort-levels.png)

<Callout>Edge case: cyclic graphs have no topological sort.</Callout>
```

| Section | Purpose |
|---------|---------|
| **Answer** | What the user compares against after self-graded recall |
| **Explanation** | Deeper context; use MDX/JSX freely |

---

## `multiple_choice` / `multiple_select`

Put **options and correct keys in frontmatter**; put **why** in the body as Explanation.

```mdx
---
question: "Which algorithm detects cycles?"
status: published
answer_format: multiple_choice
cognitive_style: factual_recall
difficulty: intermediate
options:
  - key: a
    label: BFS only
  - key: b
    label: DFS with back-edge detection
  - key: c
    label: Dijkstra
correct_option_keys:
  - b
---

## Explanation

Why **b** is correct and why each distractor fails — diagrams and JSX welcome here.
```

For **multiple_select**, use `answer_format: multiple_select` and list every correct `key` under `correct_option_keys`.

---

## `true_false`

```mdx
---
question: "Every directed graph has a topological sort."
status: published
answer_format: true_false
cognitive_style: application
difficulty: beginner
answer: false
---

## Explanation

Only **DAGs** have a topological ordering. For false statements, state the corrected claim here.
```

---

## Optional frontmatter by cognitive style

| `cognitive_style` | Extra frontmatter |
|-------------------|-------------------|
| `scenario`, `open_ended` | `concepts_tested: [ ... ]` |
| `analogy` | `concept_target`, `concept_source` |
| others | `concept` (single string) usually enough |

---

## Checklist

1. Filename `{post-slug}--{uid}.mdx`; parent post exists.
2. `question` + `status` set.
3. `answer_format` set explicitly for new structured cards.
4. MC/MS: `options` + `correct_option_keys` in frontmatter.
5. T/F: `answer: true` or `answer: false` in frontmatter.
6. Body: **Explanation** for auto-graded types; **Answer** + **Explanation** for `free_text`.
7. Images: use relative paths from the MDX file (same as posts).

---

## What not to do

| Avoid | Instead |
|-------|---------|
| `publish/questions/*.json` | One `.mdx` per card |
| Long explanation in frontmatter | Explanation in the MDX body |
| Duplicate slug across files | One file per `slug` |

---

## Pipeline status (app monorepo)

Today `mdx-ingest` only maps `question` → `front` and body → `back`. Fields like `answer_format` and `options` are **documented and safe to author now**; ingest and DB columns will follow [implementation plan](../02%20plans/question-types-implementation-plan.md) Phase 1+.

---

## Related

- [types-of-questions.md](./types-of-questions.md)
- [question-types-implementation-plan.md](../02%20plans/question-types-implementation-plan.md)
- Architecture doc § Question
