```
Cloudflare Pages
├── blog.domain.eu/              ← SSG output
│   ├── (all static pages)
│   └── data/
│       ├── posts.json
│       └── questions/
│           ├── _all.json
│           └── {slug}.json
│
└── quiz.domain.eu/              ← Vite SPA output
    └── (PWA app shell + service worker)

App Stores
├── iOS App Store                ← Capacitor build via Fastlane
└── Google Play Store            ← Capacitor build via Fastlane
```