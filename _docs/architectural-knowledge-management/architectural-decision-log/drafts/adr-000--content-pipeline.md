
### 5.1 Architecture

```
tools/pipeline/
├── src/
│   ├── ingest.ts          # MDX → SQLite
│   ├── export.ts          # SQLite → MDX
│   ├── validate.ts        # Filename convention lint
│   ├── parsers/
│   │   ├── post.ts
│   │   ├── project.ts
│   │   ├── question.ts
│   │   ├── profile.ts
│   │   └── skills.ts
│   └── schema/
│       └── schema.ts      # Drizzle schema (source of truth)
└── bin/
    └── pipeline.ts        # CLI entrypoint
```

### 5.2 Ingest (MDX → SQLite)

**CLI:** `pipeline ingest [--dry-run] [--content-dir <path>]`

**Algorithm:**
```
for each MDX file in content repo:
  1. Parse frontmatter + body using `gray-matter` + `remark`
  2. Validate required fields; log error and skip if invalid
  3. For question files: extract post_slug from filename
     "{post-slug}--{uuid5}.mdx" → split on '--', take left part
  4. Check DB for existing row by slug
  5. If row exists and locked = true → SKIP (log: "skipped: cms-owned")
  6. If row exists and locked = false → UPDATE within transaction
  7. If row does not exist → INSERT within transaction
  8. Set sync_source = 'mdx', locked = false on write
```

**Transactions:** All writes for a single run are wrapped in a single SQLite transaction. On any error the entire transaction is rolled back.

**Dry-run:** `--dry-run` flag runs the full algorithm but calls `console.log` instead of writing to the DB. Returns a structured report.

**Question slug validation (CI lint step):**
```
Filename must match: /^[a-z0-9-]+--[a-z0-9]{5}\.mdx$/
post_slug must exist in posts table after ingest
Violation → warning logged; question skipped
```

### 5.3 Export (SQLite → MDX)

**CLI:** `pipeline export --slug <slug> [--force]`

**Algorithm:**
```
1. Look up entity by slug across all tables
2. Serialise DB row back to MDX frontmatter + body
3. If target MDX file exists and --force not set → prompt for confirmation
4. Write MDX file to correct directory in content repo
5. UPDATE DB row: sync_source = 'mdx', locked = false
```

### 5.4 Pipeline State Machine

```
[MDX file]
    │
    ▼  pipeline ingest
[DB: sync_source='mdx', locked=false]
    │
    │  author edits in Directus → Directus hook fires
    ▼
[DB: sync_source='cms', locked=true]
    │                               ▲
    │  pipeline ingest              │  (skipped — locked)
    │  (skips this row)             │
    │                               │
    │  pipeline export --slug       │
    ▼                               │
[MDX file written] ────────────────┘
[DB: sync_source='mdx', locked=false]
```

---