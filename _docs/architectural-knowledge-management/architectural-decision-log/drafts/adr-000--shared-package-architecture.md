
Each package has a single responsibility and zero knowledge of its consumers.

```
packages/
├── sr-engine/
│   ├── src/
│   │   └── sm2.ts          # Pure SM-2 implementation
│   ├── tests/
│   │   └── sm2.test.ts
│   └── package.json        # zero dependencies

├── quiz-ui/
│   ├── src/
│   │   ├── CardFront.tsx
│   │   ├── CardBack.tsx
│   │   ├── RatingButtons.tsx
│   │   ├── SessionManager.tsx
│   │   ├── StatsScreen.tsx
│   │   └── index.ts
│   └── package.json        # depends on: react, sr-engine, storage

├── storage/
│   ├── src/
│   │   ├── interface.ts    # StorageAdapter interface
│   │   ├── local.ts        # localStorage implementation
│   │   └── capacitor.ts    # Capacitor Preferences implementation
│   └── package.json

└── content-client/
    ├── src/
    │   ├── fetchQuestions.ts   # GET /data/questions/{slug}.json
    │   └── fetchPosts.ts       # GET /data/posts.json
    └── package.json
```