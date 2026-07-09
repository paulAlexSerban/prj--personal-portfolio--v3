import { describe, it, expect, vi } from 'vitest';
import { compileContent } from '@prj--personal-portfolio--v3/shared--markdown';
import { compileQuizData } from './compile.ts';
import type { ExportedQuestion, QuizData } from './contract.ts';

vi.mock('@prj--personal-portfolio--v3/shared--markdown', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@prj--personal-portfolio--v3/shared--markdown')>();
    return {
        ...actual,
        compileContent: vi.fn(actual.compileContent),
    };
});

function sampleQuestion(): ExportedQuestion {
    return {
        slug: 'graphs--q1',
        postSlug: 'graphs',
        answerFormat: 'multiple_choice',
        cognitiveStyle: 'factual_recall',
        difficulty: 'intermediate',
        gradingMode: 'auto',
        stem: 'Which detects cycles?',
        explanation: `## Explanation

**b** is correct.

<Callout type="tip">Kahn fails when a cycle exists.</Callout>`,
        payload: null,
        options: [
            { key: 'a', label: 'BFS only', isCorrect: false, sortOrder: 0 },
            { key: 'b', label: 'DFS back-edge', isCorrect: true, sortOrder: 1 },
        ],
        answer: null,
        tags: [],
    };
}

describe('compileQuizData', () => {
    it('compiles MDX explanation with Callout to sanitized HTML', async () => {
        const q = sampleQuestion();
        const raw: QuizData = {
            generatedAt: new Date().toISOString(),
            posts: [
                {
                    slug: 'graphs',
                    title: 'Graphs',
                    type: 'post',
                    excerpt: null,
                    questionCount: 1,
                    tags: [],
                },
            ],
            questionsByPost: new Map([['graphs', [q]]]),
            questionsByTag: new Map(),
        };

        const compiled = await compileQuizData(raw);
        const out = compiled.questionsByPost.get('graphs')![0]!;

        expect(out.contentFormat).toBe('mdx');
        expect(out.explanationHtml).toContain('mdx-callout-tip');
        expect(out.explanationHtml).toContain('Kahn fails');
        expect(out.explanationHtml).toContain('<strong>b</strong>');
        expect(out.stemHtml).toContain('Which detects cycles');
        expect(out.options[0]!.labelHtml).toContain('BFS');
        expect(out.explanationHtml!.toLowerCase()).not.toContain('<script');
    });

    it('compiles each unique question only once when repeated across post and tag groupings', async () => {
        const q = sampleQuestion();
        q.tags = ['algorithms', 'graphs'];

        const raw: QuizData = {
            generatedAt: new Date().toISOString(),
            posts: [
                {
                    slug: 'graphs',
                    title: 'Graphs',
                    type: 'post',
                    excerpt: null,
                    questionCount: 1,
                    tags: [],
                },
            ],
            questionsByPost: new Map([['graphs', [q]]]),
            questionsByTag: new Map([
                ['algorithms', [q]],
                ['graphs', [q]],
                ['cycles', [q]],
            ]),
        };

        const spy = vi.mocked(compileContent);
        spy.mockClear();
        const compiled = await compileQuizData(raw);

        // stem + explanation + 2 option labels — once per unique question, not per grouping
        expect(spy).toHaveBeenCalledTimes(4);

        const fromPost = compiled.questionsByPost.get('graphs')![0]!;
        const fromAlgorithms = compiled.questionsByTag.get('algorithms')![0]!;
        const fromGraphs = compiled.questionsByTag.get('graphs')![0]!;
        const fromCycles = compiled.questionsByTag.get('cycles')![0]!;

        expect(fromPost).toBe(fromAlgorithms);
        expect(fromPost).toBe(fromGraphs);
        expect(fromPost).toBe(fromCycles);
        expect(fromPost.stemHtml).toContain('Which detects cycles');
    });
});
