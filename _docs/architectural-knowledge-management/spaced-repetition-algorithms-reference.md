# Spaced-Repetition Algorithms Reference

**Status:** As-built reference (matches `frontend/apps/quiz-web-app/src/algorithms/` as of 2026-07).  
**Audience:** Future you, contributors, and agents working on scheduling behaviour.  
**Decision record:** [ADR-009](./architectural-decision-log/adr-009--spaced-repetition-scheduler.md).

This document explains **how scheduling works in the quiz web app**: the shared learning engine, SM-2, FSRS-5, configuration knobs, and why certain ratings (especially **Easy**) produce specific intervals.

---

## 1. Architecture overview

The quiz app ships **two schedulers** behind one interface. The user picks the active algorithm in Settings; switching migrates every card losslessly and is reversible.

```
reviewCard() in store
       │
       ▼
getScheduler(settings)          ← scheduler.ts
       │
       ├── sm2Scheduler        ← sm2.ts
       └── makeFsrsScheduler   ← fsrs.ts
              │
              ▼
       runReview()             ← learning.ts (shared card-state machine)
              │
              ├── new / learning  → handleLearning()
              ├── relearning      → handleRelearning()
              └── review          → strategy.review()  (algorithm-specific)
              │
              ▼
       scheduleReviewInterval()  ← fuzz + load balancing (all algorithms)
```

| File           | Role                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| `learning.ts`  | Shared learning/relearning steps, `ReviewStrategy` interface, `scheduleReviewInterval` |
| `sm2.ts`       | SM-2 ease-factor + interval growth                                                     |
| `fsrs.ts`      | FSRS-5 stability/difficulty model                                                      |
| `scheduler.ts` | `Scheduler` interface, `getScheduler`, migration helpers, retrievability preview       |
| `fuzz.ts`      | Interval fuzz + due-date load balancing                                                |
| `queue.ts`     | Study queue selection (due cards, daily limits)                                        |
| `intervals.ts` | Human-readable interval labels                                                         |
| `backtest.ts`  | SM-2 vs FSRS simulation harness                                                        |

**Invariant:** UI and store code never call `applyReview` or `applyReviewFsrs` directly. Everything routes through `getScheduler(settings)`.

---

## 2. Card model

Each question slug is one SRS card (`CardState` in `store/types.ts`).

### Ratings

| Value | Label | Meaning                  |
| ----- | ----- | ------------------------ |
| 1     | Again | Failed recall            |
| 2     | Hard  | Recalled with difficulty |
| 3     | Good  | Normal successful recall |
| 4     | Easy  | Effortless recall        |

Ratings reflect **recall quality after the review step**, not raw correctness alone.

### Card types (state machine)

| `cardType`   | Meaning                                               |
| ------------ | ----------------------------------------------------- |
| `new`        | Never studied                                         |
| `learning`   | Short intra-session steps before first graduation     |
| `review`     | Mature card scheduled by day intervals                |
| `relearning` | Lapsed card in short steps before returning to review |

### Algorithm-specific fields

**SM-2** uses:

| Field         | Role                                         |
| ------------- | -------------------------------------------- |
| `interval`    | Days until next review                       |
| `easeFactor`  | Multiplier for interval growth (default 2.5) |
| `repetitions` | Successful review count                      |
| `dueDate`     | ISO date when card becomes due               |

**FSRS** additionally tracks:

| Field                | Role                                                |
| -------------------- | --------------------------------------------------- |
| `fsrsStability` (S)  | Expected days until retrievability drops to target  |
| `fsrsDifficulty` (D) | Card difficulty, clamped to [1, 10]                 |
| `fsrsLastReview`     | ISO date of last FSRS review (for forgetting curve) |

`interval` and `dueDate` are still written under FSRS — they are the **user-facing schedule** after post-processing. FSRS computes a base interval from stability, then shared code applies clamping, fuzz, and load balancing.

---

## 3. Shared learning engine

Both algorithms share the same learning/relearning step machinery (`learning.ts`). Only behaviour in the **review** state (and graduation from learning) differs per algorithm.

### Learning phase (`new` / `learning`)

| Rating    | Behaviour                                         |
| --------- | ------------------------------------------------- |
| Again (1) | Reset to first learning step                      |
| Hard (2)  | Repeat current step with averaged delay           |
| Good (3)  | Advance to next step, or graduate on last step    |
| Easy (4)  | **Skip remaining steps** and graduate immediately |

Learning steps come from `config.learningSteps` (default `[1, 10]` minutes).

### Relearning phase (after a lapse)

| Rating    | Behaviour                              |
| --------- | -------------------------------------- |
| Again (1) | Reset to first lapse step              |
| Hard (2)  | Stay on current step with longer delay |
| Good (3)  | Advance step or graduate               |
| Easy (4)  | Graduate back to review immediately    |

Lapse steps come from `config.lapseSteps` (default `[10]` minutes).

### Graduation

When a card graduates from learning or relearning, the active `ReviewStrategy` sets algorithm-specific state and schedules the first day-based interval:

- **SM-2:** `graduate(card, config, easy)` — uses `easyInterval` or `graduatingInterval`
- **FSRS:** `graduate(card, config, easy)` — seeds stability/difficulty from the rating

### Interval post-processing (all algorithms)

Every day-based schedule goes through `scheduleReviewInterval`:

1. **Clamp** to `[minimumInterval, maximumInterval]`
2. **Fuzz** — deterministic ±offset based on card slug (Anki-style magnitude)
3. **Load balance** — pick a due date within the fuzz window that minimises cards already due that day (21-day lookahead)

```typescript
// fuzz.ts — magnitude grows with interval
// < 2 days:  no fuzz
// < 7 days:  ±1 day
// < 30 days: ±5% (min ±1)
// ≥ 30 days: ±10% (min ±2)
```

---

## 4. SM-2 algorithm

**Default scheduler.** Classic SuperMemo 2 (1987), Anki-compatible ease-factor model.

**Source:** `src/algorithms/sm2.ts`

### Graduation from learning

| Graduation path   | Base interval                                   |
| ----------------- | ----------------------------------------------- |
| Good (last step)  | `config.graduatingInterval` (default **1 day**) |
| Easy (skip steps) | `config.easyInterval` (default **4 days**)      |

### Review-state updates

**Ease factor changes:**

| Rating | Δ ease factor     |
| ------ | ----------------- |
| Again  | −0.20 (floor 1.3) |
| Hard   | −0.15 (floor 1.3) |
| Good   | unchanged         |
| Easy   | +0.15             |

**Interval growth** (after clamping and `intervalModifier`):

| Rating | Formula                                                           |
| ------ | ----------------------------------------------------------------- |
| Again  | Lapse → relearning; interval × `lapseNewInterval` (default 0)     |
| Hard   | `interval × 1.2`                                                  |
| Good   | `interval × easeFactor`                                           |
| Easy   | `interval × easeFactor × easyBonus` (default easyBonus = **1.3**) |

### SM-2 configuration (`StudyConfig`)

All fields below are used by SM-2:

| Setting              | Default       | Purpose                               |
| -------------------- | ------------- | ------------------------------------- |
| `learningSteps`      | `[1, 10]` min | Intra-session steps before graduation |
| `graduatingInterval` | 1 day         | First interval after Good graduation  |
| `easyInterval`       | 4 days        | First interval after Easy graduation  |
| `lapseSteps`         | `[10]` min    | Relearning steps after Again          |
| `lapseNewInterval`   | 0             | Interval multiplier on lapse          |
| `minimumInterval`    | 1 day         | Floor                                 |
| `maximumInterval`    | 30 days       | Ceiling                               |
| `easyBonus`          | 1.3           | Easy multiplier on review cards       |
| `intervalModifier`   | 1.0           | Global interval scale                 |
| `startingEaseFactor` | 2.5           | Initial ease on graduation            |

---

## 5. FSRS-5 algorithm

**Optional scheduler.** Free Spaced Repetition Scheduler v5 — models memory with **stability** (S) and **difficulty** (D) instead of a single ease factor.

**Source:** `src/algorithms/fsrs.ts`

External reference: [FSRS algorithm wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)

### Core concepts

**Stability (S):** How many days until the predicted recall probability drops to the target retention.

**Difficulty (D):** How hard the card is, ∈ [1, 10]. Lower = easier card = faster interval growth.

**Retrievability R(t):** Predicted recall probability at `t` days after last review:

```
R(t) = (1 + FACTOR · t / S) ^ DECAY

DECAY = −0.5
FACTOR = 19/81
```

**Interval from stability:** Days until R drops to `requestedRetention`:

```
interval = (S / FACTOR) · (requestedRetention^(1/DECAY) − 1)
```

At the default **90% retention**, interval ≈ stability (rounded). Example: S = 15.47 → interval ≈ **15 days**.

### Default parameters

```typescript
DEFAULT_FSRS_PARAMS = {
  w: [/* 19 weights — see table below */],
  requestedRetention: 0.9,
  maximumInterval: 36500,  // internal formula cap; user cap applied later
}
```

User settings (`AppSettings`):

| Setting               | Default              | Purpose                              |
| --------------------- | -------------------- | ------------------------------------ |
| `fsrsTargetRetention` | 0.9                  | Target recall probability (0.7–0.99) |
| `fsrsWeights`         | undefined → defaults | Optional 19-element weight vector    |

### The 19 weights (`w[0]` … `w[18]`)

Published FSRS-5 defaults (optimised on large review datasets):

| Index       | Value       | Used for                                           |
| ----------- | ----------- | -------------------------------------------------- |
| `w[0]`      | 0.4072      | Initial stability — **Again**                      |
| `w[1]`      | 1.1829      | Initial stability — **Hard**                       |
| `w[2]`      | 3.1262      | Initial stability — **Good**                       |
| **`w[3]`**  | **15.4722** | Initial stability — **Easy**                       |
| `w[4]`      | 7.2102      | Initial difficulty base                            |
| `w[5]`      | 0.5316      | Initial difficulty rating factor                   |
| `w[6]`      | 1.0651      | Difficulty change magnitude                        |
| `w[7]`      | 0.0589      | Mean reversion toward Easy difficulty              |
| `w[8]`      | 1.471       | Recall stability growth (`exp(w[8])` ≈ 4.35)       |
| `w[9]`      | 0.1544      | Stability exponent in recall formula               |
| `w[10]`     | 1.007       | Retrievability factor in recall formula            |
| `w[11]`     | 1.9395      | Forget stability base (lapse)                      |
| `w[12]`     | 0.11        | Difficulty exponent (forget)                       |
| `w[13]`     | 0.29        | Stability exponent (forget)                        |
| `w[14]`     | 2.27        | Retrievability factor (forget)                     |
| `w[15]`     | 0.24        | Hard penalty multiplier                            |
| **`w[16]`** | **2.9898**  | **Easy bonus multiplier** on review recall         |
| `w[17]`     | 0.51        | Present in defaults; **not used** in this codebase |
| `w[18]`     | 0.43        | Present in defaults; **not used** in this codebase |

Custom weights can be pasted in Settings → Advanced: FSRS weights.

### Initial state on graduation

When a card graduates from learning:

```typescript
initStability(rating) = max(0.1, w[rating - 1])
initDifficulty(rating) = clamp(w[4] - exp(w[5] * (rating - 1)) + 1, 1, 10)
```

| Rating   | Initial stability | Approx. first interval (90% retention) |
| -------- | ----------------- | -------------------------------------- |
| Again    | 0.41 days         | ~0 days (learning, not graduated)      |
| Hard     | 1.18 days         | ~1 day                                 |
| Good     | 3.13 days         | ~3 days                                |
| **Easy** | **15.47 days**    | **~15 days**                           |

**This is why Easy on a new card schedules past 14 days under FSRS.** There is no 14-day constant — `w[3] = 15.4722` is baked into the published FSRS-5 defaults. The final due date may land at 14–16 days after fuzz (±1 day for intervals in the 7–30 range).

### Review-state updates

On each review, FSRS:

1. Computes **elapsed days** since `fsrsLastReview`
2. Computes **retrievability** R from stability and elapsed time
3. Updates **difficulty** via `nextDifficulty` (Again raises D, Easy lowers D)
4. Updates **stability**:
   - **Again (lapse):** `nextForgetStability` — stability decreases, card enters relearning
   - **Hard / Good / Easy:** `nextRecallStability` — stability increases

**Recall stability growth** (Hard / Good / Easy):

```
inc = exp(w[8])
    · (11 - difficulty)
    · stability^(-w[9])
    · (exp(w[10] · (1 - retrievability)) - 1)
    · hardPenalty    // w[15] if Hard, else 1
    · easyBonus      // w[16] if Easy, else 1

newStability = stability · (1 + inc)
```

**What influences Easy intervals on review cards:**

| Factor                | Effect                                      |
| --------------------- | ------------------------------------------- |
| Current stability     | Higher base → larger absolute jump          |
| Difficulty            | Lower D → bigger growth (`11 - difficulty`) |
| Retrievability R      | Reviewed closer to forgetting → bigger jump |
| `w[16]` easy bonus    | **~3×** multiplier on the growth term       |
| `nextDifficulty`      | Easy lowers D, helping future intervals     |
| `fsrsTargetRetention` | Lower retention → shorter intervals         |
| `maximumInterval`     | Hard cap (default 30 days)                  |

Repeated Easy ratings can push stability well above 14 days, capped by `config.maximumInterval`.

### Relearning graduation

When a relearning card graduates (Good on last step, or Easy):

- **Keeps existing stability** (or falls back to Good's initial stability `w[2]` if missing)
- Does **not** re-seed `w[3]` — Easy here does not jump to ~15 days unless stability was already high

### FSRS vs SM-2 settings

These `StudyConfig` fields are **SM-2 only** — FSRS ignores them:

| Setting              | SM-2 default | FSRS                                      |
| -------------------- | ------------ | ----------------------------------------- |
| `easyInterval`       | 4 days       | Ignored (uses `w[3]` instead)             |
| `easyBonus`          | 1.3×         | Ignored (uses `w[16]` instead)            |
| `graduatingInterval` | 1 day        | Ignored (uses `w[2]` for Good graduation) |
| `intervalModifier`   | 1.0          | Ignored                                   |

These fields are **shared** by both algorithms:

| Setting           | Default   | FSRS uses?          |
| ----------------- | --------- | ------------------- |
| `learningSteps`   | `[1, 10]` | Yes                 |
| `lapseSteps`      | `[10]`    | Yes                 |
| `minimumInterval` | 1 day     | Yes (clamp floor)   |
| `maximumInterval` | 30 days   | Yes (clamp ceiling) |

**Two different maximums exist:**

- `FsrsParams.maximumInterval` = 36500 — internal formula cap in `intervalFromStability`
- `StudyConfig.maximumInterval` = 30 — effective user-facing cap via `scheduleReviewInterval`

---

## 6. Easy rating — side-by-side comparison

Why Easy behaves differently between algorithms:

| Scenario               | SM-2                                        | FSRS                                              |
| ---------------------- | ------------------------------------------- | ------------------------------------------------- |
| New card, rate Easy    | Skip learning → **4 days** (`easyInterval`) | Skip learning → **~15 days** (`w[3]`)             |
| Review card, rate Easy | `interval × EF × 1.3`                       | Stability × `(1 + inc)` with **2.99×** easy bonus |
| Relearning, rate Easy  | Graduate with prior interval                | Graduate with **prior stability**                 |

If you see ~15 days on first Easy under FSRS, that is **expected**. If you expected 4 days, that is the SM-2 `easyInterval` setting — it does not apply to FSRS.

---

## 7. Algorithm migration

Triggered when the user changes `settings.scheduler` in Settings (with confirmation).

### SM-2 → FSRS (`migrateToFsrs`)

For review cards without FSRS state:

- `fsrsStability` ← `interval` (identity mapping)
- `fsrsDifficulty` ← linear remap from `easeFactor`: `D = (3.5 − EF) · 10/2.2 + 1`, clamped [1, 10]
- `fsrsLastReview` ← inferred from `dueDate − interval`

Idempotent — cards already carrying FSRS state are unchanged.

### FSRS → SM-2 (`migrateToSm2`)

Drops `fsrsStability`, `fsrsDifficulty`, `fsrsLastReview`. Keeps `interval` and `easeFactor` — lossless.

### Round-trip guarantee

SM-2 → FSRS → SM-2 preserves `interval` and `easeFactor` exactly (covered by unit tests).

---

## 8. Tuning guide

### Shorter FSRS Easy intervals

| Knob                                    | Effect                                      |
| --------------------------------------- | ------------------------------------------- |
| Lower `fsrsTargetRetention` (e.g. 0.85) | Shorter intervals globally                  |
| Custom `w[3]` (e.g. 4.0)                | Shorter first Easy graduation               |
| Custom `w[16]` (e.g. 1.5)               | Less aggressive Easy growth on review cards |
| Lower `maximumInterval`                 | Caps all intervals                          |

### Shorter SM-2 Easy intervals

| Knob                    | Effect                           |
| ----------------------- | -------------------------------- |
| Lower `easyInterval`    | Shorter first Easy graduation    |
| Lower `easyBonus`       | Less Easy growth on review cards |
| Lower `maximumInterval` | Caps all intervals               |

### Running the back-test

Compare algorithms on a simulated deck:

```bash
pnpm --filter @prj--personal-portfolio--v3/frontend--quiz-web-app exec tsx src/algorithms/backtest.ts
```

Typical result: FSRS reaches ~90% retention with ~36% fewer reviews than SM-2 on the same deck.

---

## 9. End-to-end flow diagrams

### New card → Easy (FSRS)

```
Rate Easy
  → handleLearning: rating === 4
  → fsrsStrategy.graduate(easy=true)
  → fsrsStability = w[3] = 15.47
  → intervalFromStability(15.47, 0.9) ≈ 15 days
  → clamp [1, 30]
  → fuzz ±1 day
  → load balance within 21-day window
  → card.dueDate set
```

### Review card → Easy (FSRS)

```
Rate Easy
  → compute retrievability R from elapsed days
  → nextDifficulty (D decreases)
  → nextRecallStability with w[16] easy bonus (~3×)
  → new stability may be 2–7× previous
  → intervalFromStability → clamp → fuzz → dueDate
```

### Review card → Again (both algorithms)

```
Rate Again
  → lapses += 1
  → enter relearning (short minute-based steps)
  → SM-2: ease −0.20, interval × lapseNewInterval
  → FSRS: nextForgetStability (stability drops)
```

---

## 10. Tests and verification

| Test file      | Covers                                                |
| -------------- | ----------------------------------------------------- |
| `fsrs.test.ts` | Core formulas, graduation, lapse, Easy cap, migration |
| `sm2.test.ts`  | Ease changes, interval ordering, Easy cap             |
| `backtest.ts`  | Comparative simulation                                |

Run tests:

```bash
pnpm --filter @prj--personal-portfolio--v3/frontend--quiz-web-app test
```

---

## 11. Related documents

| Document                                                                                                          | Topic                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [ADR-009](./architectural-decision-log/adr-009--spaced-repetition-scheduler.md)                                   | Why both algorithms, migration contract                |
| [Quiz web app AGENTS.md](../../frontend/apps/quiz-web-app/AGENTS.md)                                              | Code map and invariants                                |
| [Quiz enhancements plan § Phase 7](../02%20plans/quiz-web-app-enhancements-plan.md)                               | Implementation history                                 |
| [Spaced repetition PRD](../product/01%20prd%20-%20feature%20requirements%20-%20spaced%20repetition%20behavior.md) | Product requirements (SM-2 era; FSRS added in ADR-009) |
| [FSRS algorithm wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)                     | Upstream algorithm specification                       |

---

## 12. Maintenance notes

When changing scheduling behaviour:

1. Update the algorithm source in `frontend/apps/quiz-web-app/src/algorithms/`
2. Update unit tests in `*.test.ts`
3. Update **this document** if formulas, defaults, or config semantics change
4. If the change is architectural (new algorithm, migration contract), write or amend an ADR
