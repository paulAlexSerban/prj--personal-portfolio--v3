### Drizzle ORM Schema

```typescript
// tools/pipeline/src/schema/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ── Profile ────────────────────────────────────────────────────────────────
export const profile = sqliteTable('profile', {
  id:           text('id').primaryKey(),              // ULID
  name:         text('name').notNull(),
  headline:     text('headline').notNull(),
  bio:          text('bio').notNull(),
  photo_url:    text('photo_url'),
  github_url:   text('github_url'),
  linkedin_url: text('linkedin_url'),
  sync_source:  text('sync_source').default('mdx'),   // 'mdx' | 'cms'
  locked:       integer('locked', { mode: 'boolean' }).default(false),
  updated_at:   integer('updated_at', { mode: 'timestamp' }),
});

// ── Skills ─────────────────────────────────────────────────────────────────
export const skills = sqliteTable('skills', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  category:    text('category').notNull(),            // 'language'|'framework'|'tool'|'platform'
  sort_order:  integer('sort_order').default(0),
  sync_source: text('sync_source').default('mdx'),
  locked:      integer('locked', { mode: 'boolean' }).default(false),
});

// ── Projects ───────────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
  id:               text('id').primaryKey(),
  slug:             text('slug').notNull().unique(),
  title:            text('title').notNull(),
  description:      text('description').notNull(),    // MDX body
  tech_stack:       text('tech_stack'),               // JSON string[]
  role:             text('role'),
  start_date:       text('start_date'),               // ISO date string
  end_date:         text('end_date'),                 // null = ongoing
  github_url:       text('github_url'),
  live_url:         text('live_url'),
  cover_image_url:  text('cover_image_url'),
  featured:         integer('featured', { mode: 'boolean' }).default(false),
  sort_order:       integer('sort_order').default(0),
  sync_source:      text('sync_source').default('mdx'),
  locked:           integer('locked', { mode: 'boolean' }).default(false),
  updated_at:       integer('updated_at', { mode: 'timestamp' }),
});

// ── Posts ──────────────────────────────────────────────────────────────────
export const posts = sqliteTable('posts', {
  id:           text('id').primaryKey(),
  slug:         text('slug').notNull().unique(),
  type:         text('type').notNull(),               // 'post'|'book-note'|'snippet'
  title:        text('title').notNull(),
  body:         text('body').notNull(),               // raw MDX source
  excerpt:      text('excerpt'),
  tags:         text('tags'),                         // JSON string[]
  published_at: integer('published_at', { mode: 'timestamp' }),
  updated_at:   integer('updated_at', { mode: 'timestamp' }),
  sync_source:  text('sync_source').default('mdx'),
  locked:       integer('locked', { mode: 'boolean' }).default(false),
});

// ── Questions ──────────────────────────────────────────────────────────────
export const questions = sqliteTable('questions', {
  id:          text('id').primaryKey(),
  slug:        text('slug').notNull().unique(),       // {post-slug}--{uuid5}
  post_slug:   text('post_slug')
                 .notNull()
                 .references(() => posts.slug),
  front:       text('front').notNull(),
  back:        text('back').notNull(),
  tags:        text('tags'),                          // JSON string[]
  sync_source: text('sync_source').default('mdx'),
  locked:      integer('locked', { mode: 'boolean' }).default(false),
  created_at:  integer('created_at', { mode: 'timestamp' }),
  updated_at:  integer('updated_at', { mode: 'timestamp' }),
});
```

### Entity Relationships

```
profile     (1 row — singleton)

skills      (many rows)

projects    (many rows)
  └── slug: unique, immutable

posts       (many rows)
  └── slug: unique, immutable
  └── type: 'post' | 'book-note' | 'snippet'

questions   (many rows)
  └── post_slug → posts.slug  (many-to-one)
  └── slug: "{post-slug}--{uuid5}" (encodes relationship in filename)
```

### The `locked` / `sync_source` Contract

Every entity table carries two control columns:

| Column        | Type             | Meaning                                               |
| ------------- | ---------------- | ----------------------------------------------------- |
| `sync_source` | `'mdx' \| 'cms'` | Which surface last wrote this entity                  |
| `locked`      | boolean          | If `true`, the MDX ingest pipeline MUST skip this row |

**Transitions:**

| Event                              | `sync_source` | `locked` |
| ---------------------------------- | ------------- | -------- |
| MDX ingest (new entity)            | `'mdx'`       | `false`  |
| MDX ingest (existing, unlocked)    | `'mdx'`       | `false`  |
| Directus save hook fires           | `'cms'`       | `true`   |
| `pipeline export --slug` completes | `'mdx'`       | `false`  |