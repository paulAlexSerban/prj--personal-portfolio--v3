import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ── Tags ──────────────────────────────────────────────────────────────────────
export const tags = sqliteTable('tags', {
    id:   text('id').primaryKey(),       // ULID
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(), // kebab-case name
});

// content_type values that appear in content_tags (questions use question_tags)
export type ContentType =
    | 'post'
    | 'book-note'
    | 'snippet'
    | 'project'
    | 'coursework'
    | 'page';

// ── Content → Tag junction ────────────────────────────────────────────────────
export const content_tags = sqliteTable(
    'content_tags',
    {
        content_slug: text('content_slug').notNull(),
        tag_slug:     text('tag_slug').notNull().references(() => tags.slug, { onDelete: 'cascade' }),
        content_type: text('content_type').notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.content_slug, t.tag_slug] }),
    }),
);

// ── Profile ───────────────────────────────────────────────────────────────────
export const profile = sqliteTable('profile', {
    id:           text('id').primaryKey(),
    slug:         text('slug').notNull().unique().default('profile'),
    name:         text('name').notNull(),
    headline:     text('headline').notNull(),
    bio:          text('bio').notNull(),
    photo_url:    text('photo_url'),
    github_url:   text('github_url'),
    linkedin_url: text('linkedin_url'),
    sync_source:  text('sync_source').default('json'),
    locked:       integer('locked', { mode: 'boolean' }).default(false),
    updated_at:   integer('updated_at', { mode: 'timestamp' }),
});

// ── Skills ────────────────────────────────────────────────────────────────────
export const skills = sqliteTable('skills', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),
    name:        text('name').notNull(),
    category:    text('category').notNull(),
    sort_order:  integer('sort_order').default(0),
    sync_source: text('sync_source').default('json'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
});

// ── Posts (post | book-note | snippet) ───────────────────────────────────────
export const posts = sqliteTable('posts', {
    id:           text('id').primaryKey(),
    slug:         text('slug').notNull().unique(),
    type:         text('type').notNull(),     // 'post' | 'book-note' | 'snippet'
    title:        text('title').notNull(),
    body:         text('body').notNull(),
    subheading:   text('subheading'),
    excerpt:      text('excerpt'),
    author:       text('author'),
    date:         text('date'),
    pinned:       integer('pinned', { mode: 'boolean' }).default(false),
    status:       text('status').notNull(),
    sync_source:  text('sync_source').default('mdx'),
    locked:       integer('locked', { mode: 'boolean' }).default(false),
    published_at: integer('published_at', { mode: 'timestamp' }),
    updated_at:   integer('updated_at', { mode: 'timestamp' }),
});

// ── Projects ──────────────────────────────────────────────────────────────────
export const projects = sqliteTable('projects', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),
    title:       text('title').notNull(),
    body:        text('body').notNull(),
    subheading:  text('subheading'),
    excerpt:     text('excerpt'),
    repo_url:    text('repo_url'),
    demo_url:    text('demo_url'),
    status:      text('status').notNull(),
    pinned:      integer('pinned', { mode: 'boolean' }).default(false),
    priority:    integer('priority').default(0),
    sync_source: text('sync_source').default('mdx'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
    updated_at:  integer('updated_at', { mode: 'timestamp' }),
});

// ── Coursework ────────────────────────────────────────────────────────────────
export const coursework = sqliteTable('coursework', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),
    title:       text('title').notNull(),
    body:        text('body').notNull(),
    subheading:  text('subheading'),
    excerpt:     text('excerpt'),
    repo_url:    text('repo_url'),
    status:      text('status').notNull(),
    pinned:      integer('pinned', { mode: 'boolean' }).default(false),
    priority:    integer('priority').default(0),
    section:     text('section'),
    sync_source: text('sync_source').default('mdx'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
    updated_at:  integer('updated_at', { mode: 'timestamp' }),
});

// ── Pages (JSON-authored static pages) ───────────────────────────────────────
export const pages = sqliteTable('pages', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),
    title:       text('title').notNull(),
    body:        text('body').notNull(),       // serialised JSON page payload
    status:      text('status').notNull(),
    sync_source: text('sync_source').default('json'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
    updated_at:  integer('updated_at', { mode: 'timestamp' }),
});

// ── Questions ─────────────────────────────────────────────────────────────────
export const questions = sqliteTable('questions', {
    id:          text('id').primaryKey(),
    slug:        text('slug').notNull().unique(),
    post_slug:   text('post_slug').notNull().references(() => posts.slug),
    front:       text('front').notNull(),
    back:        text('back').notNull(),
    status:      text('status').notNull(),
    sync_source: text('sync_source').default('mdx'),
    locked:      integer('locked', { mode: 'boolean' }).default(false),
    created_at:  integer('created_at', { mode: 'timestamp' }),
    updated_at:  integer('updated_at', { mode: 'timestamp' }),
});

// ── Question → Tag junction ───────────────────────────────────────────────────
export const question_tags = sqliteTable(
    'question_tags',
    {
        question_slug: text('question_slug').notNull().references(() => questions.slug, { onDelete: 'cascade' }),
        tag_slug:      text('tag_slug').notNull().references(() => tags.slug, { onDelete: 'cascade' }),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.question_slug, t.tag_slug] }),
    }),
);

// ── Inferred types ────────────────────────────────────────────────────────────
export type TagRow          = typeof tags.$inferSelect;
export type NewTagRow       = typeof tags.$inferInsert;
export type ContentTagRow   = typeof content_tags.$inferSelect;
export type NewContentTagRow = typeof content_tags.$inferInsert;
export type ProfileRow      = typeof profile.$inferSelect;
export type NewProfileRow   = typeof profile.$inferInsert;
export type SkillRow        = typeof skills.$inferSelect;
export type NewSkillRow     = typeof skills.$inferInsert;
export type PostRow         = typeof posts.$inferSelect;
export type NewPostRow      = typeof posts.$inferInsert;
export type ProjectRow      = typeof projects.$inferSelect;
export type NewProjectRow   = typeof projects.$inferInsert;
export type CourseworkRow   = typeof coursework.$inferSelect;
export type NewCourseworkRow = typeof coursework.$inferInsert;
export type QuestionRow     = typeof questions.$inferSelect;
export type NewQuestionRow  = typeof questions.$inferInsert;
export type QuestionTagRow  = typeof question_tags.$inferSelect;
export type NewQuestionTagRow = typeof question_tags.$inferInsert;
export type PageRow         = typeof pages.$inferSelect;
export type NewPageRow      = typeof pages.$inferInsert;
