import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const ANSWER_FORMATS = ['multiple_choice', 'multiple_select', 'true_false', 'free_text'] as const;
export type AnswerFormat = (typeof ANSWER_FORMATS)[number];

export const COGNITIVE_STYLES = [
    'factual_recall',
    'comprehension',
    'application',
    'scenario',
    'open_ended',
    'analogy',
] as const;
export type CognitiveStyle = (typeof COGNITIVE_STYLES)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const GRADING_MODES = ['auto', 'self'] as const;
export type GradingMode = (typeof GRADING_MODES)[number];

// ── Building blocks ───────────────────────────────────────────────────────────

export const questionOptionSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
});

export type QuestionOption = z.infer<typeof questionOptionSchema>;

const sharedQuestionFields = {
    question: z.string().min(1),
    status: z.string().min(1),
    cognitive_style: z.enum(COGNITIVE_STYLES).default('factual_recall'),
    difficulty: z.enum(DIFFICULTIES).default('intermediate'),
    concept: z.string().min(1).optional(),
    concepts_tested: z.array(z.string().min(1)).optional(),
    concept_target: z.string().min(1).optional(),
    concept_source: z.string().min(1).optional(),
};

const validateOptionKeys = (options: QuestionOption[], correctKeys: string[]): string | null => {
    const keys = new Set(options.map((o) => o.key));

    for (const key of correctKeys) {
        if (!keys.has(key)) {
            return `correct_option_keys references unknown key "${key}"`;
        }
    }

    return null;
};

const freeTextFrontmatterSchema = z.object({
    ...sharedQuestionFields,
    answer_format: z.literal('free_text'),
});

const multipleChoiceFrontmatterSchema = z.object({
    ...sharedQuestionFields,
    answer_format: z.literal('multiple_choice'),
    options: z.array(questionOptionSchema).min(2),
    correct_option_keys: z.array(z.string().min(1)).min(1),
});

const multipleSelectFrontmatterSchema = z.object({
    ...sharedQuestionFields,
    answer_format: z.literal('multiple_select'),
    options: z.array(questionOptionSchema).min(2),
    correct_option_keys: z.array(z.string().min(1)).min(1),
});

const trueFalseFrontmatterSchema = z.object({
    ...sharedQuestionFields,
    answer_format: z.literal('true_false'),
    answer: z.boolean(),
});

const questionFrontmatterSchema = z.discriminatedUnion('answer_format', [
    freeTextFrontmatterSchema,
    multipleChoiceFrontmatterSchema,
    multipleSelectFrontmatterSchema,
    trueFalseFrontmatterSchema,
]);

const validateStructuredQuestion = (data: ParsedQuestionFrontmatter): string | null => {
    if (data.answer_format === 'multiple_choice') {
        if (data.correct_option_keys.length !== 1) {
            return 'multiple_choice requires exactly one correct_option_keys entry';
        }

        return validateOptionKeys(data.options, data.correct_option_keys);
    }

    if (data.answer_format === 'multiple_select') {
        return validateOptionKeys(data.options, data.correct_option_keys);
    }

    return null;
};

const applyFrontmatterDefaults = (input: Record<string, unknown>): Record<string, unknown> => ({
    ...input,
    answer_format: input['answer_format'] ?? 'free_text',
    cognitive_style: input['cognitive_style'] ?? 'factual_recall',
    difficulty: input['difficulty'] ?? 'intermediate',
});

export type ParsedQuestionFrontmatter = z.infer<typeof questionFrontmatterSchema>;

export const deriveGradingMode = (answerFormat: AnswerFormat): GradingMode =>
    answerFormat === 'free_text' ? 'self' : 'auto';

export type QuestionPayload = {
    concept?: string;
    concepts_tested?: string[];
    concept_target?: string;
    concept_source?: string;
    answer?: boolean;
};

export const buildQuestionPayload = (fm: ParsedQuestionFrontmatter): string | null => {
    const payload: QuestionPayload = {};

    if (fm.concept) payload.concept = fm.concept;
    if (fm.concepts_tested) payload.concepts_tested = fm.concepts_tested;
    if (fm.concept_target) payload.concept_target = fm.concept_target;
    if (fm.concept_source) payload.concept_source = fm.concept_source;
    if (fm.answer_format === 'true_false') payload.answer = fm.answer;

    return Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;
};

export type QuestionOptionRowInput = {
    question_slug: string;
    option_key: string;
    sort_order: number;
    label: string;
    is_correct: boolean;
};

export const buildQuestionOptionRows = (questionSlug: string, fm: ParsedQuestionFrontmatter): QuestionOptionRowInput[] => {
    if (fm.answer_format !== 'multiple_choice' && fm.answer_format !== 'multiple_select') {
        return [];
    }

    const correct = new Set(fm.correct_option_keys);

    return fm.options.map((option, index) => ({
        question_slug: questionSlug,
        option_key: option.key,
        sort_order: index,
        label: option.label,
        is_correct: correct.has(option.key),
    }));
};

export type ParseQuestionResult =
    | { ok: true; data: ParsedQuestionFrontmatter }
    | { ok: false; error: string };

export const parseQuestionFrontmatter = (frontmatter: Record<string, unknown>): ParseQuestionResult => {
    const result = questionFrontmatterSchema.safeParse(applyFrontmatterDefaults(frontmatter));

    if (!result.success) {
        const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        return { ok: false, error: message };
    }

    const structuredError = validateStructuredQuestion(result.data);

    if (structuredError) {
        return { ok: false, error: structuredError };
    }

    return { ok: true, data: result.data };
};
