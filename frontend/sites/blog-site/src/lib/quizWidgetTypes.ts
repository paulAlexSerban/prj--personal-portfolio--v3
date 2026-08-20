import type { ExportedQuestion } from '@prj--personal-portfolio--v3/tools--quiz-export/contract';

/**
 * Showcase buckets for the blog-post flashcard widget.
 * Auto-graded formats are keyed by `answer_format`; free-text formats are keyed
 * by `cognitive_style` so each pedagogical style gets one sample card.
 */
export const WIDGET_TYPE_ORDER = [
    { key: 'multiple_choice', label: 'Multiple Choice' },
    { key: 'multiple_select', label: 'Multiple Select' },
    { key: 'true_false', label: 'True / False' },
    { key: 'free_text:analogy', label: 'Analogy' },
    { key: 'free_text:application', label: 'Application' },
    { key: 'free_text:comprehension', label: 'Comprehension' },
    { key: 'free_text:factual_recall', label: 'Factual Recall' },
    { key: 'free_text:open_ended', label: 'Open Ended' },
    { key: 'free_text:scenario', label: 'Scenario' },
] as const;

export type WidgetTypeKey = (typeof WIDGET_TYPE_ORDER)[number]['key'];

const TYPE_LABEL_BY_KEY: Record<WidgetTypeKey, string> = Object.fromEntries(
    WIDGET_TYPE_ORDER.map(({ key, label }) => [key, label]),
) as Record<WidgetTypeKey, string>;

const FREE_TEXT_STYLES = new Set([
    'analogy',
    'application',
    'comprehension',
    'factual_recall',
    'open_ended',
    'scenario',
]);

export interface WidgetQuestion extends ExportedQuestion {
    typeKey: WidgetTypeKey;
    typeLabel: string;
}

export function widgetTypeKey(answerFormat: string, cognitiveStyle: string): WidgetTypeKey | null {
    if (answerFormat === 'multiple_choice') return 'multiple_choice';
    if (answerFormat === 'multiple_select') return 'multiple_select';
    if (answerFormat === 'true_false') return 'true_false';
    if (answerFormat === 'free_text' && FREE_TEXT_STYLES.has(cognitiveStyle)) {
        return `free_text:${cognitiveStyle}` as WidgetTypeKey;
    }
    return null;
}

export function widgetTypeLabel(key: WidgetTypeKey): string {
    return TYPE_LABEL_BY_KEY[key];
}

/**
 * Pick one question per showcase type, preferring the lowest `id` (ULIDs sort
 * lexicographically by creation time). Output follows {@link WIDGET_TYPE_ORDER}.
 */
export function selectShowcaseQuestions<T extends { id: string; answerFormat: string; cognitiveStyle: string }>(
    items: T[],
): T[] {
    const best = new Map<WidgetTypeKey, T>();
    for (const item of items) {
        const key = widgetTypeKey(item.answerFormat, item.cognitiveStyle);
        if (!key) continue;
        const current = best.get(key);
        if (!current || item.id.localeCompare(current.id) < 0) {
            best.set(key, item);
        }
    }
    return WIDGET_TYPE_ORDER.map(({ key }) => best.get(key)).filter((item): item is T => item !== undefined);
}
