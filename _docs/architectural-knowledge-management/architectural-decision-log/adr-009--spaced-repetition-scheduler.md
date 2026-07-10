# ADR-009: Spaced-Repetition Scheduler (SM-2 + FSRS-5, runtime-switchable)
## Status: Accepted (2026-06-28)

## Context

The original plan was a single pure **SM-2** engine in `packages/sr-engine`. SM-2
(1987) is simple and well understood but materially worse than **FSRS** (the
open algorithm behind modern Anki) on retention-vs-workload. The stated goal is to
*beat Anki* for this content, which realistically requires FSRS — but SM-2 is a
safe, debuggable default and existing users' schedules must not break.

## Decision

Ship **both** algorithms behind one `Scheduler` interface
(`frontend/apps/quiz-web-app/src/algorithms/scheduler.ts`) and let the user switch
at runtime in Settings:

- `sm2.ts` — SM-2 strategy (default).
- `fsrs.ts` — FSRS-5 (stability/difficulty model, target-retention interval).
- `learning.ts` — learning/relearning steps + daily limits **shared** by both.
- All review/preview/migration routes through `getScheduler(settings)`; the store
  and UI never call an algorithm directly.

Switching algorithms **migrates every card losslessly and reversibly**: SM-2→FSRS
seeds stability from `interval` and difficulty from ease; FSRS→SM-2 drops the FSRS
fields and keeps `interval`/`easeFactor`. Each `ReviewLog` records which scheduler
produced it.

## Why

- FSRS gives better retention per review; SM-2 stays as a transparent fallback.
- A single interface keeps queueing, fuzz/load-balancing, per-set limits, and
  leeches algorithm-agnostic (they wrap the scheduler, not the reverse).
- Lossless migration means the choice is reversible with zero data loss.

## Consequences

- More surface to maintain (two strategies + migration) and to test.
- FSRS weights are the published defaults, hand-editable only — **no per-user
  optimizer** yet.
- Validated by a back-test harness (`algorithms/backtest.ts`): on a simulated deck,
  FSRS reaches ~90% retention with ~36% fewer reviews than SM-2.

## Supersedes (draft)

`_drafts/adr-000--spaced-repetition-engine.md` (SM-2-only, separate
`packages/sr-engine`).

## See also

- **Algorithm reference (formulas, weights, Easy behaviour, tuning):**
  `../spaced-repetition-algorithms-reference.md`
- Enhancements plan Phase 7: `_docs/02 plans/quiz-web-app-enhancements-plan.md`.
- Code map: `frontend/apps/quiz-web-app/AGENTS.md` (Scheduling section).
