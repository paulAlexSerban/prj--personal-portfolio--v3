# (draft) Client-side state schema — SUPERSEDED

> **Superseded by [ADR-008](../adr-008--quiz-web-app-architecture.md).**
> This draft sketched a `packages/storage` `StorageAdapter` + a small `UserStats`
> shape. The as-built state is a **zustand store persisted to `localStorage`**,
> keyed by question slug, with many more fields (suspended cards, leeches, per-set
> configs, FSRS card fields, settings). Kept only for provenance.

The two invariants from this draft still hold and are enforced in the store:
removing a post keeps its card states; ignore/suspend are soft-excludes that retain
progress. Authoritative schema: `frontend/apps/quiz-web-app/src/store/types.ts`
(see `AGENTS.md`).
