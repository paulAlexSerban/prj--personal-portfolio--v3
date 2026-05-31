# ADR: Static Site Generation (SSG) with MDX

## Status
Proposed

## Context
We need a **static site generation pipeline** that:
  * Converts **MDX → static HTML**
  * Supports **content-heavy pages (blog, docs, knowledge base)**
  * Has strong **performance (SEO, Core Web Vitals)**
  * Enables **component-driven content (React/JSX in MDX)**
  * Scales with future needs (search, tagging, theming, partial hydration)

Key architectural concerns:
  * Build-time performance
  * Runtime JS footprint
  * MDX integration maturity
  * Routing model
  * Long-term maintainability

---

## Options Considered
### 1. Next.js
### 2. TanStack Start (TanStack Router + ecosystem)
### 3. Astro

## Option Analysis

---

## 1. Next.js
### Strengths
* Mature ecosystem, battle-tested
* Native MDX support via `@next/mdx`
* Hybrid rendering:
  * SSG
  * SSR
  * ISR (Incremental Static Regeneration)
* Strong plugin ecosystem (remark/rehype)
* App Router enables layout composition

### Weaknesses
* Ships **React runtime by default**
* Overkill for purely static content
* Build times degrade with large MDX collections
* MDX bundling can become complex (especially with dynamic imports)

### Architectural Impact
* You are committing to:
  * React runtime on the client
  * Framework conventions (routing, data fetching)
* Good if:
  * You expect dynamic features later (auth, dashboards, APIs)

### When it makes sense
* Content + app hybrid
* You want one framework for everything
* You accept higher JS cost

---

## 2. TanStack Start
### Strengths
* Extremely flexible routing via TanStack Router
* Fine-grained control over data loading
* Strong type safety
* Modern architecture (React Query, Router, etc.)

### Weaknesses
* **Immature SSG story**
* No first-class MDX pipeline
* Requires manual setup:
  * MDX parsing
  * Content layer
  * Static export logic
* Smaller ecosystem

### Architectural Impact
* You are building:
  * Your own content system
  * Your own SSG pipeline

This is not a content framework—it’s a **framework toolkit**.

### When it makes sense
* You want full control over architecture
* You are building a **custom platform**, not just a blog/docs site
* You’re okay investing time in infrastructure

### Reality check
If your goal is MDX → static site, this is the **wrong abstraction level**.

---

## 3. Astro
### Strengths
* **Static-first by design**
* Zero JS by default (critical advantage)
* First-class MDX support (`@astrojs/mdx`)
* Partial hydration (“islands architecture”)
* Excellent performance out of the box
* Clean separation:
  * Content layer
  * Presentation
* Built-in content collections (typed content)

### Weaknesses
* Smaller ecosystem than Next.js
* Not React-first (though supports React)
* Less suited for highly dynamic apps

### Architectural Impact
* You are committing to:
  * Static-first architecture
  * Minimal client-side JS
* You get:
  * Better performance baseline
  * Cleaner content pipeline

### When it makes sense
* Blogs, documentation, knowledge bases
* SEO-heavy platforms
* Content-driven systems

---

## Decision Matrix

| Criteria         | Next.js | TanStack Start | Astro           |
| ---------------- | ------- | -------------- | --------------- |
| MDX Support      | Strong  | Weak           | Strong (native) |
| SSG Performance  | Good    | Unknown        | Excellent       |
| Client JS Size   | High    | Medium         | Minimal         |
| Ecosystem        | Huge    | Small          | Growing         |
| Flexibility      | Medium  | Very High      | Medium          |
| Setup Complexity | Medium  | High           | Low             |
| Content Focus    | Medium  | Low            | High            |

---

## Decision

**Choose: Astro**

---

## Rationale
This is a **content-first problem**, not an application problem.

Astro aligns directly with:
* MDX as a first-class citizen
* Static generation as the default
* Minimal JS as a principle (not an optimization)

Next.js solves a broader problem than needed.
TanStack Start doesn’t solve this problem out of the box at all.

---

## Consequences
### Positive
* Best-in-class performance (near-zero JS)
* Clean MDX pipeline
* Simpler architecture
* Faster builds for content-heavy sites
* Better SEO baseline

### Negative
* Less flexibility for dynamic features
* Smaller ecosystem vs Next.js
* Potential migration cost if app complexity grows

---

## Future Evolution Path
If requirements grow:
* Add interactivity via islands (React/Svelte inside Astro)
* Introduce APIs separately (microservices or serverless)
* If needed, migrate specific parts to Next.js (not the whole system)

---

## Bottom Line
* If you're building a **platform** → TanStack Start
* If you're building a **web app with content** → Next.js
* If you're building a **content system with components (MDX)** → Astro
