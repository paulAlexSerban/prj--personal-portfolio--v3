> MDX without imports means you need a **component injection layer at build time**.

Otherwise, MDX has no idea what `<Hello />` is.

So the architecture becomes:

> **MDX (content repo) → compiled with injected components → Astro build → S3 → CloudFront**

---

# High-Level Architecture

### Repos

### 1. Content Repo

* Pure `.mdx` files
* No imports
* Example:

```mdx
# Hello World

<Hello name="from content repo" />
```

---

### 2. Site Repo (Astro)

* Owns:

  * React components
  * MDX pipeline
  * Build system
* Pulls content repo at build time

---

# The Key Mechanism: Global MDX Components

Astro (via MDX) supports **component mapping**.

You inject components globally instead of importing them.

---

# 1. Project Structure (Site Repo)

```id="bbt3v9"
src/
  components/
    Hello.jsx
  content/
    (pulled from external repo)
  layouts/
  pages/
    index.astro
```

---

# 2. React Component

`src/components/Hello.jsx`

```jsx id="m6q7o0"
export default function Hello({ name }) {
  return (
    <div style={{ border: "1px solid black", padding: "1rem" }}>
      Hello {name}
    </div>
  );
}
```

---

# 3. Inject Components Globally

This is the critical part.

`astro.config.mjs`

```js id="o8rj2v"
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

import Hello from './src/components/Hello.jsx';

export default defineConfig({
  integrations: [
    mdx({
      components: {
        Hello, // globally available in ALL MDX files
      },
    }),
    react(),
  ],
});
```

Now this works **without import**:

```mdx
<Hello name="test" />
```

---

# 4. Bring External MDX Repo

You have 3 real options:

---

## Option A — Git Submodule (cleanest)

```bash id="82r3r7"
git submodule add https://github.com/your-org/content-repo src/content
```

Pros:

* Versioned
* Deterministic builds

Cons:

* Slight Git complexity

---

## Option B — CI Pull (most flexible)

In CI:

```bash id="f1ghw1"
git clone https://github.com/your-org/content-repo ./external-content
cp -r external-content/* src/content/
```

Pros:

* Simple
* Decoupled repos

Cons:

* No version pinning unless you enforce it

---

## Option C — Remote Fetch (worst for stability)

Fetch at build time via API/raw GitHub.

Avoid unless necessary.

---

# 5. Render MDX Pages

`src/pages/[slug].astro`

```astro
---
import fs from 'fs';
import path from 'path';

const { slug } = Astro.params;

const filePath = path.join(
  Astro.cwd,
  'src/content',
  `${slug}.mdx`
);

const Content = await import(filePath);
---

<html>
  <body>
    <Content />
  </body>
</html>
```

---

# 6. Build Output

```bash id="sh9m1a"
npm run build
```

Output:

```id="w4v8hp"
/dist
  index.html
  blog/
    post-1/index.html
```

This is what goes to S3.

---

# 7. Deploy to AWS

### S3

```bash id="1v0zj6"
aws s3 sync dist/ s3://your-bucket --delete
```

### CloudFront

* Origin: S3 bucket
* Default root: `index.html`
* Enable:

  * Compression
  * Caching (long TTL for assets)

---

# Critical Design Decisions

## 1. Component API Stability

You’ve created a **contract**:

```mdx
<Hello name="..." />
```

If you change `Hello`, you can break content.

**Mitigation:**

* Version components
* Or enforce schema via linting

---

## 2. Security Boundary

You are executing MDX from another repo.

That means:

* It can run JSX
* It can break builds
* It can inject logic

**Treat content repo as code, not content.**

---

## 3. Build Coupling

* Content changes → require full rebuild
* No runtime rendering (pure SSG)

This is correct for:

* blogs
* docs
* knowledge systems

---

## 4. Performance Outcome

With **Astro**:

* Static HTML by default
* React only where used
* Minimal JS shipped

This is exactly what you want behind CloudFront.

---

# What This Architecture Gives You

* Clean separation:

  * Content (MDX repo)
  * Rendering (Astro repo)
* Deterministic builds
* High performance (CDN-first delivery)
* Component-driven content without import noise

---

# What Could Go Wrong

Be honest about this:

### 1. Hidden Dependencies

MDX references components that:

* don’t exist
* changed API

→ build fails

---

### 2. No Type Safety Across Repos

You lose:

* TypeScript validation in MDX
* IDE autocomplete

---

### 3. Scaling Content

At scale, you’ll want:

* Content collections (Astro)
* Frontmatter validation (Zod)
* Slug generation
* Indexing

---

# Bottom Line

This approach is:

* Architecturally clean
* Production-grade
* Used in real systems

But it's not “simple static site” anymore.

You’ve effectively built a **headless content system with a compile-time renderer**.
