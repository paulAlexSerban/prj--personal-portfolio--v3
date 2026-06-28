# Shared UI (`shared/ui/`)

React component library and newspaper design system ("THE REVIEW"). It holds two
layers: **generic primitives** (shadcn/ui kit + design tokens) and the
**quiz "blocks"** — the actual flashcard UI, kept presentation-only so the quiz web
app just wires them to its store. Used by the quiz web app today; intended for
future Astro SSG apps (portfolio, blog) via React islands.

## Package

**Name:** `@prj--personal-portfolio--v3/shared--ui`

### Exports

| Subpath        | Contents                                                                |
| -------------- | ----------------------------------------------------------------------- |
| `.`            | Everything — blocks + primitives + `cn` + `useIsMobile` (barrel)        |
| `./blocks`     | Quiz blocks only (`CardRenderer`, `QuestionRenderer`, `StudyCard`, …)   |
| `./utils`      | `cn()` helper only                                                      |
| `./styles.css` | Design tokens, base styles, component classes, `.md-content` typography |

### Two layers

**1. Blocks — the quiz UI (`src/components/blocks/`).** Pure, props-in/callbacks-out
components with **Storybook stories**; they hold no store or routing logic (the app
supplies that via containers + hooks).

| Block                               | Role                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `CardRenderer`                      | Renders compiled/markdown content (cloze, math, code) safely.                |
| `QuestionRenderer`                  | Branches on `answerFormat` (MC / multiple-select / true-false / free-text).  |
| `StudyCard`                         | A full study-session card: content, reveal, rating buttons, in-card actions. |
| `QuestionPreview`                   | Read-only question view (stem, options, explanation, SM-2 state).            |
| `SessionEndView` / `NothingDueView` | Session completion + empty-queue screens.                                    |

**2. Primitives + design system.**

- `src/components/ui/` — full shadcn/ui kit (Radix + CVA) plus custom `Stamp` and `Modal`
- `src/lib/utils.ts` — `cn()` (`clsx` + `tailwind-merge`)
- `src/lib/markdown.ts` — `marked` GFM + math/cloze tokenizer used by `CardRenderer`
- `src/lib/richText.ts` — **lazy/code-split** KaTeX + highlight.js loaders (offline-precached)
- `src/hooks/use-mobile.tsx` — responsive breakpoint hook (used by `Sidebar`)
- `src/styles/theme.css` — newspaper palette, dark theme, `.stamp`/`.rule`/`.smallcaps`,
  `.md-content` markdown typography, KaTeX/hljs token colours

> Blocks render content via `shared--quiz-markdown` (export-time HTML is the fast
> path; client compile is the fallback) and type their questions with the
> `shared--quiz-export` contract.

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
pnpm --filter @prj--personal-portfolio--v3/shared--ui storybook        # dev gallery on :6006
pnpm --filter @prj--personal-portfolio--v3/shared--ui build-storybook  # static build
```

Every block has a story — use Storybook to develop/preview blocks in isolation
(no app, no store) across light/dark themes.

## Where it sits

- **Depends on:** `shared--quiz-export` (question contract types) + `shared--quiz-markdown`
  (content compile) for the blocks; Radix UI, CVA, lucide-react, sonner, KaTeX,
  highlight.js, etc. `react`/`react-dom` are peer deps.
- **Consumed by:** `frontend--quiz-web-app` (today) — it imports blocks and wraps
  them in containers; future Astro portfolio/blog via React islands.

## Related

- `shared/AGENTS.md` / `shared/readme.md` — all shared packages
- `shared/quiz-markdown/readme.md` — the content compile pipeline blocks use
- `shared/quiz-export/readme.md` — the question contract blocks are typed against
- `frontend/apps/quiz-web-app/AGENTS.md` — primary consumer (containers + hooks)
