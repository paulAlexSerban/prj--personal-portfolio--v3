# Feature Requiremtns - Content Management

## Overview

The content pipeline synchronises MDX files into a database on each push to the content repository. A visual CMS allows the author to edit content without touching files. A lock mechanism ensures the two authoring surfaces never overwrite each other. The database is also directly inspectable via a studio tool.

| ID    | Requirement                                                                                                                                                                      | Priority    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| CM-01 | The content pipeline MUST ingest all MDX content types into the database on each run                                                                                             | Must Have   |
| CM-02 | The pipeline MUST skip any database entity that has been marked as CMS-owned (locked), preserving the CMS version                                                                | Must Have   |
| CM-03 | When the author saves any entity via the CMS, that entity MUST be marked as CMS-owned and excluded from future MDX ingest overwrites                                             | Must Have   |
| CM-04 | The author MUST be able to export a CMS-owned entity back to an MDX file via a CLI command, restoring MDX ownership                                                              | Must Have   |
| CM-05 | The pipeline MUST be triggerable automatically from CI on every push to the content repository, and also manually via a CLI command for local development and debugging purposes | Must Have   |
| CM-06 | The pipeline MUST be runnable manually from the CLI                                                                                                                              | Must Have   |
| CM-07 | The pipeline MUST be idempotent: running it multiple times on the same input MUST produce the same database state                                                                | Must Have   |
| CM-08 | The database MUST be inspectable via a visual studio tool accessible in the local development environment                                                                        | Must Have   |
| CM-09 | The CMS MUST display the ownership status (MDX-owned vs CMS-owned) of each entity as a read-only field                                                                           | Should Have |
| CM-10 | The pipeline SHOULD support a dry-run mode that reports planned changes without writing to the database                                                                          | Should Have |
| CM-11 | The pipeline SHOULD produce a structured summary on each run: records inserted, updated, skipped, and errored                                                                    | Should Have |
