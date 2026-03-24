# ADR-001: Choosing Node.js 20.18 (LTS) for Server-Side Technology

## Status
Accepted

## Context

The personal portfolio project requires a reliable, modern, and well-supported server-side runtime to handle backend operations such as serving API requests, managing assets, and other server-side functionalities.

The latest LTS version of Node.js, 20.18, was released and offers enhanced features, long-term support, security improvements, and an active ecosystem of tools and libraries.

Key considerations include:

- **LTS (Long-Term Support)**: Node.js 20.18 is a stable release with extended support through to 2026, ensuring critical security and maintenance updates.
- **Performance**: Node.js 20.x versions bring optimizations that improve runtime performance, making it a good fit for serving both static and dynamic content efficiently.
- **Ecosystem**: The Node.js ecosystem is mature, providing a rich set of libraries and frameworks for rapid development, including those necessary for server-side rendering and API development.
- **Compatibility**: Most Node.js tools and frameworks (e.g., Express.js, Next.js) are already compatible with Node.js 20.x, ensuring ease of use and minimal friction in the setup.

## Decision

The project will use **Node.js 20.18 (LTS)** as the primary server-side runtime for the backend of the portfolio website.

## Alternatives Considered

1. **Node.js 18.x (LTS)**

   - Pros: Another long-term supported version with stability and ecosystem support.
   - Cons: Node.js 20.x offers more up-to-date features, optimizations, and improvements.

2. **Python (Flask/Django)**

   - Pros: Python is a widely used backend language with popular web frameworks like Flask and Django.
   - Cons: Not as performant in handling asynchronous, non-blocking I/O as Node.js, making it less suited for real-time or highly concurrent tasks.

3. **Ruby on Rails**
   - Pros: Rails offers a mature ecosystem and convention-over-configuration philosophy for web applications.
   - Cons: Ruby has less concurrency handling compared to Node.js and is slower in terms of performance for backend tasks.

## Consequences

By choosing Node.js 20.18, we ensure that:

- We are building on a well-supported and stable version with long-term maintenance guarantees.
- We can leverage modern JavaScript/TypeScript features in both frontend and backend, leading to more consistency in codebases.
- We have access to the extensive Node.js ecosystem, including useful libraries for development, testing, and production environments.

Any future changes or updates will be evaluated when new major releases or significant breaking changes are introduced to Node.js.
