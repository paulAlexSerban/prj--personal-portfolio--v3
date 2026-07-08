import { eq } from 'drizzle-orm';
import { questions, question_options, question_tags, posts, content_tags, tags } from '@prj--personal-portfolio--v3/shared--db-schema';
import { deriveGradingMode, ANSWER_FORMATS, COGNITIVE_STYLES, DIFFICULTIES } from '@prj--personal-portfolio--v3/shared--question-contract';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import type { ExportedOption, ExportedPostEntry, ExportedQuestion, QuizData } from './contract.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeAnswerFormat(raw: string) {
    return (ANSWER_FORMATS as readonly string[]).includes(raw) ? (raw as (typeof ANSWER_FORMATS)[number]) : ('free_text' as const);
}

function safeCognitiveStyle(raw: string) {
    return (COGNITIVE_STYLES as readonly string[]).includes(raw) ? (raw as (typeof COGNITIVE_STYLES)[number]) : ('factual_recall' as const);
}

function safeDifficulty(raw: string) {
    return (DIFFICULTIES as readonly string[]).includes(raw) ? (raw as (typeof DIFFICULTIES)[number]) : ('intermediate' as const);
}

function parsePayload(raw: string | null): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        return null;
    } catch {
        return null;
    }
}

function extractTrueFalseAnswer(payload: Record<string, unknown> | null): boolean | null {
    if (payload && typeof payload['answer'] === 'boolean') return payload['answer'];
    return null;
}

// ── Main export builder ───────────────────────────────────────────────────────

export async function buildQuizData(db: DrizzleDb): Promise<QuizData> {
    const generatedAt = new Date().toISOString();

    // ── 1. Fetch all published questions joined with their parent post ─────────
    const rows = await db
        .select({
            // question fields
            slug: questions.slug,
            post_slug: questions.post_slug,
            answer_format: questions.answer_format,
            cognitive_style: questions.cognitive_style,
            difficulty: questions.difficulty,
            grading_mode: questions.grading_mode,
            stem: questions.stem,
            back: questions.back,
            payload: questions.payload,
            // parent post fields
            postTitle: posts.title,
            postType: posts.type,
            postExcerpt: posts.excerpt,
            postDate: posts.date,
        })
        .from(questions)
        .innerJoin(posts, eq(questions.post_slug, posts.slug))
        .where(eq(questions.status, 'published'));

    if (rows.length === 0) {
        return { generatedAt, posts: [], questionsByPost: new Map(), questionsByTag: new Map() };
    }

    // ── 2. Fetch question options for MC/MS questions ─────────────────────────
    const allOptions = await db.select().from(question_options).orderBy(question_options.sort_order);

    const optionsByQuestion = new Map<string, ExportedOption[]>();
    for (const opt of allOptions) {
        const list = optionsByQuestion.get(opt.question_slug) ?? [];
        list.push({
            key: opt.option_key,
            label: opt.label,
            isCorrect: Boolean(opt.is_correct),
            sortOrder: opt.sort_order,
        });
        optionsByQuestion.set(opt.question_slug, list);
    }

    // ── 3. Fetch question tags ────────────────────────────────────────────────
    const allQuestionTags = await db
        .select({
            question_slug: question_tags.question_slug,
            tag_slug: question_tags.tag_slug,
        })
        .from(question_tags);

    const tagsByQuestion = new Map<string, string[]>();
    for (const qt of allQuestionTags) {
        const list = tagsByQuestion.get(qt.question_slug) ?? [];
        list.push(qt.tag_slug);
        tagsByQuestion.set(qt.question_slug, list);
    }

    // ── 4. Fetch post tags ────────────────────────────────────────────────────
    const allPostTags = await db
        .select({
            content_slug: content_tags.content_slug,
            tag_slug: content_tags.tag_slug,
        })
        .from(content_tags);

    const tagsByPost = new Map<string, string[]>();
    for (const pt of allPostTags) {
        const list = tagsByPost.get(pt.content_slug) ?? [];
        list.push(pt.tag_slug);
        tagsByPost.set(pt.content_slug, list);
    }

    // ── 5. Assemble ExportedQuestion objects ──────────────────────────────────
    const questionsByPost = new Map<string, ExportedQuestion[]>();
    const postMeta = new Map<string, { title: string; type: string; excerpt: string | null; date: string | null }>();

    for (const row of rows) {
        const answerFormat = safeAnswerFormat(row.answer_format);
        const gradingMode = deriveGradingMode(answerFormat);
        const payload = parsePayload(row.payload ?? null);

        const exportedQuestion: ExportedQuestion = {
            slug: row.slug,
            postSlug: row.post_slug,
            answerFormat,
            cognitiveStyle: safeCognitiveStyle(row.cognitive_style),
            difficulty: safeDifficulty(row.difficulty),
            gradingMode,
            stem: row.stem,
            explanation: row.back,
            payload,
            options: optionsByQuestion.get(row.slug) ?? [],
            answer: answerFormat === 'true_false' ? extractTrueFalseAnswer(payload) : null,
            tags: tagsByQuestion.get(row.slug) ?? [],
        };

        const list = questionsByPost.get(row.post_slug) ?? [];
        list.push(exportedQuestion);
        questionsByPost.set(row.post_slug, list);

        if (!postMeta.has(row.post_slug)) {
            postMeta.set(row.post_slug, {
                title: row.postTitle,
                type: row.postType,
                excerpt: row.postExcerpt ?? null,
                date: row.postDate ?? null,
            });
        }
    }

    // ── 6. Assemble post index entries ────────────────────────────────────────
    const exportedPosts: ExportedPostEntry[] = [];
    for (const [slug, meta] of postMeta.entries()) {
        exportedPosts.push({
            slug,
            title: meta.title,
            type: meta.type,
            excerpt: meta.excerpt,
            date: meta.date,
            questionCount: (questionsByPost.get(slug) ?? []).length,
            tags: tagsByPost.get(slug) ?? [],
        });
    }

    exportedPosts.sort((a, b) => a.slug.localeCompare(b.slug));

    // ── 7. Group questions by tag slug ────────────────────────────────────────
    const questionsByTag = new Map<string, ExportedQuestion[]>();
    for (const questionList of questionsByPost.values()) {
        for (const q of questionList) {
            for (const tagSlug of q.tags) {
                const list = questionsByTag.get(tagSlug) ?? [];
                list.push(q);
                questionsByTag.set(tagSlug, list);
            }
        }
    }

    return { generatedAt, posts: exportedPosts, questionsByPost, questionsByTag };
}
