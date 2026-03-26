# ADR-002: JS Runtime
## Status: Proposed

## Context
The project requires a server-side runtime to handle the build system, API routes, and any server-side logic needed for the portfolio website. The runtime should be well-supported, performant, and compatible with the chosen programming language (TypeScript) and frameworks.

## Options Considered
1. Node.js
2. Deno
3. Bun

## Option Analysis
### 1. Node.js
| Strengths                                                                                                          | Weaknesses                     | When it makes sense                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Ubiquitous JavaScript runtime with excellent ecosystem support for all required libraries and frameworks (FE + BE) | None significant at this time. | You want a stable, widely adopted runtime with strong community support and compatibility with all necessary tools. |
| Excellent performance and scalability for server-side applications.                                                |                                | You want to leverage the extensive Node.js ecosystem for both frontend and backend development.                     |
| Long-term support (LTS) versions ensure stability and security updates.                                            |                                | You want to ensure long-term maintainability and security for your backend services.                                |
| Native support for TypeScript through tools like ts-node and excellent integration with build tools.               |                                | You want seamless TypeScript support without needing to manage complex configurations.                              |

### 2. Deno
| Strengths                                                              | Weaknesses                                 | When it makes sense                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Modern runtime with built-in TypeScript support and security features. | Less mature ecosystem compared to Node.js. | You want a modern runtime with first-class TypeScript support and enhanced security features.      |
| Built-in utilities for testing, formatting, and linting.               |                                            | You want an all-in-one runtime that includes development tools out of the box.                     |
| Improved security model with sandboxing and explicit permissions.      |                                            | You want to prioritize security and are comfortable with a newer runtime with a smaller ecosystem. |
|                                                                        |                                            | You are okay with potential compatibility issues with existing libraries and tools.                |

### 3. Bun
| Strengths                                                              | Weaknesses                                 | When it makes sense                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Fast JavaScript runtime with a focus on performance.                   | Less mature ecosystem compared to Node.js. | You want a high-performance runtime and are comfortable with a newer, less established ecosystem.      |
| Built-in bundler and task runner.                                                   |                                            | You want an integrated solution for development and build processes.                     |
| Native support for TypeScript.                                                   |                                            | You want seamless TypeScript support with a focus on performance.                     |
|                                                                        |                                            | You are okay with potential compatibility issues with existing libraries and tools.                |    

## Decision
After evaluating the options, **Node.js** has been chosen as the JavaScript runtime for the project. This decision is based on Node.js’s ubiquity, excellent ecosystem support, long-term stability, and native compatibility with TypeScript. Node.js provides a robust and well-supported environment for both frontend and backend development, making it the optimal choice for the portfolio project.

## Consequences
- The project will leverage Node.js for all server-side logic, including the build system and API routes, ensuring compatibility with the chosen programming language and frameworks.
- Developers will benefit from the extensive ecosystem of libraries and tools available for Node.js, which will facilitate development and integration across the stack.
- The use of Node.js will ensure long-term maintainability and security, as it is a widely adopted runtime with regular updates and a strong community.
- The project will not take advantage of some of the modern features and security enhancements offered by newer runtimes like Deno, but the stability and ecosystem support of Node.js outweigh these considerations for the needs of this project.