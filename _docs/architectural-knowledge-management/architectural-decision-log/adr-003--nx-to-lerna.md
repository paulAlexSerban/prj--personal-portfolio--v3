# ADR-003: Transitioning from Nx to Lerna for Monorepo Management

## Status
Accepted

## Context

Initially, the personal portfolio project adopted **Nx** for managing the monorepo, primarily due to its advanced features such as task orchestration, dependency graph visualization, and caching mechanisms. However, upon further evaluation, it has been decided to transition from Nx to **Lerna** for monorepo management.

This decision is influenced by the technical expertise of the development team, which is more experienced with **Lerna** than with Nx. Despite Nx's advanced features, familiarity with a tool plays a crucial role in the speed of development, ease of maintenance, and overall efficiency of the project.

Furthermore, while Nx provides advanced features suited for large and complex monorepos, the current scope of the portfolio project does not fully leverage all of these capabilities. Given the team’s experience and the simpler requirements of this project, Lerna is a more appropriate and efficient choice.

## Nx vs Lerna: Comparative Analysis

### Nx

- **Pros**:

  - **Task Orchestration**: Nx can run tasks in parallel, manage dependencies between projects, and only rebuild affected projects, which is useful for large, complex monorepos.
  - **Dependency Graph**: It automatically generates a dependency graph to visualize and manage relationships between projects.
  - **Caching**: Nx caches build results, tests, and linting to speed up repeated operations.
  - **Integrated Framework Support**: Out-of-the-box support for popular frameworks like React, Angular, and Next.js.
  - **Scalability**: Ideal for large, enterprise-scale monorepos with multiple interconnected projects.

- **Cons**:
  - **Complexity**: Nx introduces a steeper learning curve and more complexity, particularly for developers who are not familiar with its advanced features.
  - **Overhead**: For smaller projects or teams, Nx’s advanced features can feel like over-engineering and add unnecessary overhead to the project setup.

### Lerna

- **Pros**:
  - **Simplicity**: Lerna offers a more straightforward approach to managing a monorepo, focusing on publishing and managing versioned packages without the overhead of task orchestration and caching.
  - **Familiarity**: The development team has extensive experience working with Lerna, which reduces the learning curve and allows for more efficient workflows.
  - **Dependency Management**: Lerna handles inter-package dependencies well and is simpler to set up compared to Nx. It allows shared dependencies across multiple projects in the monorepo.
  - **Lerna with Yarn Workspaces**: Combining Lerna with Yarn Workspaces provides similar functionality for managing shared dependencies across projects, which works efficiently for the current scope of the portfolio project.
- **Cons**:
  - **Lacks Advanced Orchestration**: Lerna doesn’t provide the same level of task orchestration and dependency graph capabilities as Nx.
  - **Less Focus on Build Optimization**: While Lerna is suitable for managing dependencies and versioning, it lacks features like caching and task parallelization out of the box, making it less ideal for very large monorepos.

### Why Transition to Lerna?

While Nx offers powerful features, **the technical expertise of the development team is primarily with Lerna**. This familiarity will lead to:

- **Faster Development Cycles**: With Lerna, the team can work more efficiently due to the reduced learning curve. Setup, package management, and deployment processes are well understood, minimizing development delays.
- **Easier Maintenance**: Maintaining and refactoring the codebase will be more straightforward with a tool the team has extensive experience with.
- **Simplicity Over Complexity**: Lerna’s simpler feature set is more aligned with the needs of the portfolio project, which does not currently require the advanced orchestration and caching features that Nx provides.

## Decision

The project will transition from **Nx** to **Lerna** for managing the monorepo. Lerna will be used in conjunction with Yarn Workspaces for efficient package management and dependency sharing.

## Alternatives Considered

1. **Stick with Nx**

   - Pros: Retain the advanced features of task orchestration, caching, and dependency graphs.
   - Cons: Steeper learning curve and unnecessary complexity for a project that doesn’t fully leverage Nx’s advanced capabilities. The development team is not as familiar with Nx, which could slow down development and increase the maintenance burden.

2. **TurboRepo + pnpm**

   - Pros: TurboRepo provides task orchestration and caching similar to Nx, while pnpm is a performant package manager.
   - Cons: TurboRepo is a newer tool with less adoption and fewer built-in integrations than Lerna. The team would also need to learn both TurboRepo and pnpm, adding to the overhead.

3. **Continue Using Yarn Workspaces Alone**
   - Pros: Yarn Workspaces are already part of the project and simplify dependency management across projects in a monorepo.
   - Cons: Yarn Workspaces alone don’t offer versioning, publishing, or package management features, making it less suited for managing a growing monorepo.

## Consequences

- **Reduced Complexity**: Lerna simplifies the monorepo setup and workflow, allowing the team to focus on developing new features without the overhead of learning a new tool.
- **Leveraging Team Expertise**: The team can immediately start working with a tool they’re proficient with, leading to faster progress and more effective management of the monorepo.
- **Limited Advanced Features**: While Lerna lacks advanced orchestration and caching features, these are not currently required for the scope of this project. Should the project grow in complexity, Nx or another tool could be revisited.

Future considerations may involve reevaluating the tool choice if the project expands to the point where the advanced orchestration and caching features of tools like Nx become necessary.
