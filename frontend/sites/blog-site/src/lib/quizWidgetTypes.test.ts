import { selectShowcaseQuestions, widgetTypeKey } from './quizWidgetTypes.ts';

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const items = [
    { id: '02', answerFormat: 'multiple_choice', cognitiveStyle: 'factual_recall', slug: 'mc-later' },
    { id: '01', answerFormat: 'multiple_choice', cognitiveStyle: 'application', slug: 'mc-first' },
    { id: '03', answerFormat: 'free_text', cognitiveStyle: 'scenario', slug: 'scenario' },
    { id: '04', answerFormat: 'free_text', cognitiveStyle: 'analogy', slug: 'analogy' },
    { id: '05', answerFormat: 'true_false', cognitiveStyle: 'comprehension', slug: 'tf' },
];

assert(widgetTypeKey('multiple_choice', 'factual_recall') === 'multiple_choice', 'mc buckets by format');
assert(widgetTypeKey('free_text', 'scenario') === 'free_text:scenario', 'free_text buckets by style');
assert(widgetTypeKey('free_text', 'unknown') === null, 'unknown style is skipped');

const selected = selectShowcaseQuestions(items);
assert(selected.map((q) => q.slug).join(',') === 'mc-first,tf,analogy,scenario', `order/id pick: ${selected.map((q) => q.slug)}`);
assert(selected[0]?.id === '01', 'lowest id wins within a bucket');

console.log('quizWidgetTypes ok');
