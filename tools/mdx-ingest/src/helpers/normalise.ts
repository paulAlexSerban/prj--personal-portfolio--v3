import { ulid } from 'ulidx';
import type {
    NewPostRow,
    NewProjectRow,
    NewCourseworkRow,
    NewQuestionRow,
    NewTagRow,
    NewContentTagRow,
    NewQuestionTagRow,
    ContentType,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { ParsedFile } from './markdownParser.ts';

export type NormalisedRows = {
    posts: NewPostRow[];
    projects: NewProjectRow[];
    coursework: NewCourseworkRow[];
    questions: NewQuestionRow[];
    tags: NewTagRow[];
    contentTags: NewContentTagRow[];
    questionTags: NewQuestionTagRow[];
};

// ── Utilities ─────────────────────────────────────────────────────────────────

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);

const bool = (v: unknown): boolean => v === true || v === 'true' || v === 1;

const now = (): Date => new Date();

const toTagSlug = (name: string): string =>
    name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// ── Tag extraction ────────────────────────────────────────────────────────────

type TagAccumulator = {
    tagMap: Map<string, NewTagRow>;
    contentLinks: NewContentTagRow[];
    questionLinks: NewQuestionTagRow[];
};

const collectContentTags = (acc: TagAccumulator, rawTags: unknown, contentSlug: string, contentType: ContentType): void => {
    if (!Array.isArray(rawTags)) return;

    for (const raw of rawTags) {
        if (typeof raw !== 'string' || raw.trim() === '') continue;

        const name = raw.trim();
        const slug = toTagSlug(name);

        if (!acc.tagMap.has(slug)) {
            acc.tagMap.set(slug, { id: ulid(), name, slug });
        }

        acc.contentLinks.push({ content_slug: contentSlug, tag_slug: slug, content_type: contentType });
    }
};

const collectQuestionTags = (acc: TagAccumulator, rawTags: unknown, questionSlug: string): void => {
    if (!Array.isArray(rawTags)) return;

    for (const raw of rawTags) {
        if (typeof raw !== 'string' || raw.trim() === '') continue;

        const name = raw.trim();
        const slug = toTagSlug(name);

        if (!acc.tagMap.has(slug)) {
            acc.tagMap.set(slug, { id: ulid(), name, slug });
        }

        acc.questionLinks.push({ question_slug: questionSlug, tag_slug: slug });
    }
};

// ── Row builders ──────────────────────────────────────────────────────────────

const normalisePost = (file: ParsedFile, type: 'post' | 'book-note' | 'snippet'): NewPostRow => {
    const fm = file.frontmatter;
    return {
        id: ulid(),
        slug: file.slug,
        type,
        title: str(fm['title']) ?? file.slug,
        body: file.body,
        subheading: str(fm['subheading']),
        excerpt: str(fm['excerpt']),
        author: str(fm['author']),
        date: str(fm['date']),
        pinned: bool(fm['pinned']),
        status: str(fm['status']) ?? 'draft',
        sync_source: 'mdx',
        locked: false,
        published_at: str(fm['date']) ? new Date(str(fm['date'])!) : undefined,
        updated_at: now(),
    };
};

const normaliseProject = (file: ParsedFile): NewProjectRow => {
    const fm = file.frontmatter;
    return {
        id: ulid(),
        slug: file.slug,
        title: str(fm['title']) ?? file.slug,
        body: file.body,
        subheading: str(fm['subheading']),
        excerpt: str(fm['excerpt']),
        repo_url: str(fm['repo_url']),
        demo_url: str(fm['demo_url']),
        status: str(fm['status']) ?? 'draft',
        pinned: bool(fm['pinned']),
        priority: typeof fm['priority'] === 'number' ? fm['priority'] : 0,
        sync_source: 'mdx',
        locked: false,
        updated_at: now(),
    };
};

const normaliseCoursework = (file: ParsedFile): NewCourseworkRow => {
    const fm = file.frontmatter;
    return {
        id: ulid(),
        slug: file.slug,
        title: str(fm['title']) ?? file.slug,
        body: file.body,
        subheading: str(fm['subheading']),
        excerpt: str(fm['excerpt']),
        repo_url: str(fm['repo_url']),
        status: str(fm['status']) ?? 'draft',
        pinned: bool(fm['pinned']),
        priority: typeof fm['priority'] === 'number' ? fm['priority'] : 0,
        section: str(fm['section']),
        sync_source: 'mdx',
        locked: false,
        updated_at: now(),
    };
};

const normaliseQuestion = (file: ParsedFile): NewQuestionRow | null => {
    const fm = file.frontmatter;
    const parts = file.slug.split('--');

    if (parts.length < 2) {
        console.warn(`[normalise] Question "${file.slug}" doesn't follow {post-slug}--{uid} convention — skipping`);
        return null;
    }

    const post_slug = parts.slice(0, -1).join('--');

    return {
        id: ulid(),
        slug: file.slug,
        post_slug,
        front: str(fm['question']) ?? '',
        back: file.body.trim(),
        status: str(fm['status']) ?? 'draft',
        sync_source: 'mdx',
        locked: false,
        created_at: now(),
        updated_at: now(),
    };
};

// ── Main ──────────────────────────────────────────────────────────────────────

export const normalise = (files: ParsedFile[]): NormalisedRows => {
    const rows: NormalisedRows = {
        posts: [],
        projects: [],
        coursework: [],
        questions: [],
        tags: [],
        contentTags: [],
        questionTags: [],
    };

    const acc: TagAccumulator = { tagMap: new Map(), contentLinks: [], questionLinks: [] };

    for (const file of files) {
        switch (file.contentType) {
            case 'post': {
                rows.posts.push(normalisePost(file, 'post'));
                collectContentTags(acc, file.frontmatter['tags'], file.slug, 'post');
                break;
            }
            case 'booknote': {
                rows.posts.push(normalisePost(file, 'book-note'));
                collectContentTags(acc, file.frontmatter['tags'], file.slug, 'book-note');
                break;
            }
            case 'snippet': {
                rows.posts.push(normalisePost(file, 'snippet'));
                collectContentTags(acc, file.frontmatter['tags'], file.slug, 'snippet');
                break;
            }
            case 'project': {
                rows.projects.push(normaliseProject(file));
                collectContentTags(acc, file.frontmatter['tags'], file.slug, 'project');
                break;
            }
            case 'coursework': {
                rows.coursework.push(normaliseCoursework(file));
                collectContentTags(acc, file.frontmatter['tags'], file.slug, 'coursework');
                break;
            }
            case 'question': {
                const q = normaliseQuestion(file);
                if (q) {
                    rows.questions.push(q);
                    collectQuestionTags(acc, file.frontmatter['tags'], file.slug);
                }
                break;
            }
        }
    }

    rows.tags = Array.from(acc.tagMap.values());
    rows.contentTags = acc.contentLinks;
    rows.questionTags = acc.questionLinks;

    console.log(
        `[normalise] posts=${rows.posts.length}  projects=${rows.projects.length}  ` +
            `coursework=${rows.coursework.length}  questions=${rows.questions.length}  ` +
            `tags=${rows.tags.length}  contentLinks=${rows.contentTags.length}  questionLinks=${rows.questionTags.length}`
    );

    return rows;
};
