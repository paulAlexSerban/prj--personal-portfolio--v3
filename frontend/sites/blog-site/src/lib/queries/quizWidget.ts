import {
    deriveGradingMode,
    ANSWER_FORMATS,
    COGNITIVE_STYLES,
    DIFFICULTIES,
} from '@prj--personal-portfolio--v3/shared--question-contract';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { questions, question_options } from '@prj--personal-portfolio--v3/shared--db-schema';
import { compileContent, detectContentFormat } from '@prj--personal-portfolio--v3/shared--markdown';
import type { ExportedOption, ExportedQuestion } from '@prj--personal-portfolio--v3/tools--quiz-export/contract';
import { and, eq, inArray } from 'drizzle-orm';

import {
    selectShowcaseQuestions,
    widgetTypeKey,
    widgetTypeLabel,
    type WidgetQuestion,
} from '@/lib/quizWidgetTypes.ts';

export type { WidgetQuestion } from '@/lib/quizWidgetTypes.ts';

function safeAnswerFormat(raw: string) {
    return (ANSWER_FORMATS as readonly string[]).includes(raw)
        ? (raw as (typeof ANSWER_FORMATS)[number])
        : ('free_text' as const);
}

function safeCognitiveStyle(raw: string) {
    return (COGNITIVE_STYLES as readonly string[]).includes(raw)
        ? (raw as (typeof COGNITIVE_STYLES)[number])
        : ('factual_recall' as const);
}

function safeDifficulty(raw: string) {
    return (DIFFICULTIES as readonly string[]).includes(raw)
        ? (raw as (typeof DIFFICULTIES)[number])
        : ('intermediate' as const);
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

function compileField(src: string, inline = false): string {
    const format = detectContentFormat(src);
    return compileContent(src, { mdx: format === 'mdx', inline, reveal: true });
}

function compileQuestion(question: ExportedQuestion): ExportedQuestion {
    const stemSrc = question.stem;
    const explanationSrc = question.explanation;
    const contentFormat = [stemSrc, explanationSrc, ...question.options.map((o) => o.label)].some(
        (s) => detectContentFormat(s) === 'mdx',
    )
        ? 'mdx'
        : 'markdown';

    return {
        ...question,
        contentFormat,
        stemHtml: compileField(question.stem),
        explanationHtml: compileField(question.explanation),
        options: question.options.map((opt) => ({
            ...opt,
            labelHtml: compileField(opt.label, true),
        })),
    };
}

interface QuestionWithId extends ExportedQuestion {
    id: string;
}

/**
 * One published question per showcase type for the post, compiled to HTML.
 * Empty when the post has no published questions that match a widget bucket.
 */
export function getWidgetQuestionsForPost(db: DrizzleDb, slug: string): WidgetQuestion[] {
    const rows = db
        .select({
            id: questions.id,
            slug: questions.slug,
            post_slug: questions.post_slug,
            answer_format: questions.answer_format,
            cognitive_style: questions.cognitive_style,
            difficulty: questions.difficulty,
            stem: questions.stem,
            back: questions.back,
            payload: questions.payload,
        })
        .from(questions)
        .where(and(eq(questions.post_slug, slug), eq(questions.status, 'published')))
        .all();

    if (rows.length === 0) return [];

    const slugs = rows.map((row) => row.slug);
    const allOptions = db
        .select()
        .from(question_options)
        .where(inArray(question_options.question_slug, slugs))
        .orderBy(question_options.sort_order)
        .all();

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

    const mapped: QuestionWithId[] = rows.map((row) => {
        const answerFormat = safeAnswerFormat(row.answer_format);
        const payload = parsePayload(row.payload ?? null);
        return {
            id: row.id,
            slug: row.slug,
            postSlug: row.post_slug,
            answerFormat,
            cognitiveStyle: safeCognitiveStyle(row.cognitive_style),
            difficulty: safeDifficulty(row.difficulty),
            gradingMode: deriveGradingMode(answerFormat),
            stem: row.stem,
            explanation: row.back,
            payload,
            options: optionsByQuestion.get(row.slug) ?? [],
            answer: answerFormat === 'true_false' ? extractTrueFalseAnswer(payload) : null,
            tags: [],
        };
    });

    const selected = selectShowcaseQuestions(mapped);

    return selected.flatMap((item) => {
        const { id: _id, ...question } = item;
        const typeKey = widgetTypeKey(question.answerFormat, question.cognitiveStyle);
        if (!typeKey) return [];
        return [
            {
                ...compileQuestion(question),
                typeKey,
                typeLabel: widgetTypeLabel(typeKey),
            },
        ];
    });
}
