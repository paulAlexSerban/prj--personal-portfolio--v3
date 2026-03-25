# Feature Requiremtns - Content Authoring

## Overview

The conent repository is the primary authoring interface. The author writes MDX files locally and pushes to Git. The pipeline synchronises those files into the database. A CMS provides an optional visual editing fallback.

| ID    | Requirement                                                                                                                                                                           | Priority    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| CA-01 | The author must be able to create and edit all content types (posts, book-notes, snippets, projects, questions, profile, skills), by wirting MDX files in the content Git repository. | Must Have   |
| CA-02 | Poosts, book-notes, snippets, projects, and questions MUST each reside in their ouw subdirectory of the content repository.                                                           | Must Have   |
| CA-03 | Question files MUST follow the naming convention `{POST_SLUG}--{uuid[:5]}.mdx`, which encodes the parent post relationship in the filename                                            | Must Have   |
| CA-04 | Post and project slugs MUST be unique across their respoective content types and MUST NOT change after first publication                                                              | Must Have   |
| CA-05 | Home page content must be manageable via a single `home.mdx` file                                                                                                                     | Must Have   |
| CA-06 | The pipeline MUST validate the question filename convention and warn on violations during ingest                                                                                      | Should Have |
| CA-07 | Content SHOULD support optional tags (array of strings) on posts, book-notes, snippets, and projects                                                                                  | Should Have |
| CA-08 | Posts and book-notes SHOULD support an optional excerpt field                                                                                                                         | Should Have |

## Content Types and Minimum Required Fields

| Content Type | Required Fields                                                             |
| ------------ | --------------------------------------------------------------------------- |
| Post         | title, subheading, excerpt, tags, date, author, content                     |
| Book Note    | title, subheading, excerpt, tags, date, author, content                     |
| Snippet      | title, subheading, excerpt, tags, date, author, content                     |
| Project      | title, subheading, excerpt, tags, date, author, gitRepo, demoUrl, caseStudy |
| Question     | question, tags, date, author, content                                       |
| Home         | title, subheading, content                                                  |
