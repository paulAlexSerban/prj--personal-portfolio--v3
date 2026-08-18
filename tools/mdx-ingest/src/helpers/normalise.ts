import { ulid } from 'ulidx';
import { buildQuestionOptionRows, buildQuestionPayload, deriveGradingMode, parseQuestionFrontmatter } from '@prj--personal-portfolio--v3/shared--question-contract';
import type {
    NewPostRow,
    NewProjectRow,
    NewCourseworkRow,
    NewQuestionRow,
    NewQuestionOptionRow,
    NewTagRow,
    NewContentTagRow,
    NewQuestionTagRow,
    NewCheatSheetRow,
    NewLearningPlanRow,
    ContentType,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { ParsedFile } from './markdownParser.ts';

export type NormalisedRows = {
    posts: NewPostRow[];
    projects: NewProjectRow[];
    coursework: NewCourseworkRow[];
    questions: NewQuestionRow[];
    questionOptions: NewQuestionOptionRow[];
    cheatSheets: NewCheatSheetRow[];
    learningPlans: NewLearningPlanRow[];
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
        cover: str(fm['cover']),
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

const serialiseMetrics = (raw: unknown): string | undefined => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') return JSON.stringify(raw);
    return undefined;
};

const PROJECT_MATURITY = ['concept', 'prototype', 'implemented', 'production-grade'] as const;
const PROJECT_SCOPE = ['component', 'service', 'system'] as const;
const DEFAULT_MATURITY = 'implemented';
const DEFAULT_SCOPE = 'service';

type ProjectMaturity = (typeof PROJECT_MATURITY)[number];
type ProjectScope = (typeof PROJECT_SCOPE)[number];

const enumValue = <T extends string>(raw: unknown, allowed: readonly T[], fallback: T, field: string, slug: string): T => {
    const value = str(raw)?.toLowerCase().trim();
    if (!value) return fallback;
    if ((allowed as readonly string[]).includes(value)) return value as T;
    console.warn(`[normalise] Project "${slug}": invalid ${field} "${raw}" - defaulting to "${fallback}"`);
    return fallback;
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
        cover: str(fm['cover']) ?? str(fm['cover']),
        role: str(fm['role']),
        problem: str(fm['problem']),
        approach: str(fm['approach']),
        outcome: str(fm['outcome']),
        metrics: serialiseMetrics(fm['metrics']),
        repo_url: str(fm['repo_url']),
        demo_url: str(fm['demo_url']),
        maturity: enumValue<ProjectMaturity>(fm['maturity'], PROJECT_MATURITY, DEFAULT_MATURITY, 'maturity', file.slug),
        scope: enumValue<ProjectScope>(fm['scope'], PROJECT_SCOPE, DEFAULT_SCOPE, 'scope', file.slug),
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

type NormalisedQuestion = {
    question: NewQuestionRow;
    options: NewQuestionOptionRow[];
};

const normaliseQuestion = (file: ParsedFile): NormalisedQuestion | null => {
    const parts = file.slug.split('--');

    if (parts.length < 2) {
        console.warn(`[normalise] Question "${file.slug}" doesn't follow {post-slug}--{uid} convention - skipping`);
        return null;
    }

    const parsed = parseQuestionFrontmatter(file.frontmatter);

    if (!parsed.ok) {
        console.warn(`[normalise] Question "${file.slug}": ${parsed.error}`);
        return null;
    }

    const fm = parsed.data;
    const post_slug = parts.slice(0, -1).join('--');

    if (file.parentPostSlug && file.parentPostSlug !== post_slug) {
        console.warn(`[normalise] Question "${file.slug}": parent folder "${file.parentPostSlug}" does not match filename post_slug "${post_slug}" - skipping`);
        return null;
    }

    const stem = fm.question;
    const body = file.body.trim();
    const grading_mode = deriveGradingMode(fm.answer_format);

    return {
        question: {
            id: ulid(),
            slug: file.slug,
            post_slug,
            answer_format: fm.answer_format,
            cognitive_style: fm.cognitive_style,
            difficulty: fm.difficulty,
            grading_mode,
            stem,
            payload: buildQuestionPayload(fm),
            front: stem,
            back: body,
            status: fm.status,
            sync_source: 'mdx',
            locked: false,
            created_at: now(),
            updated_at: now(),
        },
        options: buildQuestionOptionRows(file.slug, fm),
    };
};

const normaliseCompanion = (file: ParsedFile): NewCheatSheetRow | NewLearningPlanRow | null => {
    if (!file.parentPostSlug) {
        console.warn(`[normalise] Companion "${file.slug}" has no parent post slug - skipping`);
        return null;
    }

    const fm = file.frontmatter;
    const itemSlug = file.slug === 'cheat_sheet' ? 'cheat_sheet' : file.slug;

    return {
        id: ulid(),
        slug: `${file.parentPostSlug}--${itemSlug}`,
        post_slug: file.parentPostSlug,
        title: str(fm['title']) ?? itemSlug,
        body: file.body,
        status: str(fm['status']) ?? 'draft',
        sort_order: typeof fm['sort_order'] === 'number' ? fm['sort_order'] : 0,
        sync_source: 'mdx',
        locked: false,
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
        questionOptions: [],
        cheatSheets: [],
        learningPlans: [],
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
                const result = normaliseQuestion(file);
                if (result) {
                    rows.questions.push(result.question);
                    rows.questionOptions.push(...result.options);
                    collectQuestionTags(acc, file.frontmatter['tags'], file.slug);
                }
                break;
            }
            case 'cheat_sheet': {
                const row = normaliseCompanion(file);
                if (row) rows.cheatSheets.push(row);
                break;
            }
            case 'learning_plan': {
                const row = normaliseCompanion(file);
                if (row) rows.learningPlans.push(row);
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
            `cheatSheets=${rows.cheatSheets.length}  learningPlans=${rows.learningPlans.length}  ` +
            `questionOptions=${rows.questionOptions.length}  tags=${rows.tags.length}  ` +
            `contentLinks=${rows.contentTags.length}  questionLinks=${rows.questionTags.length}`
    );

    return rows;
};
