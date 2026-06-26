# Types of questions

Questions power the spaced-repetition quiz (SM-2, Again / Hard / Good / Easy). Every question is one **card** in the SRS (keyed by `slug`).

**Authoring:** all questions are **MDX** under `publish/questions/`. Frontmatter holds structured fields (stem, options, metadata); the **MDX body** holds the model answer (for `free_text`) and the **explanation** — including JSX components and images. There is no separate JSON question format in the content repo.

Two **independent** axes describe each question:

| Axis                                | Field             | Purpose                                        |
| ----------------------------------- | ----------------- | ---------------------------------------------- |
| **How the user answers**            | `answer_format`   | Interaction and whether the app can auto-grade |
| **What kind of thinking is tested** | `cognitive_style` | Pedagogy (orthogonal to format)                |

**Related docs:** [MDX authoring guide](./migrating-question-mdx-content.md) · [implementation plan](../02%20plans/question-types-implementation-plan.md) · [SRS PRD](../product/01%20prd%20-%20feature%20requirements%20-%20spaced%20repetition%20behavior.md)

---

## Answer format (`answer_format`)

| Value             | Description                              | `grading_mode`                                  |
| ----------------- | ---------------------------------------- | ----------------------------------------------- |
| `multiple_choice` | One correct option                       | `auto`                                          |
| `multiple_select` | Several correct options                  | `auto`                                          |
| `true_false`      | Declarative statement; answer is boolean | `auto`                                          |
| `free_text`       | User recalls, then reveals model answer  | `self` (LLM-assisted grading planned — see PRD) |

All formats use the **same SM-2 scheduling**. Auto-graded formats score the selection before rating; self-graded formats reveal the model answer from the body, then the user rates Again/Hard/Good/Easy.

---

## Cognitive style (`cognitive_style`)

| Value            | Description                               |
| ---------------- | ----------------------------------------- |
| `factual_recall` | Specific facts or definitions             |
| `comprehension`  | Mechanisms, relationships, “why”          |
| `application`    | Apply knowledge to a new situation        |
| `scenario`       | Real-world setup + focused question       |
| `open_ended`     | Synthesis or critical thinking            |
| `analogy`        | Map a technical concept to a familiar one |

**Example:** `answer_format: multiple_choice` + `cognitive_style: factual_recall` — not a single overloaded `type`.

---

## MDX file layout

| Part            | Role                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| **Filename**    | `{post-slug}--{uid}.mdx` → `post_slug` derived from filename            |
| **Frontmatter** | Metadata + stem + structured fields (options, `answer` for T/F, etc.)   |
| **Body**        | Model answer (`free_text` only) + rich **Explanation** (MDX/JSX/images) |

### Shared frontmatter (all questions)

| Field                               | Required    | Notes                                          |
| ----------------------------------- | ----------- | ---------------------------------------------- |
| `question`                          | yes         | Stem (alias `stem` in DB export later)         |
| `status`                            | yes         | e.g. `draft`, `published`                      |
| `answer_format`                     | yes*        | *Default `free_text` if omitted (legacy files) |
| `cognitive_style`                   | yes*        | *Default `factual_recall` if omitted           |
| `grading_mode`                      | derived     | `auto` for MC/MS/TF; `self` for `free_text`    |
| `difficulty`                        | recommended | `beginner` \| `intermediate` \| `advanced`     |
| `concept`                           | optional    | Single concept label                           |
| `concepts_tested`                   | optional    | string[] (scenario, open_ended)                |
| `concept_target` / `concept_source` | optional    | analogy                                        |
| `tags`                              | optional    | string[]                                       |

Type-specific frontmatter is listed per format below. **Explanations belong in the MDX body**, not frontmatter, so you can format them with JSX and embed images.

### `grading_mode` rules

| `answer_format`                                    | `grading_mode` | Body content                                 |
| -------------------------------------------------- | -------------- | -------------------------------------------- |
| `multiple_choice`, `multiple_select`, `true_false` | `auto`         | Explanation only (optional model answer N/A) |
| `free_text`                                        | `self`         | Answer + Explanation sections                |

---

## MDX examples by `answer_format`

### `multiple_choice`

JSON source used to generate the MDX:
```json
{
  "question": "Which algorithm detects cycles in a directed graph?",
  "status": "published",
  "answer_format": "multiple_choice",
  "cognitive_style": "factual_recall",
  "difficulty": "intermediate",
  "concept": "Graph cycle detection",
  "options": [
    { "key": "a", "label": "Breadth-first search only" },
    { "key": "b", "label": "DFS with back-edge detection" },
    { "key": "c", "label": "Dijkstra's algorithm" },
    { "key": "d", "label": "Topological sort on any graph" }
  ],
  "correct_option_keys": [ "b" ],
  "tags": [ "Graph Theory", "Cycles" ],
  "explanation": "**b** is correct: a back-edge during DFS implies a cycle."
}
```

```mdx
---
question: "Which algorithm detects cycles in a directed graph?"
status: published
answer_format: multiple_choice
cognitive_style: factual_recall
difficulty: intermediate
concept: Graph cycle detection
options:
  - key: a
    label: Breadth-first search only
  - key: b
    label: DFS with back-edge detection
  - key: c
    label: Dijkstra's algorithm
  - key: d
    label: Topological sort on any graph
correct_option_keys:
  - b
tags:
  - Graph Theory
  - Cycles
---

## Explanation

**b** is correct: a back-edge during DFS implies a cycle.

![DFS back-edge example](./images/dfs-back-edge.png)

<Callout type="tip">Kahn's algorithm fails when a cycle exists — no zero-in-degree node remains.</Callout>
```

### `multiple_select`
JSON source used to generate the MDX:
```json
{
  "question": "Which statements about topological sort are true? (Select all that apply.)",
  "status": "published",
  "answer_format": "multiple_select",
  "cognitive_style": "comprehension",
  "difficulty": "advanced",
  "concept": "Topological sort",
  "options": [
    { "key": "a", "label": "Requires a DAG" },
    { "key": "b", "label": "Produces a unique ordering for every DAG" },
    { "key": "c", "label": "Can be computed with Kahn's algorithm" },
    { "key": "d", "label": "Runs in O(V + E) with adjacency lists" }
  ],
  "correct_option_keys": [ "a", "c", "d" ],
  "tags": [ "Graph Theory", "Topological Sort" ],
  "explanation": "**a**, **c**, **d** are correct. **b** is false: multiple valid orderings exist when parallel branches exist."
}
```

```mdx
---
question: "Which statements about topological sort are true? (Select all that apply.)"
status: published
answer_format: multiple_select
cognitive_style: comprehension
difficulty: advanced
concept: Topological sort
options:
  - key: a
    label: Requires a DAG
  - key: b
    label: Produces a unique ordering for every DAG
  - key: c
    label: Can be computed with Kahn's algorithm
  - key: d
    label: Runs in O(V + E) with adjacency lists
correct_option_keys:
  - a
  - c
  - d
tags:
  - Graph Theory
  - Topological Sort
---

## Explanation

**a**, **c**, **d** are correct. **b** is false: multiple valid orderings exist when parallel branches exist.
```

### `true_false`

JSON source used to generate the MDX:
```json
{
  "question": "Topological sort can be applied to any directed graph.",
  "status": "published",
  "answer_format": "true_false",
  "cognitive_style": "application",
  "difficulty": "beginner",
  "concept": "Topological sort",
  "answer": false,
  "tags": [ "Graph Theory", "Topological Sort" ],
  "explanation": "False — only **DAGs** admit a topological ordering. Cyclic graphs have no topological sort.\n\nThe correct claim: topological sort applies to **directed acyclic** graphs."
}
```

```mdx
---
question: "Topological sort can be applied to any directed graph."
status: published
answer_format: true_false
cognitive_style: application
difficulty: beginner
concept: Topological sort
answer: false
tags:
  - Graph Theory
  - Topological Sort
---

## Explanation

False — only **DAGs** admit a topological ordering. Cyclic graphs have no topological sort.

The correct claim: topological sort applies to **directed acyclic** graphs.
```

### `free_text` — `factual_recall`

JSON source used to generate the MDX:
```json
{
  "question": "What is a back-edge in DFS?",
  "status": "published",
  "answer_format": "free_text",
  "cognitive_style": "factual_recall",
  "difficulty": "beginner",
  "concept": "DFS",
  "answer": "An edge `(u, v)` where `v` is an ancestor of `u` in the DFS tree.",
  "explanation": "An edge `(u, v)` where `v` is an ancestor of `u` in the DFS tree.\n\nBack-edges are the standard signal for **cycle detection** in directed graphs.",
  "tags": [ "Graph Theory", "DFS" ]
}
```

```mdx
---
question: "What is a back-edge in DFS?"
status: published
answer_format: free_text
cognitive_style: factual_recall
difficulty: beginner
concept: DFS
tags:
  - Graph Theory
  - DFS
---

## Answer

An edge `(u, v)` where `v` is an ancestor of `u` in the DFS tree.

## Explanation

Back-edges are the standard signal for **cycle detection** in directed graphs.
```

### `free_text` — `comprehension` / `application` / `scenario` / `open_ended` / `analogy`

Same `answer_format: free_text`. Vary `cognitive_style` and optional frontmatter (`concepts_tested`, `concept_target`, `concept_source`). Use **Answer** + **Explanation** in the body; put diagrams and JSX in **Explanation**.

JSON source used to generate the MDX:
```json
{
  "question": "How would you schedule parallel tasks with dependencies?",
  "status": "published",
  "answer_format": "free_text",
  "cognitive_style": "scenario",
  "difficulty": "advanced",
  "concepts_tested": [ "Topological sort", "Parallel execution" ],
  "answer": "Model a task graph as a DAG, run topological sort, execute each **level** of the resulting level-order in parallel.",
  "explanation": "Alternative: critical-path scheduling if tasks have **weights** (durations) — see the post section on…",
  "tags": [ "Scheduling", "Parallelism" ]
}
```

```mdx
---
question: "How would you schedule parallel tasks with dependencies?"
status: published
answer_format: free_text
cognitive_style: scenario
difficulty: advanced
concepts_tested:
  - Topological sort
  - Parallel execution
tags:
  - Scheduling
  - Parallelism
---

## Answer

Model a task graph as a DAG, run topological sort, execute each **level** of the resulting level-order in parallel.

## Explanation

Alternative: critical-path scheduling if tasks have **weights** (durations) — see the post section on…

<ComparisonTable tasks={...} />
```

---

## Pipeline notes

| Stage             | Behaviour                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **mdx-ingest**    | Parses frontmatter + stores **raw MDX body** (no HTML compilation)                                                          |
| **SSG / quiz UI** | Compiles explanation MDX at build or render time for rich display                                                           |
| **Static export** | Build may emit `/data/questions/{post-slug}.json` for the quiz app — that is a **delivery** format, not an authoring format |

---
## MDX examples by `answer_format`

### `multiple_choice`

JSON source used to generate the MDX:
```json
{
  "question": "Which algorithm detects cycles in a directed graph?",
  "status": "published",
  "answer_format": "multiple_choice",
  "cognitive_style": "factual_recall",
  "difficulty": "intermediate",
  "concept": "Graph cycle detection",
  "options": [
    { "key": "a", "label": "Breadth-first search only" },
    { "key": "b", "label": "DFS with back-edge detection" },
    { "key": "c", "label": "Dijkstra's algorithm" },
    { "key": "d", "label": "Topological sort on any graph" }
  ],
  "correct_option_keys": [ "b" ],
  "tags": [ "Graph Theory" ],
  "explanation": "**b** is correct: a back-edge during DFS implies a cycle."
}
```

```mdx
---
question: "Which algorithm detects cycles in a directed graph?"
status: published
answer_format: multiple_choice
cognitive_style: factual_recall
difficulty: intermediate
concept: Graph cycle detection
options:
  - key: a
    label: Breadth-first search only
  - key: b
    label: DFS with back-edge detection
  - key: c
    label: Dijkstra's algorithm
  - key: d
    label: Topological sort on any graph
correct_option_keys:
  - b
tags:
  - Graph Theory
---

## Explanation

**b** is correct: a back-edge during DFS implies a cycle.

![DFS back-edge example](./images/dfs-back-edge.png)

<Callout type="tip">Kahn's algorithm fails when a cycle exists — no zero-in-degree node remains.</Callout>
```

### `multiple_select`
JSON source used to generate the MDX:
```json
{
  "question": "Which statements about topological sort are true? (Select all that apply.)",
  "status": "published",
  "answer_format": "multiple_select",
  "cognitive_style": "comprehension",
  "difficulty": "advanced",
  "concept": "Topological sort",
  "options": [
    { "key": "a", "label": "Requires a DAG" },
    { "key": "b", "label": "Produces a unique ordering for every DAG" },
    { "key": "c", "label": "Can be computed with Kahn's algorithm" },
    { "key": "d", "label": "Runs in O(V + E) with adjacency lists" }
  ],
  "correct_option_keys": [ "a", "c", "d" ],
  "tags": [ "Graph Theory" ],
  "explanation": "**a**, **c**, **d** are correct. **b** is false: multiple valid orderings exist when parallel branches exist."
}
```

```mdx
---
question: "Which statements about topological sort are true? (Select all that apply.)"
status: published
answer_format: multiple_select
cognitive_style: comprehension
difficulty: advanced
concept: Topological sort
options:
  - key: a
    label: Requires a DAG
  - key: b
    label: Produces a unique ordering for every DAG
  - key: c
    label: Can be computed with Kahn's algorithm
  - key: d
    label: Runs in O(V + E) with adjacency lists
correct_option_keys:
  - a
  - c
  - d
---

## Explanation

**a**, **c**, **d** are correct. **b** is false: multiple valid orderings exist when parallel branches exist.
```

### `true_false`

JSON source used to generate the MDX:
```json
{
  "question": "Topological sort can be applied to any directed graph.",
  "status": "published",
  "answer_format": "true_false",
  "cognitive_style": "application",
  "difficulty": "beginner",
  "concept": "Topological sort",
  "answer": false,
  "tags": [ "Graph Theory" ],
  "explanation": "False — only **DAGs** admit a topological ordering. Cyclic graphs have no topological sort.\n\nThe correct claim: topological sort applies to **directed acyclic** graphs."
}
```

```mdx
---
question: "Topological sort can be applied to any directed graph."
status: published
answer_format: true_false
cognitive_style: application
difficulty: beginner
concept: Topological sort
answer: false
---

## Explanation

False — only **DAGs** admit a topological ordering. Cyclic graphs have no topological sort.

The correct claim: topological sort applies to **directed acyclic** graphs.
```

### `free_text` — `factual_recall`

JSON source used to generate the MDX:
```json
{
  "question": "What is a back-edge in DFS?",
  "status": "published",
  "answer_format": "free_text",
  "cognitive_style": "factual_recall",
  "difficulty": "beginner",
  "concept": "DFS",
  "answer": "An edge `(u, v)` where `v` is an ancestor of `u` in the DFS tree.",
  "explanation": "An edge `(u, v)` where `v` is an ancestor of `u` in the DFS tree.\n\nBack-edges are the standard signal for **cycle detection** in directed graphs."
}
```

```mdx
---
question: "What is a back-edge in DFS?"
status: published
answer_format: free_text
cognitive_style: factual_recall
difficulty: beginner
concept: DFS
---

## Answer

An edge `(u, v)` where `v` is an ancestor of `u` in the DFS tree.

## Explanation

Back-edges are the standard signal for **cycle detection** in directed graphs.
```

### `free_text` — `comprehension` / `application` / `scenario` / `open_ended` / `analogy`

Same `answer_format: free_text`. Vary `cognitive_style` and optional frontmatter (`concepts_tested`, `concept_target`, `concept_source`). Use **Answer** + **Explanation** in the body; put diagrams and JSX in **Explanation**.

JSON source used to generate the MDX:
```json
{
  "question": "How would you schedule parallel tasks with dependencies?",
  "status": "published",
  "answer_format": "free_text",
  "cognitive_style": "scenario",
  "difficulty": "advanced",
  "concepts_tested": [ "Topological sort", "Parallel execution" ],
  "answer": "Model a task graph as a DAG, run topological sort, execute each **level** of the resulting level-order in parallel.",
  "explanation": "Alternative: critical-path scheduling if tasks have **weights** (durations) — see the post section on…"
}
```

```mdx
---
question: "How would you schedule parallel tasks with dependencies?"
status: published
answer_format: free_text
cognitive_style: scenario
difficulty: advanced
concepts_tested:
  - Topological sort
  - Parallel execution
---

## Answer

Model a task graph as a DAG, run topological sort, execute each **level** of the resulting level-order in parallel.

## Explanation

Alternative: critical-path scheduling if tasks have **weights** (durations) — see the post section on…

<ComparisonTable tasks={...} />
```

---

## Pipeline notes

## Legacy `type` → canonical mapping

| Old spike `type`  | `answer_format`   | `cognitive_style`   |
| ----------------- | ----------------- | ------------------- |
| `multiple_choice` | `multiple_choice` | from former `style` |
| `multiple_select` | `multiple_select` | from former `style` |
| `true_false`      | `true_false`      | from former `style` |
| `factual_recall`  | `free_text`       | `factual_recall`    |
| `comprehension`   | `free_text`       | `comprehension`     |
| `application`     | `free_text`       | `application`       |
| `scenario`        | `free_text`       | `scenario`          |
| `open_ended`      | `free_text`       | `open_ended`        |
| `analogy`         | `free_text`       | `analogy`           |
