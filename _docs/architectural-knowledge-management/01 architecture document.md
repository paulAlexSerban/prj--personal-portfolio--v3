# Architecture Document
## SE Portfolio, Blog + Flashcard Quiz Platform

| Field                 | Value                                       |
| --------------------- | ------------------------------------------- |
| **Document Version**  | 1.0                                         |
| **Status**            | Draft                                       |
| **Author**            | —                                           |
| **Last Updated**      | 2026-03-25                                  |
| **Related Documents** | [PRD v2.0](#) · [System Design Diagrams](#) |



## Technology Stack

| Layer                           | Choice         | Rationale                                                                                                                                   | ADR                |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Programming Language**        | TypeScript     | Full-stack type safety across Node.js, Astro, React, and shared packages. Rich ecosystem support for all required libraries and frameworks. | ADR-001            |
| **JS Runtime**                  | Node.js        | Ubiquitous JavaScript runtime with excellent ecosystem support for all required libraries and frameworks (FE + BE)                          | ADR-002            |
| **Monorepo Setup & Management** | Lerna          | While Nx provides advanced, Lerna offers a simpler setup that aligns well with the project’s needs.                                         | ADR-003 -> ADR-004 |
| **Content rendering**           | JAMStack (SSG) | Pre-rendered static pages for optimal performance and SEO                                                                                   | ADR-005            |
| **Database**                    | SQLite         | Zero infrastructure; file-based; git-committable build artifact; Headless CMS compatible                                                    | ADR-006            |

## Repository & Monorepo Structure

Two Git repositories. The content repository is decoupled from the application codebase so it can be updated independently without triggering a full application build.

### Content Repository (`content--paulserban.eu`)
Contains all authored MDX files.

### Application Monorepo
```
root/
- _docs/
- assets/
- backend/
- content/
- database/
- frontend/
- infrastructure/
- shared/
- scripts/
- tests/
```

---

## Content Repository Structure

```
content--blog_domain.eu/
- /content
  - /publish
  - /backlog
  - /in-progress
```

### MDX Frontmatter Contracts

**Post / Book Note**
```yaml
---
title: "Introduction to Closures"
subheading: "A deep dive into how closures work in JavaScript."
excerpt: "A deep dive into how closures work in JavaScript."
date: "May 06, 2026"
author_date: "June 01, 2026"
status: "published"  # 'published' | 'draft' | 'archived'
author: "Paul Serban"
tags: 
  - "JavaScript"
  - "Closures"
---
```
**Snippet**
```yaml
---
title: "Debounce Hook"
subheading: "A reusable React hook for debouncing any fast-changing value."
excerpt: "A reusable React hook for debouncing any fast-changing value."
date: "May 06, 2026"
author_date: "June 01, 2026"
status: "published"  # 'published' | 'draft' | 'archived'
author: "Paul Serban"
tags: 
  - "JavaScript"
  - "React"
---
```

**Project**
```yaml
---
title: 'React.js Playground'
subheading: "Development setup for POCs built with React.js, JavaScript, TypeScript, Storybook, Chromatic, Jest, and Netlify."
excerpt: "Playground and development setup for POCs, feasibility studies, and experiments to practice, learn, and test new technologies, libraries, and tools along with their integration and configuration in a React.js environment with TypeScript. it is a gallery showcasing my transition from TypeScript to JavaScript as I dive deeper into React.js and its ecosystem."
priority: 2
section: 'portfolio'
repo_url: 'https://paulalexserban.github.io/wbk--reactjs-playground'
demo_url: 'https://paulalexserban.github.io/wbk--reactjs-playground'
status: "published"
pinned: true
date: 'November 10, 2023'
tags:
    - "React.js"
    - "JavaScript"
    - "TypeScript"
    - "Monorepo"
---
Long-form MDX description / case study content...
```

**Question**
```yaml
# Filename: dependency-resolution-and-topological-sort-building-a-task-execution-engine--a3f9b.mdx
---
question: "Why does the article describe parallel execution of independent tasks as a feature rather than a limitation of topological sort?"
status: "draft"
tags:
    - Algorithms
    - Graph Theory
    - Python
    - Task Scheduling
    - Workflow Orchestration
    - Software Engineering
    - Dependency Resolution
    - Topological Sort
    - DFS
    - Kahn's Algorithm
    - Parallel Execution
    - Cycle Detection
    - Performance Optimization
    - Depth-First Search
    - Graph Algorithms
    - Scheduling Algorithms
    - Distributed Systems
---

## Answer:
## Explanation:
```

---

## Data Model
> adr-000--datamodel.md

## 5. Content Pipeline
> adr-000--content-pipeline.md

## CMS & Database Tooling
### CMS
> adr-000--cms.md

### DB Tooling
> adr-000--db-tooling.md

## SSG Build
### Build-Time Data Flow

```
database/content.db (SQLite)
    │
    └── SSG build engine (drizzle query at build time)
          ├── Generates HTML pages:
          │     /                          ← profile + skills + featured projects + recent posts
          │     /portfolio                 ← all projects
          │     /posts/[slug]              ← each post (with quiz widget island)
          │     /book-notes/[slug]
          │     /snippets/[slug]
          │
          └── Generates static JSON data files:
                /data/questions/{slug}.json    ← questions per post
                /data/questions/_all.json      ← all questions (for mobile offline bundle)
                /data/posts.json               ← all post metadata (for quiz app post browser)
```

## Shared Package Architecture
> adr-000--shared-package-architecture.md


## Spaced Repetition Engine
> adr-000--spaced-repetition-engine.md


## Client-Side State Schema
> adr-000--client-side-state-schema.md


## Quiz Delivery Targets
> adr-000--quiz-delivery-targets.md

## CI/CD Pipeline
> adr-000--ci-cd.md

## Deployment Architecture
> adr-000--deployment-architecture.md
