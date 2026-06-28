# (draft) Quiz delivery targets — SUPERSEDED

> **Superseded by [ADR-008](../adr-008--quiz-web-app-architecture.md).**
> This early draft assumed `packages/quiz-ui`, `apps/quiz-web`, and a Capacitor
> `apps/quiz-mobile`. The as-built design differs: a single CSR app at
> `frontend/apps/quiz-web-app`, UI blocks in `shared/ui`, JSON from
> `shared/quiz-export`. Kept only for provenance.

**Still open (not yet built):** the blog-quiz **widget** (`frontend/apps/quiz-widget`)
and a **mobile** wrapper (`frontend/apps/quiz-mobile-app`). The `_all.json` export
bundle exists to keep the offline-mobile option open. Revisit Capacitor specifics
in a fresh ADR if/when mobile is actually built.
