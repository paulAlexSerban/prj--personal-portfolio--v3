# Portfolio-site Redesign and Expansion

Brutally honest framing: the current build is competent but inert — it tells, it doesn't show. This plan implements the design review's *high-value structural* ideas inside a new portfolio-only illustrated aesthetic, backed by an expanded content pipeline so nothing is hardcoded (HOME-05).

## Decisions locked
- Aesthetic: full rough/Excalidraw look for portfolio only (Rough.js / SVG illustrations, radar, architecture diagram). Accepts brand divergence + more JS.
- Data: full pipeline expansion (schema + ingest + authored content).

## Key trade-offs
- Portfolio gets its OWN theme file (warm paper + hand-drawn fonts), NOT `shared--ui/styles.css` newspaper tokens. `shared--ui` is still used for the accessible `Sheet`/`Button` primitives, restyled with local classes.
- Experience tech stored as a JSON `tech` column on `experience`, NOT `content_tags`.
- Project case-study summary stored as structured columns (`problem`, `approach`, `outcome`, `metrics`) used by cards; the long narrative stays in MDX `body`.
- Rough.js rendered at BUILD time to static SVG wherever non-interactive (zero JS); React islands only for interactive bits.
- Radar kept but secondary: always paired with text depth-annotations and an accessible `<table>` fallback.

## Explicitly NOT doing
- No illustration components in `shared/ui`.
- No animated/live architecture diagram in v1 — static Rough SVG first.
- No new tag-junction seam in json-ingest (use `tech` column).
- No CMS, no runtime server, no client accounts.

## Phases
See implementation in `frontend/sites/portfolio-site/` — phases P0–P7 as executed in this branch.
