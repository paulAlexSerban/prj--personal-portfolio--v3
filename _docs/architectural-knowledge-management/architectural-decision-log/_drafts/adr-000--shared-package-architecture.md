# (draft) Shared package architecture — SUPERSEDED

> **Superseded by [ADR-008](../adr-008--quiz-web-app-architecture.md).**
> This draft proposed `packages/{sr-engine,quiz-ui,storage,content-client}`. None
> were built under those names. The real shared layer is in `shared/*`:
> `db-schema`, `db`, `question-contract`, `quiz-markdown`, `quiz-export`, `ui`,
> `task-manager`. Kept only for provenance.

The authoritative description of the shared packages (role, API, dependencies) is
[`shared/readme.md`](../../../../shared/readme.md) and
[`shared/AGENTS.md`](../../../../shared/AGENTS.md).
