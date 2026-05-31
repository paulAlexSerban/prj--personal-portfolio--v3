| **CI/CD**             | GitHub Actions              | Native Git integration; free for public repos  

### 12.1 Workflow: Content Push → Deploy

**Trigger:** Push to `main` branch of `content--blog_domain.eu`

```yaml
# .github/workflows/content-sync.yml
jobs:
  ingest-and-build:
    steps:
      - Checkout content repo
      - Checkout app monorepo
      - pnpm install
      - Run: pipeline ingest --content-dir ../content
      - Commit updated db/content.db back to app repo (or upload as artifact)
      - Run: turbo build --filter=blog
      - Deploy blog dist/ to Cloudflare Pages
      - Run: turbo build --filter=quiz-web
      - Deploy quiz-web dist/ to Cloudflare Pages
```

### 12.2 Workflow: App Code Push → Deploy

**Trigger:** Push to `main` branch of app monorepo

```yaml
# .github/workflows/app-deploy.yml
jobs:
  build-and-deploy:
    steps:
      - Checkout app monorepo (db/content.db already present)
      - pnpm install
      - Run: turbo build
      - Deploy blog → Cloudflare Pages
      - Deploy quiz-web → Cloudflare Pages
      - (Optional) Run Capacitor build → Fastlane → App Store / Play Store
```

### 12.3 Turbo Task Graph

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "public/data/**"]
    },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

### 12.4 Lighthouse CI

```yaml
# Runs after blog deploy
- name: Lighthouse CI
  run: lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
# Budget: performance ≥ 95, SEO ≥ 95 — fails build if not met
```