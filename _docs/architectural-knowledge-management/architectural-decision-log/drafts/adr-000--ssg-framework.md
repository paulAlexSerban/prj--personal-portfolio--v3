# ADR-000: Static-Stite Generation (MDX) with MDX

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

## Options Considered
1. Next.js
2. TanStack Start (TanStack Router + ecosystem)
3. Astro

## Option Analysis

### 1. Next.js

| Strengths                                                                | Weaknesses                                                        | Architectural Impact                                                  | When it makes sense                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Mature ecosystem, battle-tested                                          | Ships **React runtime by default**                                | You are committing to:                                                | Content + app hybrid;                                                              |
| First-class MDX support via `@next/mdx`                                  | Build times degrade with large MDX collections                    | - React runtime on the client;                                        | You want one framework for everything;                                             |
| Flexible rendering modes (SSG, SSR, ISR)                                 | MDX bundling can become complex (especially with dynamic imports) | - Framework conventions (routing, data fetching)                      | You accept higher JS cost                                                          |
| Large ecosystem and community support                                    | Next.js is a general-purpose framework, not content-first         | You get: Strong MDX support; Flexible rendering modes (SSG, SSR, ISR) | Blogs, documentation, knowledge bases; SEO-heavy platforms; Content-driven systems |
| Good performance with optimizations (image optimization, code splitting) |                                                                   |                                                                       |                                                                                    |
| App Router with nested layouts and streaming (Next.js 13+)               |                                                                   |                                                                       |                                                                                    |


## 2. TanStack Start

| Strengths                                            | Weaknesses                 | Architectural Impact                                          | When it makes sense                          |
| ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Extremely flexible routing via TanStack Router       | **Immature SSG story**     | You are building:                                             |                                              |
| Fine-grained control over data loading (React Query) | No first-party MDX support | - Your own content system;                                    | You want full control over architecture;     |
| Modern architecture (React Query, Router, etc.)      | Requires manual setup:     | - Your own SSG pipeline                                       | You are building a custom platform;          |
|                                                      | - MDX parsing              | This is not a content framework—it’s a **framework toolkit**. | You’re okay investing time in infrastructure |
|                                                      | - Content layer            |                                                               |                                              |
|                                                      | - Static export logic      |                                                               |                                              |
|                                                      | Smaller ecosystem          |                                                               |                                              |

### Reality check
If your goal is MDX → static site, this is the **wrong abstraction level**.


## 3. Astro
| Strengths                                    | Weaknesses                              | Architectural Impact           | When it makes sense                                                                |
| -------------------------------------------- | --------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| Static-first by design                       | Smaller ecosystem                       | You are committing to:         | Blogs, documentation, knowledge bases; SEO-heavy platforms; Content-driven systems |
| Zero JS by default (critical advantage)      | Not React-first (though supports React) | - Static-first architecture;   | You want best-in-class performance out of the box;                                 |
| First-class MDX support (`@astrojs/mdx`)     | Less suited for highly dynamic apps     | - Minimal client-side JS;      | You accept less flexibility for dynamic features;                                  |
| Partial hydration (“islands architecture”)   |                                         | You get:                       |                                                                                    |
| Excellent performance out of the box         |                                         | - Cleaner content pipeline;    |                                                                                    |
| - Content layer                              |                                         | - Better performance baseline; |                                                                                    |
| Clean separation:                            |                                         |                                |                                                                                    |
| - Presentation                               |                                         |                                |                                                                                    |
| Built-in content collections (typed content) |                                         |                                |                                                                                    |

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


## Decision

**Choose: Astro**

## Rationale
This is a **content-first problem**, not an application problem.
Astro aligns directly with:
* MDX as a first-class citizen
* Static generation as the default
* Minimal JS as a principle (not an optimization)

Next.js solves a broader problem than needed.
TanStack Start doesn’t solve this problem out of the box at all.

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

## Future Evolution Path

If requirements grow:
* Add interactivity via islands (React/Svelte inside Astro)
* Introduce APIs separately (microservices or serverless)
* If needed, migrate specific parts to Next.js (not the whole system)

## Bottom Line

* If you're building a **platform** → TanStack Start
* If you're building a **web app with content** → Next.js
* If you're building a **content system with components (MDX)** → Astro

## Resources
