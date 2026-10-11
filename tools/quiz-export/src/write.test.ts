import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import type { ExportedQuestion, QuizData } from './contract.ts';
import { writeQuizJson } from './write.ts';

function question(): ExportedQuestion {
    return {
        slug: 'graphs--q1',
        postSlug: 'graphs',
        answerFormat: 'free_text',
        cognitiveStyle: 'factual_recall',
        difficulty: 'intermediate',
        gradingMode: 'self',
        stem: 'Stem',
        explanation: 'Because',
        payload: null,
        options: [],
        answer: null,
        tags: ['graphs'],
    };
}

function data(): QuizData {
    const q = question();
    return {
        generatedAt: '2026-01-01T00:00:00.000Z',
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
        questionsByTag: new Map([['graphs', [q]]]),
    };
}

describe('writeQuizJson', () => {
    it('writes minified JSON and deletes files that are no longer exported', async () => {
        const outDir = await mkdtemp(path.join(os.tmpdir(), 'quiz-export-out-'));
        await mkdir(path.join(outDir, 'questions'), { recursive: true });
        await mkdir(path.join(outDir, 'tags'), { recursive: true });
        await writeFile(path.join(outDir, 'questions', 'gone.json'), '{}');
        await writeFile(path.join(outDir, 'tags', 'old.json'), '{}');

        const result = await writeQuizJson(data(), outDir);

        const posts = await readFile(result.postsIndexPath, 'utf8');
        expect(posts).not.toContain('\n');
        expect(JSON.parse(posts).posts[0].slug).toBe('graphs');
        expect(result.removedOrphans).toBe(2);
        await expect(readFile(path.join(outDir, 'questions', 'gone.json'), 'utf8')).rejects.toThrow();
        await expect(readFile(path.join(outDir, 'tags', 'old.json'), 'utf8')).rejects.toThrow();
        const kept = await readFile(path.join(outDir, 'questions', 'graphs.json'), 'utf8');
        expect(JSON.parse(kept).questions).toHaveLength(1);
    });

    it('indents JSON when pretty is set', async () => {
        const outDir = await mkdtemp(path.join(os.tmpdir(), 'quiz-export-out-'));
        const result = await writeQuizJson(data(), outDir, { pretty: true });
        const posts = await readFile(result.postsIndexPath, 'utf8');
        expect(posts).toContain('\n');
        expect(result.removedOrphans).toBe(0);
    });
});
