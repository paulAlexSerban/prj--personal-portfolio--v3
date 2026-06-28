import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@prj--personal-portfolio--v3/shared--db-schema';
import { buildQuizData } from './export.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createTestDb() {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    // Minimal DDL — mirrors the real Drizzle schema
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS content_tags (
            content_slug TEXT NOT NULL,
            tag_slug TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
            content_type TEXT NOT NULL,
            PRIMARY KEY (content_slug, tag_slug)
        );

        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            subheading TEXT,
            excerpt TEXT,
            cover_image TEXT,
            author TEXT,
            date TEXT,
            pinned INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            sync_source TEXT DEFAULT 'mdx',
            locked INTEGER DEFAULT 0,
            published_at INTEGER,
            updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            post_slug TEXT NOT NULL REFERENCES posts(slug),
            answer_format TEXT NOT NULL DEFAULT 'free_text',
            cognitive_style TEXT NOT NULL DEFAULT 'factual_recall',
            difficulty TEXT NOT NULL DEFAULT 'intermediate',
            grading_mode TEXT NOT NULL DEFAULT 'self',
            stem TEXT NOT NULL,
            payload TEXT,
            front TEXT NOT NULL,
            back TEXT NOT NULL,
            status TEXT NOT NULL,
            sync_source TEXT DEFAULT 'mdx',
            locked INTEGER DEFAULT 0,
            created_at INTEGER,
            updated_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS question_options (
            question_slug TEXT NOT NULL REFERENCES questions(slug) ON DELETE CASCADE,
            option_key TEXT NOT NULL,
            sort_order INTEGER NOT NULL,
            label TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            PRIMARY KEY (question_slug, option_key)
        );

        CREATE TABLE IF NOT EXISTS question_tags (
            question_slug TEXT NOT NULL REFERENCES questions(slug) ON DELETE CASCADE,
            tag_slug TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
            PRIMARY KEY (question_slug, tag_slug)
        );
    `);

    return drizzle(sqlite, { schema });
}

function insertPost(db: ReturnType<typeof createTestDb>, overrides: Partial<typeof schema.posts.$inferInsert> = {}) {
    const defaults: typeof schema.posts.$inferInsert = {
        id: 'post-1',
        slug: 'react-hooks',
        type: 'post',
        title: 'React Hooks',
        body: '',
        status: 'published',
    };
    db.insert(schema.posts)
        .values({ ...defaults, ...overrides })
        .run();
}

function insertQuestion(db: ReturnType<typeof createTestDb>, overrides: Partial<typeof schema.questions.$inferInsert> = {}) {
    const defaults: typeof schema.questions.$inferInsert = {
        id: 'q-1',
        slug: 'react-hooks--q1',
        post_slug: 'react-hooks',
        answer_format: 'free_text',
        cognitive_style: 'factual_recall',
        difficulty: 'intermediate',
        grading_mode: 'self',
        stem: 'What is useState?',
        front: 'What is useState?',
        back: 'A hook for local state.',
        status: 'published',
    };
    db.insert(schema.questions)
        .values({ ...defaults, ...overrides })
        .run();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildQuizData', () => {
    it('returns empty data when no published questions exist', async () => {
        const db = createTestDb();
        const result = await buildQuizData(db);
        expect(result.posts).toHaveLength(0);
        expect(result.questionsByPost.size).toBe(0);
    });

    it('excludes draft questions', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db, { status: 'draft' });
        const result = await buildQuizData(db);
        expect(result.posts).toHaveLength(0);
    });

    it('includes published free_text question with correct fields', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db);

        const result = await buildQuizData(db);
        expect(result.posts).toHaveLength(1);
        expect(result.posts[0]?.slug).toBe('react-hooks');
        expect(result.posts[0]?.questionCount).toBe(1);

        const qs = result.questionsByPost.get('react-hooks') ?? [];
        expect(qs).toHaveLength(1);
        const q = qs[0]!;
        expect(q.slug).toBe('react-hooks--q1');
        expect(q.answerFormat).toBe('free_text');
        expect(q.gradingMode).toBe('self');
        expect(q.options).toHaveLength(0);
        expect(q.answer).toBeNull();
    });

    it('attaches options for multiple_choice questions in sort_order', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db, {
            id: 'q-mc',
            slug: 'react-hooks--mc',
            answer_format: 'multiple_choice',
            grading_mode: 'auto',
            stem: 'Which hook manages state?',
            front: 'Which hook manages state?',
        });
        db.insert(schema.question_options)
            .values([
                { question_slug: 'react-hooks--mc', option_key: 'b', sort_order: 1, label: 'useEffect', is_correct: false },
                { question_slug: 'react-hooks--mc', option_key: 'a', sort_order: 0, label: 'useState', is_correct: true },
            ])
            .run();

        const result = await buildQuizData(db);
        const qs = result.questionsByPost.get('react-hooks') ?? [];
        const q = qs.find((x) => x.slug === 'react-hooks--mc')!;
        expect(q.answerFormat).toBe('multiple_choice');
        expect(q.gradingMode).toBe('auto');
        expect(q.options).toHaveLength(2);
        expect(q.options[0]!.key).toBe('a'); // sorted by sort_order
        expect(q.options[0]!.isCorrect).toBe(true);
        expect(q.options[1]!.key).toBe('b');
        expect(q.answer).toBeNull();
    });

    it('extracts true_false answer from payload', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db, {
            id: 'q-tf',
            slug: 'react-hooks--tf',
            answer_format: 'true_false',
            grading_mode: 'auto',
            stem: 'useState is a React hook.',
            front: 'useState is a React hook.',
            payload: JSON.stringify({ answer: true }),
        });

        const result = await buildQuizData(db);
        const qs = result.questionsByPost.get('react-hooks') ?? [];
        const q = qs.find((x) => x.slug === 'react-hooks--tf')!;
        expect(q.answerFormat).toBe('true_false');
        expect(q.answer).toBe(true);
        expect(q.options).toHaveLength(0);
    });

    it('attaches question tags', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db);
        db.insert(schema.tags).values({ id: 't1', name: 'React', slug: 'react' }).run();
        db.insert(schema.question_tags).values({ question_slug: 'react-hooks--q1', tag_slug: 'react' }).run();

        const result = await buildQuizData(db);
        const q = (result.questionsByPost.get('react-hooks') ?? [])[0]!;
        expect(q.tags).toContain('react');
    });

    it('attaches post tags and exposes them on the index entry', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db);
        db.insert(schema.tags).values({ id: 't2', name: 'JavaScript', slug: 'javascript' }).run();
        db.insert(schema.content_tags).values({ content_slug: 'react-hooks', tag_slug: 'javascript', content_type: 'post' }).run();

        const result = await buildQuizData(db);
        const post = result.posts.find((p) => p.slug === 'react-hooks')!;
        expect(post.tags).toContain('javascript');
    });

    it('handles malformed payload gracefully (null returned)', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db, { payload: 'not-valid-json' });

        const result = await buildQuizData(db);
        const q = (result.questionsByPost.get('react-hooks') ?? [])[0]!;
        expect(q.payload).toBeNull();
    });

    it('groups questions from the same post under the same key', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db, { id: 'q-a', slug: 'react-hooks--a' });
        insertQuestion(db, { id: 'q-b', slug: 'react-hooks--b' });

        const result = await buildQuizData(db);
        expect(result.posts).toHaveLength(1);
        expect(result.posts[0]!.questionCount).toBe(2);
        expect(result.questionsByPost.get('react-hooks')).toHaveLength(2);
    });

    it('splits questions across different posts', async () => {
        const db = createTestDb();
        insertPost(db, { id: 'p1', slug: 'post-a', title: 'Post A' });
        insertPost(db, { id: 'p2', slug: 'post-b', title: 'Post B' });
        insertQuestion(db, { id: 'q1', slug: 'post-a--q1', post_slug: 'post-a' });
        insertQuestion(db, { id: 'q2', slug: 'post-b--q1', post_slug: 'post-b' });

        const result = await buildQuizData(db);
        expect(result.posts).toHaveLength(2);
        expect(result.questionsByPost.get('post-a')).toHaveLength(1);
        expect(result.questionsByPost.get('post-b')).toHaveLength(1);
    });

    // ── questionsByTag ────────────────────────────────────────────────────────

    it('returns empty questionsByTag when no question has tags', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db);

        const result = await buildQuizData(db);
        expect(result.questionsByTag.size).toBe(0);
    });

    it('groups questions under their tag slug', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db);
        db.insert(schema.tags).values({ id: 't1', name: 'React', slug: 'react' }).run();
        db.insert(schema.question_tags).values({ question_slug: 'react-hooks--q1', tag_slug: 'react' }).run();

        const result = await buildQuizData(db);
        expect(result.questionsByTag.has('react')).toBe(true);
        expect(result.questionsByTag.get('react')).toHaveLength(1);
        expect(result.questionsByTag.get('react')![0]!.slug).toBe('react-hooks--q1');
    });

    it('a question tagged with two tags appears in both tag groups', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db);
        db.insert(schema.tags)
            .values([
                { id: 't1', name: 'React', slug: 'react' },
                { id: 't2', name: 'Hooks', slug: 'hooks' },
            ])
            .run();
        db.insert(schema.question_tags)
            .values([
                { question_slug: 'react-hooks--q1', tag_slug: 'react' },
                { question_slug: 'react-hooks--q1', tag_slug: 'hooks' },
            ])
            .run();

        const result = await buildQuizData(db);
        expect(result.questionsByTag.get('react')).toHaveLength(1);
        expect(result.questionsByTag.get('hooks')).toHaveLength(1);
    });

    it('multiple questions with the same tag are all listed under that tag', async () => {
        const db = createTestDb();
        insertPost(db);
        insertQuestion(db, { id: 'qa', slug: 'react-hooks--a' });
        insertQuestion(db, { id: 'qb', slug: 'react-hooks--b' });
        db.insert(schema.tags).values({ id: 't1', name: 'React', slug: 'react' }).run();
        db.insert(schema.question_tags)
            .values([
                { question_slug: 'react-hooks--a', tag_slug: 'react' },
                { question_slug: 'react-hooks--b', tag_slug: 'react' },
            ])
            .run();

        const result = await buildQuizData(db);
        expect(result.questionsByTag.get('react')).toHaveLength(2);
    });

    it('questionsByTag is empty when rows.length === 0', async () => {
        const db = createTestDb();
        const result = await buildQuizData(db);
        expect(result.questionsByTag.size).toBe(0);
    });
});
