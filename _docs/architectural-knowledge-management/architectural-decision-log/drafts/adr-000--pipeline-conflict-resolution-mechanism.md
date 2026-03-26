### ADR-05: `locked` Flag as the Pipeline Conflict Resolution Mechanism
**Decision:** A single boolean column per entity governs whether the MDX pipeline may write to it.
**Rationale:** Bidirectional sync between a file system and a database is inherently conflict-prone. Introducing a clear ownership model (MDX-owned vs CMS-owned) eliminates ambiguity. The export CLI makes it easy to return ownership to MDX when needed.
**Trade-off:** The author must remember to run `pipeline export` to get CMS edits back into Git. A future improvement could automate this via a Directus webhook.