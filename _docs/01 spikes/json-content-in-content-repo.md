# JSON content authoring guide

Guide for the **content repository** (`content--paulserban.eu`). Site config that is **not** prose - profile, skills, career experience, and standalone pages - is authored as **JSON** under `content/publish/`. The monorepo ingests it via `tools/json-ingest`.

**Not JSON:** posts, book notes, snippets, projects, coursework, and **all quiz questions** are **MDX** (`tools/mdx-ingest`). See [migrating-question-mdx-content](./migrating-question-mdx-content.md).

---

## Where files live

After `content-sync`, the monorepo reads from `content/live/content/publish/`. In the content repo, mirror this layout:

```
content/
  publish/
    profile/
      profile.json          ← singleton site identity
    skills/
      skills.json           ← one file, many skills
    experience/
      experience.json       ← one file, many roles
    pages/
      about.json            ← one JSON file per page (optional)
      …
    posts/                  ← MDX (not json-ingest)
    projects/               ← MDX (not json-ingest)
    questions/              ← MDX (not json-ingest)
  in-progress/
  backlog/
```

| Folder under `publish/` | Ingest tool   | DB table     |
| ----------------------- | ------------- | ------------ |
| `profile/`              | `json-ingest` | `profile`    |
| `skills/`               | `json-ingest` | `skills`     |
| `experience/`           | `json-ingest` | `experience` |
| `pages/`                | `json-ingest` | `pages`      |
| everything else         | `mdx-ingest`  | (varies)     |

Invalid or incomplete JSON is **skipped with a warning** - ingest continues for other files.

---

## `profile/` - site identity (singleton)

**Path:** `content/publish/profile/profile.json` (filename is conventional; slug is always `profile`)

**Required:** `name`, `headline`, `bio`

**Optional:** `photo_url`, `github_url`, `linkedin_url`

```json
{
  "name": "Paul Serban",
  "headline": "Senior AI & full-stack engineer building agentic platforms that scale.",
  "bio": "6+ years turning complex architectural constraints into production systems…",
  "photo_url": "/portrait.svg",
  "github_url": "https://github.com/paulAlexSerban",
  "linkedin_url": "https://www.linkedin.com/in/paulalexs/"
}
```

| Field          | Type   | Notes                                      |
| -------------- | ------ | ------------------------------------------ |
| `name`         | string | Display name on home / about                 |
| `headline`     | string | One-line professional headline             |
| `bio`          | string | Short bio paragraph                        |
| `photo_url`    | string | Path or URL to profile image               |
| `github_url`   | string | GitHub profile link                        |
| `linkedin_url` | string | LinkedIn profile link                      |

Only one profile row is stored (`slug = "profile"`). Re-ingest updates the same row.

---

## `skills/` - grouped skill list

**Path:** `content/publish/skills/skills.json`

**Shape:** a **JSON array**, or an object `{ "skills": [ … ] }`.

Each item:

| Field         | Required | Type    | Default | Notes                                      |
| ------------- | -------- | ------- | ------- | ------------------------------------------ |
| `name`        | yes      | string  | -       | Display name; slug = kebab-case of name    |
| `category`    | yes      | string  | -       | Group heading (e.g. `"Frontend"`)          |
| `sort_order`  | no       | number  | `0`     | Order within category (lower first)        |
| `proficiency` | no       | number  | `0`     | Reserved for future UI                     |
| `depth_note`  | no       | string  | -       | One-line depth / impact note for the skill |

**Slug rule:** `name` -> lowercase, non-alphanumeric -> `-` (e.g. `"Node.js"` -> `node-js`).

```json
[
  {
    "name": "Python",
    "category": "AI & Backend",
    "sort_order": 1,
    "depth_note": "AI/agent workflows on AWS Bedrock & AgentCore - turning LLMs into production test automation."
  },
  {
    "name": "TypeScript",
    "category": "AI & Backend",
    "sort_order": 3,
    "depth_note": "End-to-end type safety across MERN monorepos."
  },
  {
    "name": "React",
    "category": "Frontend",
    "sort_order": 1,
    "depth_note": "Component architecture for high-traffic platforms."
  }
]
```

Wrapped form (equivalent):

```json
{
  "skills": [
    { "name": "AWS", "category": "Cloud & Platform", "sort_order": 1 }
  ]
}
```

---

## `experience/` - career timeline

**Path:** `content/publish/experience/experience.json`

**Shape:** a **JSON array**, or an object `{ "experience": [ … ] }`.

Each item:

| Field        | Required | Type     | Default              | Notes                                           |
| ------------ | -------- | -------- | -------------------- | ----------------------------------------------- |
| `role`       | yes      | string   | -                    | Job title                                       |
| `company`    | yes      | string   | -                    | Employer / client name                          |
| `start_date` | yes      | string   | -                    | Free-text date (e.g. `"Apr 2024"`, `"2020"`)    |
| `status`     | yes      | string   | -                    | e.g. `"published"` or `"draft"`                 |
| `slug`       | no       | string   | derived from role+co | Stable URL key; set explicitly when possible    |
| `end_date`   | no       | string   | `null`               | `null` = current role                           |
| `summary`    | no       | string   | -                    | Longer role description                         |
| `tech`       | no       | string[] | -                    | Tech stack tags for the role                    |
| `location`   | no       | string   | -                    | e.g. `"Bucharest, Romania"`                     |
| `sort_order` | no       | number   | `0`                  | Display order (lower first)                     |

**Slug rule:** use `slug` when set; otherwise kebab-case of `{role}-{company}`.

```json
[
  {
    "slug": "senior-engineer-fanduel-betfair",
    "role": "Senior Software Engineer",
    "company": "FanDuel @ Betfair Romania",
    "start_date": "Apr 2024",
    "end_date": null,
    "summary": "Architected and led an AI-powered testing platform…",
    "tech": ["Python", "AWS Bedrock", "Node.js", "React", "Kubernetes"],
    "location": "Bucharest, Romania",
    "sort_order": 1,
    "status": "published"
  },
  {
    "slug": "frontend-engineer-cognizant-netcentric",
    "role": "Front-End Software Engineer",
    "company": "Cognizant Netcentric",
    "start_date": "Nov 2019",
    "end_date": "Apr 2024",
    "summary": "Built enterprise front-ends on Adobe Experience Manager…",
    "tech": ["TypeScript", "React", "Vite", "SCSS"],
    "location": "Bucharest, Romania",
    "sort_order": 2,
    "status": "published"
  }
]
```

---

## `pages/` - JSON-authored static pages

**Path:** `content/publish/pages/{slug}.json` - **one page per file**.

**Required:** `title`, `status`

**Optional:** `slug` - if omitted, slug = filename without `.json` (e.g. `about.json` -> `about`)

**Any other top-level fields** are stored in the DB `body` column as serialised JSON (not in dedicated columns). Use this for page-specific payload (sections, CTAs, metadata, etc.).

```json
{
  "title": "About",
  "status": "published",
  "slug": "about",
  "hero": {
    "heading": "About Paul",
    "subheading": "Engineer, builder, learner."
  },
  "sections": [
    {
      "type": "text",
      "content": "Longer page copy that does not belong in profile.bio."
    }
  ]
}
```

| Field    | Type   | Notes                                                |
| -------- | ------ | ---------------------------------------------------- |
| `title`  | string | Page title                                           |
| `status` | string | `"published"` or `"draft"`                           |
| `slug`   | string | URL segment; defaults to filename                    |
| `…`      | any    | Everything else -> `pages.body` in `content.db`       |

---

## Validation summary

| Content type | Required fields                          |
| ------------ | ---------------------------------------- |
| profile      | `name`, `headline`, `bio`                |
| skill        | `name`, `category` (per array item)      |
| experience   | `role`, `company`, `start_date`, `status` |
| page         | `title`, `status`                        |

Empty string counts as missing. Files with missing required fields are skipped.

---

## Ingest behaviour

- Rows are upserted with `sync_source: 'json'`.
- Rows marked `locked: true` in the DB (CMS-owned) are **not** overwritten by ingest.
- Run order locally / in CI: `content-sync` -> `json-ingest` (and `mdx-ingest` for MDX).

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start:dry-run
```

Override paths when testing fixtures:

```bash
export CONTENT_DIR="$(pwd)/frontend/sites/portfolio-site/test-content/publish"
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
```

---

## Related docs

- [migrating-question-mdx-content](./migrating-question-mdx-content.md) - quiz question MDX
- `tools/json-ingest/readme.md` - ingest task graph and CLI
- `tools/AGENTS.md` - full content pipeline
- `shared/db-schema/index.ts` - `profile`, `skills`, `experience`, `pages` columns
