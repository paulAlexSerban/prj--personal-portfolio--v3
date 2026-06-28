# (draft) Spaced-repetition engine — SUPERSEDED

> **Superseded by [ADR-009](../adr-009--spaced-repetition-scheduler.md).**
> This draft specified an SM-2-only engine in a standalone `packages/sr-engine`.
> The as-built design keeps the schedulers **inside the quiz app**
> (`frontend/apps/quiz-web-app/src/algorithms/`) and ships **both SM-2 and FSRS-5**
> behind one `Scheduler` interface, switchable at runtime. Kept only for provenance.

See ADR-009 and `frontend/apps/quiz-web-app/AGENTS.md` (Scheduling) for the real
implementation and `src/algorithms/*.test.ts` for the test suite.
