# ADR-006: Database Engine
## Status: Approved

## Context
The project requires a database to store content and user state. The database should be simple to set up and maintain, require minimal infrastructure, and be compatible with the chosen headless CMS. The database should also be suitable for a single-author platform with no concurrent write requirements in v0.1, while allowing for an easy migration path to a more robust solution in the future if needed.

## Options Considered
1. SQLite
2. PostgreSQL
3. MongoDB
4. Firebase Realtime Database
5. Supabase
6. JSON files (file-based storage)

## Option Analysis
### 1. SQLite
| Strengths                                                                                        | Weaknesses                                       | When it makes sense                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero infrastructure; file-based; git-committable build artifact; natively supported by Directus. | Not suitable for multi-author concurrent writes. | You have a single author and no concurrent write requirements, and you want a simple, file-based database that can be easily committed to version control. Moving to Postgres in v0.2 is a one-line Drizzle config change. |
| --- IGNORE ---                                                                                   | --- IGNORE ---                                   | --- IGNORE ---                                                                                                                                                                                                             |

### 2. PostgreSQL
| Strengths                                                       | Weaknesses                                                         | When it makes sense                                                                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Robust, scalable, and widely used relational database.          | Requires more complex setup and infrastructure compared to SQLite. | You need a more robust database solution with support for concurrent writes and advanced features, and you are willing to manage the additional complexity. |
| Excellent support for complex queries and data integrity.       |                                                                    | You want to ensure data integrity and support for complex queries from the start, even if it adds overhead in terms of setup and maintenance.               |
| Can integratete with Directus and other headless CMS solutions. |                                                                    | You want to use a well-supported relational database that can grow with your project, even if it requires more initial setup and maintenance.               |
| --- IGNORE ---                                                  | --- IGNORE ---                                                     | --- IGNORE ---                                                                                                                                              |

### 3. MongoDB
| Strengths                                                     | Weaknesses                                                         | When it makes sense                                                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Flexible schema design and good for unstructured data.        | Requires more complex setup and infrastructure compared to SQLite. | You need a NoSQL database with flexible schema design and are willing to manage the additional complexity of setup and maintenance.             |
| Good support for horizontal scaling and high availability.    |                                                                    | You want a database solution that can scale horizontally and provide high availability, even if it requires more initial setup and maintenance. |
| Can integrate with Directus and other headless CMS solutions. |                                                                    | You want to use a NoSQL database that can grow with your project, even if it requires more initial setup and maintenance.                       |
| --- IGNORE ---                                                | --- IGNORE ---                                                     | --- IGNORE ---                                                                                                                                  |

### 4. Firebase Realtime Database
| Strengths                                                                     | Weaknesses                                                               | When it makes sense                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real-time data synchronization and easy integration with frontend frameworks. | Vendor lock-in and potential scalability issues for larger applications. | You need real-time data synchronization and are comfortable with the trade-offs of using a managed service with potential vendor lock-in.                           |
| Good for applications with simple data models and real-time requirements.     |                                                                          | You want a managed solution that provides real-time capabilities out of the box, even if it may not be suitable for larger applications or complex data models.     |
| Can integrate with Directus and other headless CMS solutions.                 |                                                                          | You want to use a managed database solution that can provide real-time capabilities, even if it may not be suitable for larger applications or complex data models. |
| --- IGNORE ---                                                                | --- IGNORE ---                                                           | --- IGNORE ---                                                                                                                                                      |

### 5. Supabase
| Strengths                                                                                 | Weaknesses                                                         | When it makes sense                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open-source Firebase alternative with built-in authentication and real-time capabilities. | Requires more complex setup and infrastructure compared to SQLite. | You need a managed database solution with built-in authentication and real-time capabilities, and you are willing to manage the additional complexity of setup and maintenance.        |
| Good for applications that require authentication and real-time features.                 |                                                                    | You want a managed solution that provides authentication and real-time capabilities out of the box, even if it may not be suitable for larger applications or complex data models.     |
| Can integrate with Directus and other headless CMS solutions.                             |                                                                    | You want to use a managed database solution that can provide authentication and real-time capabilities, even if it may not be suitable for larger applications or complex data models. |
| --- IGNORE ---                                                                            | --- IGNORE ---                                                     | --- IGNORE ---                                                                                                                                                                         |

### 6. JSON files (file-based storage)
| Strengths                                                       | Weaknesses                                             | When it makes sense                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple to set up and use; no infrastructure required.           | Not suitable for concurrent writes or complex queries. | You have a single author and no concurrent write requirements, and you want a simple, file-based storage solution that can be easily committed to version control. Moving to a more robust database in the future is possible but may require significant refactoring. |
| Can be easily committed to version control and edited directly. |                                                        | You want a simple, file-based storage solution that can be easily committed to version control and edited directly, even if it may not be suitable for larger applications or complex data models.                                                                     |
| --- IGNORE ---                                                  | --- IGNORE ---                                         | --- IGNORE ---                                                                                                                                                                                                                                                         |

## Decision
After evaluating the options, **SQLite** has been chosen as the database engine for the project. This decision is based on the fact that the platform has a single author and no concurrent write requirements in v0.1, making SQLite a suitable choice due to its simplicity, zero infrastructure requirements, and native support in Directus. Additionally, SQLite can be easily committed as a build artifact, allowing for straightforward version control. The project can migrate to PostgreSQL in v0.2 with a simple one-line configuration change in Drizzle, providing a clear path for future scalability if needed.

## Consequences
- The project will use SQLite as the sole database for v0.1, which is suitable for a single-author platform with no concurrent write requirements.
- The use of SQLite allows for a simple setup and maintenance process, as it is file-based and requires no additional infrastructure.
- The database can be committed as a build artifact, enabling easy version control and tracking of changes to the database schema and content.
- The project will not be suitable for multi-author concurrent writes in v0.1, but this is an accepted trade-off given the current requirements and the ease of migration to a more robust database solution in the future if needed.
- The project will have a clear migration path to PostgreSQL in v0.2, allowing for scalability and support for concurrent writes as the platform evolves and potentially adds more authors or users.
- The choice of SQLite aligns well with the project's goals of simplicity and ease of use while providing a solid foundation for future growth and scalability.