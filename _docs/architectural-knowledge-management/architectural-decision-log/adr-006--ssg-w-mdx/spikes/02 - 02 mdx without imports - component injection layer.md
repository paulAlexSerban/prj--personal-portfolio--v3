**“MDX without imports, components magically available”** is not how MDX works by default. You need to introduce a **component injection layer** at build time.

Let’s structure this properly.

---
# The Real Architecture
## Goal
* Static site via **Astro**
* Hosted on **Amazon S3 + Amazon CloudFront**
* MDX files stored in a **separate content repo**
* MDX files:

  * **DO NOT import components**
  * Use components like `<Callout />`, `<Button />` directly

---
# The Problem (Reality Check)

MDX normally requires:
```mdx
import Callout from '../components/Callout.jsx';
```

Without that, MDX will **fail at compile time**.

So you need:
> A **global component registry injected into MDX runtime**

---

# The Correct Solution: MDX Component Provider
Astro supports this via **MDX component mapping**.

---

# 1. Project Structure

```
astro-site/
  src/
    components/
      Callout.jsx
      Button.jsx
    mdx-components.js
    pages/
  content/   <-- pulled from external repo
```

---

# 2. Pull MDX from External Repo
### Option A (simple, works well)

```bash
git submodule add https://github.com/your-org/content.git src/content
```

### Option B (CI-driven)

* Fetch content repo in pipeline
* Copy into `/src/content`

---

# 3. Create Global MDX Component Registry

`src/mdx-components.js`

```js
import Callout from './components/Callout.jsx';
import Button from './components/Button.jsx';

export const mdxComponents = {
  Callout,
  Button
};
```

---

# 4. Wire It into Astro
`astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    mdx({
      // This is the key part
      providerImportSource: "@mdx-js/react"
    }),
    react()
  ],
  output: 'static'
});
```

---

# 5. Inject Components via Layout
This is the missing piece most people overlook.

`src/layouts/BaseLayout.astro`

```astro
---
import { MDXProvider } from "@mdx-js/react";
import { mdxComponents } from "../mdx-components";
const { frontmatter } = Astro.props;
---

<html>
  <body>
    <MDXProvider components={mdxComponents}>
      <article>
        <slot />
      </article>
    </MDXProvider>
  </body>
</html>
```

---

# 6. MDX File (NO IMPORTS)
From your **external repo**:

```mdx
---
title: Hello World
layout: ../layouts/BaseLayout.astro
---

# Hello from external MDX

<Callout>
This works without importing anything.
</Callout>

<Button label="Click me" />
```

---

# 7. Example Component
`src/components/Callout.jsx`

```jsx
export default function Callout({ children }) {
  return (
    <div style={{
      padding: "1rem",
      borderLeft: "4px solid blue",
      background: "#f0f4ff"
    }}>
      {children}
    </div>
  );
}
```

---
# 8. Build

```bash
npm run build
```

Output → `/dist` → upload to S3

---
# 9. Deploy to S3 + CloudFront

### S3

```bash
aws s3 sync dist/ s3://your-bucket --delete
```

### CloudFront
* Origin: S3 bucket
* Default root object: `index.html`
* Enable:

  * Compression
  * Caching (long TTL for assets)

---

# Architectural Implications
## What you achieved
* **Content decoupled from presentation**
* MDX repo becomes:
  * CMS-like
  * versionable
  * independently editable

---
## Tradeoffs (Important)
### 1. Hidden Dependencies
MDX uses components that are **not explicitly imported**
That means:
* No static analysis
* No autocomplete
* Harder onboarding

You’re trading **developer clarity for author simplicity**

---
### 2. Version Coupling
If content uses:

```mdx
<FancyChart />
```

…and your Astro app doesn’t provide it → build breaks

You need:
* Versioning strategy
* OR strict component whitelist

---
### 3. Security Consideration

MDX = executable JSX
If content repo is not trusted:
* You are executing arbitrary code at build time

---
# Better Version (What I’d Actually Do)

Instead of fully implicit components:

### Option: Hybrid Approach
Allow **zero-import MDX**, but enforce:
* Documented component catalog
* Linting step (custom)

Example:
```mdx
<Callout type="warning">
```

Backed by:
* JSON schema
* MDX lint rule

---
# Final Verdict

Your approach is solid **if you treat it like a CMS system**, not just markdown.

You are effectively building:

> “Headless MDX CMS + Astro renderer”

Which is a **very strong architecture** for:

* Blogs
* Docs
* Knowledge platforms

---

# If You Want to Go Deeper

Next logical steps:

1. Content schema validation (Zod + Astro collections)
2. MDX linting (prevent unknown components)
3. Preview system (PR → preview deploy)
4. Search indexing (build-time)
5. Cache strategy for CloudFront (critical for performance)

