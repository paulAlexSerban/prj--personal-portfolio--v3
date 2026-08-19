---
'@prj--personal-portfolio--v3/shared--ui': patch
'@prj--personal-portfolio--v3/frontend--portfolio-site': patch
'@prj--personal-portfolio--v3/frontend--news-feed-site': patch
---

Import Modal from a shared-ui subpath so AxisBadge (and NewsIntroModal) do not pull isomorphic-dompurify into the client island.
