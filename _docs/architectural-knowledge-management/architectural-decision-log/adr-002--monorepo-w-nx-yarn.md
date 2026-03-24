# ADR-002: Choosing Monorepo Setup with Nx and Yarn

## Status
Accepted

## Context
The personal portfolio project is expected to grow over time, with multiple components working together, including:
- **Frontend**: A single-page application (SPA) with modern JavaScript frameworks.
- **Backend**: A RESTful API, potentially expanding into microservices.
- **Shared Libraries**: Utility functions, configuration files, and components shared across the frontend and backend.
- **Tests**: Unit, integration, and end-to-end tests for both frontend and backend.

To ensure that these parts of the project are well-organized, easy to maintain, and scalable as the project evolves, a **monorepo** structure is proposed. A monorepo setup will house all project components in a single repository, allowing for unified version control, dependency management, and more seamless collaboration between the different parts of the codebase.

Additionally, the project requires tools that can:
- Manage dependencies efficiently across all project components.
- Provide code sharing and reuse mechanisms between different parts (e.g., shared components or utilities).
- Support rapid builds and development cycles through caching, task orchestration, and parallel execution.
- Offer flexibility to scale with new components or services without friction.

For these reasons, **Nx** and **Yarn** are being considered as key tools to manage the monorepo.

### Why Monorepo?
Monorepos offer several advantages:
1. **Consistency**: All parts of the project (frontend, backend, libraries) are in a single repository, ensuring all changes are versioned together, avoiding compatibility issues between components.
2. **Shared Code**: Common utilities, libraries, and configuration files can be easily shared across projects without needing to publish separate packages.
3. **Unified CI/CD Pipelines**: With all code in a single repository, there can be a single CI/CD pipeline to test, build, and deploy all components, reducing complexity.
4. **Refactoring**: Global refactoring becomes easier, as changes across multiple parts of the system can be made simultaneously without worrying about syncing different repositories.
5. **Easier Dependency Management**: Managing third-party dependencies across projects is simplified since all dependencies are declared in the same place.

However, monorepos can become cumbersome without the right tooling, leading to:
- Long build and test times.
- Difficulty in managing interdependencies between projects.
- Poor scalability as the project grows in complexity.

### Nx: Why Nx for Monorepo Management?
**Nx** is a comprehensive tool built specifically to manage monorepos efficiently. It provides:
- **Task Orchestration**: Nx manages tasks such as builds, tests, and linting across different projects in the monorepo. It knows the relationships between projects and can determine what needs to be built or tested, avoiding unnecessary work.
- **Dependency Graph**: Nx automatically creates a dependency graph between projects, which makes it easier to understand how different parts of the codebase are interconnected.
- **Caching and Distributed Builds**: Nx caches the results of builds, tests, and linting tasks, so the next time the same task is run, it can reuse previous results, speeding up development workflows. It also supports distributed builds, further improving performance for larger projects.
- **Code Generation and Scaffolding**: Nx provides powerful code generation tools, enabling developers to scaffold new applications, libraries, components, and services quickly.
- **Built-in Support for Modern Frameworks**: Nx has built-in support for frameworks like React, Angular, Next.js, Express, and others, making it easier to manage frontend and backend together.
- **Linting and Formatting**: Nx helps enforce consistent code styles across the monorepo through tools like ESLint, Prettier, and custom rulesets.

### Yarn: Why Yarn for Package Management?
**Yarn** is a modern, fast, and reliable package manager, offering a range of features well-suited for monorepos:
- **Workspaces**: Yarn Workspaces allow multiple projects within a monorepo to share dependencies and install them in a single `node_modules` folder, reducing redundancy and improving performance.
- **Fast Dependency Resolution**: Yarn resolves dependencies quickly by leveraging caching and parallelized operations, making it faster than alternatives like npm.
- **Deterministic Installs**: Yarn ensures that dependencies are installed consistently across different environments, reducing "works on my machine" problems.
- **Plug'n'Play Mode (PnP)**: Yarn’s PnP feature can further optimize dependency resolution by eliminating the need for a `node_modules` folder entirely, speeding up installs and improving performance.
- **Compatibility**: Yarn integrates seamlessly with Nx, creating a cohesive toolset for managing dependencies across the monorepo.

## Decision
The project will use:
- **Monorepo** structure to house all project components (frontend, backend, shared libraries) in a single repository.
- **Nx** as the monorepo management tool to handle task orchestration, caching, code generation, and other build-related tasks.
- **Yarn** as the package manager, with its Workspaces feature to manage dependencies across the different components in an efficient manner.

## Alternatives Considered
1. **Multi-repo Setup**
   - Pros:
     - Isolates each project or component, making it easier to independently version and release each part.
     - Greater independence between teams, allowing each to work in its own repository without interference.
   - Cons:
     - Harder to manage dependencies and ensure compatibility between different repositories.
     - Refactoring or making cross-cutting changes across repositories becomes cumbersome.
     - More complex CI/CD pipelines, requiring coordination between multiple repositories.
     - Makes sharing code and libraries more difficult, as they need to be published and consumed as separate packages.

2. **Lerna + npm**
   - Pros:
     - Lerna is another popular tool for managing JavaScript monorepos, and npm is the default package manager for JavaScript projects.
     - Well-established in the community with a proven track record.
   - Cons:
     - Lerna lacks some of the advanced features of Nx, such as dependency graph visualization and distributed caching.
     - npm, while popular, lacks the performance advantages and workspace management features provided by Yarn.

3. **pnpm + TurboRepo**
   - Pros:
     - **pnpm** is a high-performance alternative package manager that uses hard links and symlinks to reduce disk space usage and increase install speed.
     - **TurboRepo** is another monorepo management tool, providing fast task orchestration and caching, similar to Nx.
   - Cons:
     - Although pnpm and TurboRepo are performant alternatives, they lack some of the out-of-the-box integrations and features that Nx provides for managing monorepos with complex dependencies and tasks.

## Consequences
By adopting Nx and Yarn in a monorepo setup:
- **Scalability**: The project can easily scale as new components are added (e.g., additional microservices, libraries), without adding significant complexity to the development process.
- **Speed**: Development cycles will be faster due to Nx’s caching, task parallelization, and dependency graph optimizations.
- **Ease of Maintenance**: A monorepo allows for centralized dependency management and easier refactoring across the codebase. Yarn Workspaces reduce redundant dependencies, while Nx ensures efficient task orchestration.
- **Consistency**: Using a single repository promotes code consistency and simplifies version control, allowing for easier management of the overall system.
- **Tooling Integration**: Nx and Yarn integrate well with modern JavaScript frameworks, simplifying the setup and reducing friction when adopting new tools or libraries in the future.

Future considerations may include evaluating other monorepo tools or package managers if the project expands significantly or encounters performance bottlenecks.
