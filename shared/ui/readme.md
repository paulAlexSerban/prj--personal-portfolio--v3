# Shared UI (`shared/ui/`)

Framework-agnostic React component library and newspaper design system ("THE REVIEW").
Used by the quiz web app today; intended for future Astro SSG apps (portfolio, blog)
via React islands.

## Package

**Name:** `@prj--personal-portfolio--v3/shared--ui`

### Exports

| Subpath        | Contents                                                                |
| -------------- | ----------------------------------------------------------------------- |
| `.`            | All components + `cn` + `useIsMobile` (barrel)                          |
| `./utils`      | `cn()` helper only                                                      |
| `./styles.css` | Design tokens, base styles, component classes, `.md-content` typography |

### Contents

- `src/components/ui/` — full shadcn/ui kit (Radix + CVA) plus custom `Stamp` and `Modal`
- `src/lib/utils.ts` — `cn()` (`clsx` + `tailwind-merge`)
- `src/hooks/use-mobile.tsx` — responsive breakpoint hook (used by `Sidebar`)
- `src/styles/theme.css` — newspaper palette, dark theme, `.stamp`/`.rule`/`.smallcaps`,
  `.md-content` markdown typography, KaTeX/hljs token colours

## Consumption (Vite / React CSR)

```bash
pnpm add @prj--personal-portfolio--v3/shared--ui
```

In your global CSS entry:

```css
@import 'tailwindcss' source(none);
@source "../src";
@source "../../../../shared/ui/src"; /* scan package for Tailwind classes */
@import 'tw-animate-css';
@custom-variant dark (&:is(.dark *));
@import '@prj--personal-portfolio--v3/shared--ui/styles.css';
```

In React:

```tsx
import { Stamp, Modal, Button, cn } from '@prj--personal-portfolio--v3/shared--ui';
```

## Consumption (Astro SSG + React islands)

1. Add `@astrojs/react` and `@prj--personal-portfolio--v3/shared--ui` as dependencies.
2. Enable the React integration in `astro.config.mjs`.
3. Import the theme CSS in your global stylesheet (same Tailwind v4 `@source` pattern as above).
4. Use components in `.astro` files:

```astro
---
import { Stamp } from "@prj--personal-portfolio--v3/shared--ui";
---
<Stamp client:load>Study now</Stamp>
```

- **Static** components (e.g. `Badge`, layout wrappers using only CSS classes) can render
  at build time without a client directive.
- **Interactive** components (Radix primitives, `Modal`, `Stamp` buttons, `Toaster`) need
  `client:load` or `client:visible`.
- App-specific layout (masthead, nav, footer) stays in each Astro app — only the design
  system and UI primitives live here.

## Scripts

```bash
pnpm --filter @prj--personal-portfolio--v3/shared--ui typecheck
```

## Related

- `shared/AGENTS.md` — all shared packages
- `frontend/apps/quiz-web-app/AGENTS.md` — primary consumer today
