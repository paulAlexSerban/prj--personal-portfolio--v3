import type { ExportedQuestion } from '@prj--personal-portfolio--v3/tools--quiz-export/contract';

const base = {
    postSlug: 'sample-post',
    cognitiveStyle: 'factual_recall' as const,
    difficulty: 'intermediate' as const,
    tags: ['algorithms', 'complexity'],
    payload: null,
};

export const freeTextQuestion: ExportedQuestion = {
    ...base,
    slug: 'free-text-sample',
    answerFormat: 'free_text',
    gradingMode: 'self',
    stem: 'What is the time complexity of binary search on a sorted array?',
    explanation: 'Binary search runs in **O(log n)** time because each comparison halves the search space.',
    options: [],
    answer: null,
};

export const multipleChoiceQuestion: ExportedQuestion = {
    ...base,
    slug: 'mc-sample',
    answerFormat: 'multiple_choice',
    gradingMode: 'auto',
    stem: 'Which data structure uses LIFO ordering?',
    explanation: 'A **stack** follows Last-In-First-Out (LIFO) ordering.',
    options: [
        { key: 'A', label: 'Queue', isCorrect: false, sortOrder: 0 },
        { key: 'B', label: 'Stack', isCorrect: true, sortOrder: 1 },
        { key: 'C', label: 'Deque', isCorrect: false, sortOrder: 2 },
        { key: 'D', label: 'Priority queue', isCorrect: false, sortOrder: 3 },
    ],
    answer: null,
};

export const trueFalseQuestion: ExportedQuestion = {
    ...base,
    slug: 'tf-sample',
    answerFormat: 'true_false',
    gradingMode: 'auto',
    stem: 'Merge sort is a stable sorting algorithm.',
    explanation: 'Merge sort preserves the relative order of equal elements, so it is **stable**.',
    options: [],
    answer: true,
};

export const multipleSelectQuestion: ExportedQuestion = {
    ...base,
    slug: 'ms-sample',
    answerFormat: 'multiple_select',
    gradingMode: 'auto',
    stem: 'Select all that are comparison-based sorts:',
    explanation: 'Merge sort, quicksort, and heapsort compare elements directly.',
    options: [
        { key: 'A', label: 'Merge sort', isCorrect: true, sortOrder: 0 },
        { key: 'B', label: 'Counting sort', isCorrect: false, sortOrder: 1 },
        { key: 'C', label: 'Quicksort', isCorrect: true, sortOrder: 2 },
        { key: 'D', label: 'Heapsort', isCorrect: true, sortOrder: 3 },
    ],
    answer: null,
};

export const mathQuestion: ExportedQuestion = {
    ...base,
    slug: 'math-sample',
    answerFormat: 'free_text',
    gradingMode: 'self',
    stem: 'State the master theorem for $T(n) = aT(n/b) + f(n)$.',
    explanation: 'When $f(n) = O(n^{\\log_b a - \\epsilon})$, then $T(n) = \\Theta(n^{\\log_b a})$.',
    options: [],
    answer: null,
};

export const codeQuestion: ExportedQuestion = {
    ...base,
    slug: 'code-sample',
    answerFormat: 'free_text',
    gradingMode: 'self',
    stem: 'What does this function compute?',
    explanation: '```typescript\nfunction fib(n: number): number {\n  return n <= 1 ? n : fib(n - 1) + fib(n - 2);\n}\n```\nIt computes the **nth Fibonacci number** recursively.',
    options: [],
    answer: null,
};
