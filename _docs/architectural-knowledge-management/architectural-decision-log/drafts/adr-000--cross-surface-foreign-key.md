
### ADR-06: Slug as the Cross-Surface Foreign Key
**Decision:** The `post_slug` foreign key in `questions` is derived from the question filename, not stored separately in frontmatter.
**Rationale:** Encoding the relationship in the filename makes it auditable from the file system alone — no need to open the file to know which post a question belongs to. It also prevents the author from accidentally setting an incorrect `post_slug` in frontmatter.
**Trade-off:** Slug immutability becomes a hard constraint. Enforced by CI lint check.