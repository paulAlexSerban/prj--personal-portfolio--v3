### 11.1 Surface Comparison

| Surface      | Entry Point                             | Storage               | Offline            | Codebase                                    |
| ------------ | --------------------------------------- | --------------------- | ------------------ | ------------------------------------------- |
| Blog Widget  | `client:idle` Astro island on post page | localStorage          | No (fetches JSON)  | `packages/quiz-ui`                          |
| Quiz Web App | Standalone URL                          | localStorage          | Yes (PWA)          | `apps/quiz-web`                             |
| iOS App      | App Store                               | Capacitor Preferences | Yes (bundled JSON) | `apps/quiz-mobile` wrapping `apps/quiz-web` |
| Android App  | Google Play                             | Capacitor Preferences | Yes (bundled JSON) | `apps/quiz-mobile` wrapping `apps/quiz-web` |

### 11.2 Capacitor Configuration

```typescript
// apps/quiz-mobile/capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:    'eu.blog_domain.quiz',
  appName:  'Quiz',
  webDir:   '../quiz-web/dist',
  plugins: {
    Preferences: { group: 'QuizUserStats' },
  },
};
export default config;
```

### 11.3 PWA Configuration (Quiz Web App)

Service worker caches:
- App shell (HTML, JS, CSS)
- `/data/posts.json`
- `/data/questions/*.json` (lazily cached on first fetch per post)

---