# ADR-000: DB Tooling & ORM
## Status: Approved

## Context
The project requires tooling and and ORM for interacting with the SQLite database.

## Decision
We will use Drizzle ORM for the project.

## Why
Drizzle ORM is a mature and well-supported ORM for SQLite. It is built-in to the project and provides a simple and easy-to-use API for interacting with the database. It is also compatible with the project's TypeScript-first approach.

## How
We will use the following tools:
- Drizzle ORM
- Drizzle Studio
- Drizzle Kit
- Drizzle Orm
- Drizzle Orm for the project.

## Considered Alternatives
- Prisma ORM - Rejected becasue database abstractions are too high level for the project's needs - more SQL like syntax is preferred for the project's needs.
- TypeORM - Rejected because it is not a mature and well-supported ORM for SQLite.
