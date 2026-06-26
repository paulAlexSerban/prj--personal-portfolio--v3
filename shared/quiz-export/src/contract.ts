import type { AnswerFormat, CognitiveStyle, Difficulty, GradingMode } from '@prj--personal-portfolio--v3/shared--question-contract';

// ── Question option (MC / multiple_select) ────────────────────────────────────

export interface ExportedOption {
    key: string;
    label: string;
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
    stem: string;
    /** Raw MDX/HTML answer body — not compiled. Stored in questions.back. */
    explanation: string;
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
    version: 1;
    generatedAt: string;
    posts: ExportedPostEntry[];
}

export interface PostQuestionsFile {
    version: 1;
    postSlug: string;
    questions: ExportedQuestion[];
}

export interface TagsIndex {
    version: 1;
    generatedAt: string;
    tags: ExportedTagEntry[];
}

export interface TagQuestionsFile {
    version: 1;
    tagSlug: string;
    questions: ExportedQuestion[];
}

export interface AllQuestionsBundle {
    version: 1;
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
