---
name: Remove dark mode
overview: Strip dark mode from the shared design system and every frontend surface (portfolio, blog, news-feed, quiz), leaving a light-only UI with no toggle, no FOUC script, and no theme settings.
todos:
    - id: shared-theme
      content: Remove .dark block from theme.css; clean markdown/shadcn dark refs + shared docs
      status: completed
    - id: astro-sites
      content: Remove FOUC scripts, theme toggles, and @custom-variant dark from portfolio/blog/news-feed
      status: completed
    - id: quiz-app
      content: Delete quiz theme.ts; strip settings/store/main/styles/PWA theme wiring
      status: completed
    - id: verify
      content: Grep for leftover dark wiring; typecheck quiz + build portfolio
      status: completed
isProject: false
---

# Remove dark mode; keep light only

Scope: all Astro sites + the quiz app. Light `:root` palette in [`shared/ui/src/styles/theme.css`](shared/ui/src/styles/theme.css) stays as-is. Do not touch historical `_docs/` / `.cursor/plans/` files.

## 1. Shared design system

In [`shared/ui/src/styles/theme.css`](shared/ui/src/styles/theme.css):

- Delete the entire `.dark { ... }` block (currently ~lines 106–155).
- Keep `--code-surface` / `--code-surface-foreground` on `:root` (still used by code blocks; they are theme-independent).
- Soften the comment on those tokens so it no longer says “not redefined in `.dark`”.

In [`shared/ui/src/styles/markdown-rendered-content.css`](shared/ui/src/styles/markdown-rendered-content.css):

- Update the hljs comment to drop “in both themes” wording (cosmetic only).

In shadcn leftovers (unused by sites but keep consistent):

- [`shared/ui/src/components/ui/alert.tsx`](shared/ui/src/components/ui/alert.tsx): drop `dark:border-destructive`.
- [`shared/ui/src/components/ui/chart.tsx`](shared/ui/src/components/ui/chart.tsx): simplify `THEMES` to light-only (`{ light: '' }`) so the injected CSS no longer emits `.dark` selectors.

Briefly update mentions in [`shared/ui/readme.md`](shared/ui/readme.md) and [`shared/AGENTS.md`](shared/AGENTS.md) that claim a dark theme exists.

## 2. Astro sites (portfolio, blog, news-feed)

For each site, mirror the same three cuts:

**BaseTemplate FOUC script** — remove the inline `<script>` that reads `localStorage.theme` / `prefers-color-scheme` and toggles `.dark` on `<html>`:

- [`frontend/sites/portfolio-site/src/core/system/templates/BaseTemplate.astro`](frontend/sites/portfolio-site/src/core/system/templates/BaseTemplate.astro)
- [`frontend/sites/blog-site/src/core/system/templates/BaseTemplate.astro`](frontend/sites/blog-site/src/core/system/templates/BaseTemplate.astro)
- [`frontend/sites/news-feed-site/src/core/system/templates/BaseTemplate.astro`](frontend/sites/news-feed-site/src/core/system/templates/BaseTemplate.astro)

**SiteHeader toggle** — remove the `#theme-toggle` button and its accompanying `<script is:inline>` that flips `.dark` + writes `localStorage.theme`:

- [`frontend/sites/portfolio-site/src/core/library/modules/SiteHeader.astro`](frontend/sites/portfolio-site/src/core/library/modules/SiteHeader.astro)
- [`frontend/sites/blog-site/src/core/library/modules/SiteHeader.astro`](frontend/sites/blog-site/src/core/library/modules/SiteHeader.astro)
- [`frontend/sites/news-feed-site/src/core/library/modules/SiteHeader.astro`](frontend/sites/news-feed-site/src/core/library/modules/SiteHeader.astro)

**Global CSS**:

- Remove `@custom-variant dark (&:is(.dark *));` from each site’s `global.css`.
- In [`frontend/sites/blog-site/src/styles/global.css`](frontend/sites/blog-site/src/styles/global.css), delete the `.dark .post-card-cover-img` rule; keep the light `.post-card-cover-img` filter as-is.

## 3. Quiz web app

- Delete [`frontend/apps/quiz-web-app/src/lib/theme.ts`](frontend/apps/quiz-web-app/src/lib/theme.ts).
- [`frontend/apps/quiz-web-app/src/main.tsx`](frontend/apps/quiz-web-app/src/main.tsx): remove `initTheme` import and call.
- [`frontend/apps/quiz-web-app/src/store/types.ts`](frontend/apps/quiz-web-app/src/store/types.ts): remove `theme` from `AppSettings` and from `DEFAULT_SETTINGS` (backtest already hardcodes `theme: "light"` — drop that field there too in [`algorithms/backtest.ts`](frontend/apps/quiz-web-app/src/algorithms/backtest.ts)).
- [`frontend/apps/quiz-web-app/src/routes/settings.tsx`](frontend/apps/quiz-web-app/src/routes/settings.tsx): remove `applyTheme` import, `selectTheme`, the Appearance section (Theme row), and the `applyTheme(...)` call inside import-backup success.
- [`frontend/apps/quiz-web-app/src/styles.css`](frontend/apps/quiz-web-app/src/styles.css): remove `@custom-variant dark (&:is(.dark *));`.
- [`frontend/apps/quiz-web-app/vite.config.ts`](frontend/apps/quiz-web-app/vite.config.ts): set PWA `theme_color` from `#0d0d0d` to the light newsprint `#f2efe7` so install chrome matches light-only.

Persisted quiz backups that still contain `theme` are harmless: `importState` / zustand will ignore unknown or leftover keys once the type field is gone (no migration required).

## 4. Verify

- Grep the frontend + shared packages for remaining live dark-mode wiring (`.dark`, `theme-toggle`, `applyTheme`, `initTheme`, `@custom-variant dark`) — expect only docs/plans leftovers if any.
- Typecheck quiz app: `pnpm --filter @prj--personal-portfolio--v3/frontend--quiz-web-app typecheck`
- Build one Astro site (portfolio) to confirm templates compile without the toggle/script.
