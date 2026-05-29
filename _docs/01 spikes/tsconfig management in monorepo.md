Managing multiple `tsconfig.json` files in a monorepo is less about “configuration tricks” and more about enforcing **clear layering + inheritance + boundaries**. If you don’t structure it deliberately, you’ll end up with inconsistent builds, broken path resolution, and duplicated compiler options everywhere.

Here’s a solid, scalable approach that works for pnpm-based monorepos.

---

# 1. The core idea: layered tsconfigs

You should have **3 levels**:

### 1) Root base config (shared rules)

* Shared compiler options
* No project-specific settings
* No `include` of source code

### 2) App/package configs (workspace level)

* Extend base config
* Define `rootDir`, `outDir`, project-specific path mapping

### 3) Build/solution config (optional but powerful)

* Used for composite builds (`tsc -b`)
* Coordinates dependencies between packages

---

# 2. Recommended monorepo structure

Example with pnpm workspaces:

```
repo/
  packages/
    ui/
      tsconfig.json
      src/
    api/
      tsconfig.json
      src/
  tsconfig.base.json
  tsconfig.json (solution)
  package.json
```

---

# 3. Root base config (tsconfig.base.json)

This is the **single source of truth for compiler behavior**.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",

    "strict": true,
    "skipLibCheck": true,

    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,

    "declaration": true,
    "declarationMap": true,

    "sourceMap": true,

    "baseUrl": "."
  }
}
```

Key rule:

> No `include`, no `exclude`, no `references` here.

---

# 4. Root tsconfig.json (project orchestration)

This is where you define the monorepo as a **TypeScript project graph**.

```json
{
  "files": [],
  "references": [
    { "path": "./packages/ui" },
    { "path": "./packages/api" }
  ]
}
```

This enables:

* `tsc -b` (incremental builds)
* proper dependency ordering
* faster rebuilds

---

# 5. Package tsconfig (each workspace)

Example: `packages/ui/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",

    "composite": true,
    "declaration": true
  },
  "include": ["src"]
}
```

Example: `packages/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src"]
}
```

---

# 6. Critical setting: `composite: true`

This is required for monorepo builds with project references.

It enforces:

* explicit dependencies
* incremental build metadata
* prevents accidental cross-import chaos

---

# 7. Build strategy (important)

Instead of running `tsc` per package:

### Build everything in correct order:

```bash
tsc -b
```

Or:

```bash
tsc -b packages/ui packages/api
```

Or from root:

```json
{
  "scripts": {
    "build": "tsc -b"
  }
}
```

---

# 8. Handling cross-package imports

If `api` depends on `ui` types:

### Option A (correct): project references

In `api/tsconfig.json`:

```json
{
  "references": [
    { "path": "../ui" }
  ]
}
```

Then TypeScript understands dependency ordering.

---

# 9. Path aliases (be careful in monorepos)

Avoid global path chaos. Prefer per-package aliases.

Example:

```json
{
  "compilerOptions": {
    "paths": {
      "@ui/*": ["../ui/src/*"]
    }
  }
}
```

But better approach:

* use workspace package imports instead:

```ts
import { Button } from "@repo/ui";
```

Then resolve via `package.json` exports instead of TS paths.

---

# 10. Common mistakes (these will hurt later)

### ❌ One giant tsconfig for everything

Leads to:

* slow builds
* tangled dependency graph
* impossible incremental compilation

---

### ❌ No `composite`

Breaks `tsc -b` and incremental builds

---

### ❌ Using root-level `paths` for everything

Causes:

* runtime mismatch (TS vs Node)
* bundler confusion (Vite/Webpack/tsc disagree)

---

### ❌ Mixing build + dev configs

Don’t overload one config for both IDE and CI.

---

# 11. Advanced setup (recommended in serious monorepos)

Split configs:

```
tsconfig.base.json        (shared compiler rules)
tsconfig.build.json       (composite + build settings)
tsconfig.json             (project references)
```

Then packages:

```json
{
  "extends": "../../tsconfig.build.json"
}
```

---

# 12. If you're using pnpm workspaces

Add this for smoother module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler"
  }
}
```

or for Node backend:

```json
{
  "moduleResolution": "NodeNext"
}
```

---

# Bottom line

A scalable monorepo TS setup is:

* one **base config**
* per-package **isolated configs**
* root **project references**
* build via `tsc -b`
* avoid global path alias abuse
