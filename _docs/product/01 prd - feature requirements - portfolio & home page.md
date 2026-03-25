# Feature Requiremtns - Portfolio & Home Page

## Overview

The home page is the author's professional landing page — the primary entry point for recruiters and collaborators. It showcases the author's identity, skills, and selected projects. A dedicated portfolio page provides a complete view of the author's work. Both share the site-wide navigation.

## Navigation

| ID     | Requirement                                                                         | Priority    |
| ------ | ----------------------------------------------------------------------------------- | ----------- |
| NAV-01 | The site MUST have a persistent global navigation bar present on all pages          | Must Have   |
| NAV-02 | The navigation MUST include links to: Home, Portfolio, Blog, and the Quiz App       | Must Have   |
| NAV-03 | The navigation MUST visually indicate the currently active page                     | Must Have   |
| NAV-04 | The navigation MUST be fully responsive across desktop and mobile viewports         | Must Have   |
| NAV-05 | The navigation SHOULD include a link to the author's GitHub and/or LinkedIn profile | Should Have |

## Home Page (`/`)

| ID      | Requirement                                                                                                                                                            | Priority    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| HOME-01 | The home page MUST render an About Me section containing: author name, professional headline, short bio, and profile photo                                             | Must Have   |
| HOME-02 | The home page MUST render a Skills section listing technical skills grouped by category                                                                                | Must Have   |
| HOME-03 | The home page MUST render a Projects section showcasing a curated selection of the author's work                                                                       | Must Have   |
| HOME-04 | Each project entry in the Projects section MUST display: name, short description, primary tech stack, and at least one external link (GitHub, live URL, or case study) | Must Have   |
| HOME-05 | All home page content (bio, skills, projects) MUST be driven by the content pipeline — no values hardcoded in templates                                                | Must Have   |
| HOME-06 | The home page MUST include a call-to-action linking to the full Portfolio page                                                                                         | Should Have |
| HOME-07 | The home page SHOULD include a Recent Posts section showing the 3–5 most recently published blog posts                                                                 | Should Have |
| HOME-08 | Project entries in the Projects section SHOULD support an optional thumbnail or cover image                                                                            | Should Have |

## Portfolio Page (`/portfolio`)

IDRequirementPriorityPORT-01The portfolio page MUST display the full list of the author's projects with more detail than the home page previewMPORT-02Each portfolio project MUST support: title, long-form description (MDX), tech stack, role, dates, and one or more linksMPORT-03Projects marked as featured MUST appear before non-featured projects in the listingMPORT-04The portfolio page SHOULD support filtering projects by tech stack tagSPORT-05Each project SHOULD support an optional cover image or screenshotS

| ID      | Requirement                                                                                                             | Priority    |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| PORT-01 | The portfolio page MUST display the full list of the author's projects with more detail than the home page preview      | Must Have   |
| PORT-02 | Each portfolio project MUST support: title, long-form description (MDX), tech stack, role, dates, and one or more links | Must Have   |
| PORT-03 | Projects marked as featured MUST appear before non-featured projects in the listing                                     | Must Have   |
| PORT-04 | The portfolio page SHOULD support filtering projects by tech stack tags                                                 | Should Have |
| PORT-05 | Each project SHOULD support an optional cover image or screenshot                                                       | Should Have |
