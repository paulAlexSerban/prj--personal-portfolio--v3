# 1. Project Setup

```bash
npm create astro@latest my-site
cd my-site

# Add MDX + React
npx astro add mdx
npx astro add react

npm install
```

---

# 2. Astro Config

`astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [mdx(), react()],
  output: 'static'
});
```

---

# 3. Create a React Component

`src/components/Hello.jsx`

```jsx
import React from "react";

export default function Hello({ name }) {
  return (
    <div style={{
      padding: "1rem",
      border: "2px solid #333",
      borderRadius: "8px"
    }}>
      <h2>Hello {name} from React!</h2>
    </div>
  );
}
```

---

# 4. Create an MDX Page

`src/pages/index.mdx`

```mdx
---
title: Hello World
---

import Hello from "../components/Hello.jsx";

# Hello World from MDX

This is static content rendered at build time.

<Hello name="Astro + MDX" client:load />

## What’s happening here?

- Markdown is compiled to HTML
- React component is embedded inside MDX
- `client:load` enables hydration on the client
```

---

# 5. Layout (Optional but realistic)

`src/layouts/BaseLayout.astro`

```astro
---
const { title } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
  </head>
  <body>
    <main>
      <slot />
    </main>
  </body>
</html>
```

---

Update MDX to use it:

```mdx
---
title: Hello World
layout: ../layouts/BaseLayout.astro
---

import Hello from "../components/Hello.jsx";

# Hello World from MDX

<Hello name="Astro" client:load />
```

---

# 6. Build Static Site

```bash
npm run build
```

Output:

```
/dist
  index.html
  assets/
```

This is **pure static HTML + minimal JS**.

---

# 7. Preview Locally

```bash
npm run preview
```

---

# 8. Deploy (Static Hosting)

You can deploy `/dist` to:

* AWS S3 + CloudFront
* Netlify
* Vercel (static mode)
* GitHub Pages

Example (S3):

```bash
aws s3 sync dist/ s3://your-bucket
```

---

# Key Architectural Insight

This line is the entire game:

```mdx
<Hello name="Astro + MDX" client:load />
```

You control hydration explicitly:

* `client:load` → hydrate immediately
* `client:idle` → hydrate when browser is idle
* `client:visible` → hydrate only when visible
* no directive → **zero JS (pure static HTML)**

---

# What You Just Built

* MDX → compiled at build time
* React → embedded as islands
* Output → static HTML
* JS → only where needed

This is fundamentally different from:

* **Next.js** → ships React everywhere
* **TanStack Start** → not optimized for static content

---

# If You Want to Level This Up

Next steps that actually matter architecturally:

### 1. Content Collections (typed MDX)

* enforce schema
* enable tagging, categories

### 2. Static Search

* Lunr.js (local index)
* Algolia (hosted)

### 3. Code Highlighting

* Shiki (built-in Astro support)

### 4. Image Optimization

* Astro `<Image />`

### 5. Zero-JS Mode for Most Pages

* Only hydrate interactive components

---

# Bottom Line

You now have:

* A **static-first architecture**
* MDX as a content system
* React as an **optional enhancement layer**

That’s the cleanest mental model you can get for a content platform.
