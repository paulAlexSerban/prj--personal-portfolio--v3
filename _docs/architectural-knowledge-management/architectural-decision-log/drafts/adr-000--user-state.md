### ADR-04: Client-Side-Only User State in v0.1
**Decision:** All learner state lives in localStorage / Capacitor Preferences with no server sync.
**Rationale:** Eliminates the need for any user-facing backend, authentication system, or privacy/GDPR surface in v0.1. The Anki desktop app itself uses local storage as its primary model — this is an established pattern for spaced repetition.
**Trade-off:** No cross-device sync. Explicitly deferred to v0.2 as an optional sync layer.