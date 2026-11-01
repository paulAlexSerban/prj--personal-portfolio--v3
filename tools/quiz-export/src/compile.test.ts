import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { MARKDOWN_COMPILER_VERSION, compileContent } from '@prj--personal-portfolio--v3/shared--markdown';
import { openCompileCache } from './cache.ts';
import { questionCacheKey } from './cache.ts';
import { buildQuestionIndex, compileQuizData } from './compile.ts';
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
                    date: null,
                    questionCount: 1,
                    tags: [],
                    cheatSheets: [],
                    learningPlans: [],
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
                    date: null,
                    questionCount: 1,
                    tags: [],
                    cheatSheets: [],
                    learningPlans: [],
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

        // stem + explanation + 2 option labels - once per unique question, not per grouping
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

    it('indexes question files once and copies images from the matching source', async () => {
        const root = await mkdtemp(path.join(os.tmpdir(), 'quiz-export-'));
        const questionsDir = path.join(root, 'posts', 'graphs', 'questions');
        const imagesDir = path.join(questionsDir, 'images');
        await mkdir(imagesDir, { recursive: true });
        await writeFile(path.join(questionsDir, 'graphs--q1.mdx'), '# question\n');
        await writeFile(path.join(imagesDir, 'dfs.png'), 'png');
        await writeFile(path.join(root, 'posts', 'graphs', 'index.mdx'), '# post\n');

        const warnings: string[] = [];
        const index = await buildQuestionIndex(root, warnings);
        expect(warnings).toEqual([]);
        expect(index.get('graphs--q1')).toBe(path.join(questionsDir, 'graphs--q1.mdx'));
        expect(index.has('index')).toBe(false);

        const q = sampleQuestion();
        q.stem = 'See ![DFS](./images/dfs.png)';
        const assetsOut = path.join(root, 'out');
        const compiled = await compileQuizData(
            {
                generatedAt: '2026-01-01T00:00:00.000Z',
                posts: [],
                questionsByPost: new Map([['graphs', [q]]]),
                questionsByTag: new Map(),
            },
            { contentDir: root, assetsOutDir: assetsOut, warnings }
        );

        expect(warnings).toEqual([]);
        const html = compiled.questionsByPost.get('graphs')![0]!.stemHtml!;
        expect(html).toContain('/data/assets/questions/graphs--q1/dfs.png');
        expect(html).not.toContain('./images/dfs.png');
        const copied = await readFile(path.join(assetsOut, 'graphs--q1', 'dfs.png'), 'utf8');
        expect(copied).toBe('png');
    });

    it('warns on duplicate slugs and missing image files', async () => {
        const root = await mkdtemp(path.join(os.tmpdir(), 'quiz-export-'));
        await mkdir(path.join(root, 'a', 'questions'), { recursive: true });
        await mkdir(path.join(root, 'b', 'questions'), { recursive: true });
        await writeFile(path.join(root, 'a', 'questions', 'dup.mdx'), 'a');
        await writeFile(path.join(root, 'b', 'questions', 'dup.mdx'), 'b');

        const warnings: string[] = [];
        const index = await buildQuestionIndex(root, warnings);
        expect(index.size).toBe(1);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain('duplicate question slug "dup"');

        const q = sampleQuestion();
        q.slug = 'missing';
        q.stem = 'See ![x](./gone.png)';
        const compileWarnings: string[] = [];
        await compileQuizData(
            {
                generatedAt: '2026-01-01T00:00:00.000Z',
                posts: [],
                questionsByPost: new Map([['graphs', [q]]]),
                questionsByTag: new Map(),
            },
            { contentDir: root, assetsOutDir: path.join(root, 'out'), warnings: compileWarnings }
        );
        expect(compileWarnings.some((warning) => warning.includes('no source file'))).toBe(true);
    });

    it('skips compileContent when the cache already has the question', async () => {
        const q = sampleQuestion();
        const raw: QuizData = {
            generatedAt: '2026-01-01T00:00:00.000Z',
            posts: [],
            questionsByPost: new Map([['graphs', [q]]]),
            questionsByTag: new Map(),
        };
        const cacheFile = path.join(await mkdtemp(path.join(os.tmpdir(), 'quiz-export-cache-')), 'cache.json');
        const cache = await openCompileCache(cacheFile, MARKDOWN_COMPILER_VERSION);

        const spy = vi.mocked(compileContent);
        spy.mockClear();
        await compileQuizData(raw, { cache });
        expect(cache.stats.misses).toBe(1);
        expect(cache.stats.hits).toBe(0);
        expect(spy).toHaveBeenCalled();
        await cache.save();

        const again = await openCompileCache(cacheFile, MARKDOWN_COMPILER_VERSION);
        spy.mockClear();
        const compiled = await compileQuizData(raw, { cache: again });
        expect(spy).not.toHaveBeenCalled();
        expect(again.stats.hits).toBe(1);
        expect(compiled.questionsByPost.get('graphs')![0]!.stemHtml).toContain('Which detects cycles');

        const otherVersion = await openCompileCache(cacheFile, 'not-this-compiler');
        expect(otherVersion.get(questionCacheKey(q, new Map(), 'not-this-compiler'))).toBeUndefined();
    });
});
