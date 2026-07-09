import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AllQuestionsBundle, ExportedTagEntry, PostQuestionsFile, PostsIndex, QuizData, TagQuestionsFile, TagsIndex } from './contract.ts';

export interface WriteResult {
    postsIndexPath: string;
    questionFilePaths: string[];
    tagsIndexPath: string;
    tagFilePaths: string[];
    allBundlePath: string;
}

export async function writeQuizJson(data: QuizData, outDir: string): Promise<WriteResult> {
    const questionsDir = path.join(outDir, 'questions');
    const tagsDir = path.join(outDir, 'tags');
    await Promise.all([mkdir(questionsDir, { recursive: true }), mkdir(tagsDir, { recursive: true })]);

    const allQuestions = [...data.questionsByPost.values()].flat();

    // ── posts.json ────────────────────────────────────────────────────────────
    const postsIndex: PostsIndex = {
        version: 2,
        generatedAt: data.generatedAt,
        posts: data.posts,
    };
    const postsIndexPath = path.join(outDir, 'posts.json');
    await writeFile(postsIndexPath, JSON.stringify(postsIndex, null, 2), 'utf-8');

    // ── questions/<post_slug>.json ────────────────────────────────────────────
    const questionEntries = [...data.questionsByPost.entries()];
    const questionFilePaths = questionEntries.map(([postSlug]) => path.join(questionsDir, `${postSlug}.json`));
    await Promise.all(
        questionEntries.map(([postSlug, questionList], i) => {
            const file: PostQuestionsFile = {
                version: 2,
                postSlug,
                questions: questionList,
            };
            return writeFile(questionFilePaths[i]!, JSON.stringify(file, null, 2), 'utf-8');
        }),
    );

    // ── tags.json ─────────────────────────────────────────────────────────────
    const tagEntries: ExportedTagEntry[] = [...data.questionsByTag.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([slug, qs]) => ({ slug, questionCount: qs.length }));

    const tagsIndex: TagsIndex = {
        version: 2,
        generatedAt: data.generatedAt,
        tags: tagEntries,
    };
    const tagsIndexPath = path.join(outDir, 'tags.json');
    await writeFile(tagsIndexPath, JSON.stringify(tagsIndex, null, 2), 'utf-8');

    // ── tags/<tag_slug>.json ──────────────────────────────────────────────────
    const tagEntriesList = [...data.questionsByTag.entries()];
    const tagFilePaths = tagEntriesList.map(([tagSlug]) => path.join(tagsDir, `${tagSlug}.json`));
    await Promise.all(
        tagEntriesList.map(([tagSlug, questionList], i) => {
            const file: TagQuestionsFile = {
                version: 2,
                tagSlug,
                questions: questionList,
            };
            return writeFile(tagFilePaths[i]!, JSON.stringify(file, null, 2), 'utf-8');
        }),
    );

    // ── _all.json ─────────────────────────────────────────────────────────────
    const allBundle: AllQuestionsBundle = {
        version: 2,
        generatedAt: data.generatedAt,
        posts: data.posts,
        questions: allQuestions,
    };
    const allBundlePath = path.join(outDir, '_all.json');
    await writeFile(allBundlePath, JSON.stringify(allBundle, null, 2), 'utf-8');

    return { postsIndexPath, questionFilePaths, tagsIndexPath, tagFilePaths, allBundlePath };
}
