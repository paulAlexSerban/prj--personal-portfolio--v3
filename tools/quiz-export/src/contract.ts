import type { AnswerFormat, CognitiveStyle, Difficulty, GradingMode } from '@prj--personal-portfolio--v3/shared--question-contract';

export type ContentFormat = 'markdown' | 'mdx';

// ── Question option (MC / multiple_select) ────────────────────────────────────

export interface ExportedOption {
    key: string;
    label: string;
    /** Export-time compiled, sanitized HTML (present after `compileQuizData`). */
    labelHtml?: string;
    isCorrect: boolean;
    sortOrder: number;
}

// ── Single exported question ──────────────────────────────────────────────────

export interface ExportedQuestion {
    slug: string;
    postSlug: string;
    answerFormat: AnswerFormat;
    cognitiveStyle: CognitiveStyle;
    difficulty: Difficulty;
    gradingMode: GradingMode;
    /** Authoring format — set by `compileQuizData`. */
    contentFormat?: ContentFormat;
    stem: string;
    /** Export-time compiled, sanitized HTML (present after `compileQuizData`). */
    stemHtml?: string;
    /** Raw MDX/markdown answer body — stored in questions.back. */
    explanation: string;
    /** Export-time compiled, sanitized HTML (present after `compileQuizData`). */
    explanationHtml?: string;
    /** Parsed JSON extras (concept, concepts_tested, analogy fields, true_false answer).
     *  null when questions.payload is null or empty. */
    payload: Record<string, unknown> | null;
    /** Populated only for multiple_choice / multiple_select; [] otherwise. */
    options: ExportedOption[];
    /** true_false answer extracted from payload for UI convenience. null for other formats. */
    answer: boolean | null;
    tags: string[];
}

// ── Post-level index entry ────────────────────────────────────────────────────

export interface ExportedPostEntry {
    slug: string;
    title: string;
    type: string;
    excerpt: string | null;
    /** Publication date (raw string from content frontmatter); null when unset. */
    date: string | null;
    questionCount: number;
    tags: string[];
}

// ── Tag-level index entry ─────────────────────────────────────────────────────

export interface ExportedTagEntry {
    slug: string;
    questionCount: number;
}

// ── Top-level output shapes ───────────────────────────────────────────────────

export interface PostsIndex {
    version: 2;
    generatedAt: string;
    posts: ExportedPostEntry[];
}

export interface PostQuestionsFile {
    version: 2;
    postSlug: string;
    questions: ExportedQuestion[];
}

export interface TagsIndex {
    version: 2;
    generatedAt: string;
    tags: ExportedTagEntry[];
}

export interface TagQuestionsFile {
    version: 2;
    tagSlug: string;
    questions: ExportedQuestion[];
}

export interface AllQuestionsBundle {
    version: 2;
    generatedAt: string;
    posts: ExportedPostEntry[];
    questions: ExportedQuestion[];
}

export interface QuizData {
    generatedAt: string;
    posts: ExportedPostEntry[];
    questionsByPost: Map<string, ExportedQuestion[]>;
    /** Questions keyed by tag slug. A question appears once per tag it carries. */
    questionsByTag: Map<string, ExportedQuestion[]>;
}
