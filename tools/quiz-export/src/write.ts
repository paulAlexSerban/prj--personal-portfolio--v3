import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mapLimit } from './map-limit.ts';
import type { AllQuestionsBundle, ExportedTagEntry, PostQuestionsFile, PostsIndex, QuizData, TagQuestionsFile, TagsIndex } from './contract.ts';

const WRITE_CONCURRENCY = 32;

export interface WriteOptions {
    /** Indent JSON with two spaces. Default is minified. */
    pretty?: boolean;
}

export interface WriteResult {
    postsIndexPath: string;
    questionFilePaths: string[];
    tagsIndexPath: string;
    tagFilePaths: string[];
    allBundlePath: string;
    /** JSON files in `questions/` and `tags/` that were not part of this export. */
    removedOrphans: number;
}

function serialize(value: unknown, pretty: boolean): string {
    return JSON.stringify(value, null, pretty ? 2 : undefined);
}

async function removeOrphans(dir: string, keep: Set<string>): Promise<number> {
    let names: string[];
    try {
        names = await readdir(dir);
    } catch {
        return 0;
    }

    const stale = names.filter((name) => name.endsWith('.json') && !keep.has(name));
    await mapLimit(stale, WRITE_CONCURRENCY, (name) => unlink(path.join(dir, name)));
    return stale.length;
}

export async function writeQuizJson(data: QuizData, outDir: string, opts: WriteOptions = {}): Promise<WriteResult> {
    const pretty = opts.pretty ?? false;
    const questionsDir = path.join(outDir, 'questions');
    const tagsDir = path.join(outDir, 'tags');
    await Promise.all([mkdir(questionsDir, { recursive: true }), mkdir(tagsDir, { recursive: true })]);

    const allQuestions = [...data.questionsByPost.values()].flat();

    const postsIndex: PostsIndex = {
        version: 2,
        generatedAt: data.generatedAt,
        posts: data.posts,
    };
    const postsIndexPath = path.join(outDir, 'posts.json');
    await writeFile(postsIndexPath, serialize(postsIndex, pretty), 'utf-8');

    const questionEntries = [...data.questionsByPost.entries()];
    const questionFilePaths = questionEntries.map(([postSlug]) => path.join(questionsDir, `${postSlug}.json`));
    await mapLimit(questionEntries, WRITE_CONCURRENCY, ([postSlug, questionList], index) => {
        const file: PostQuestionsFile = {
            version: 2,
            postSlug,
            questions: questionList,
        };
        return writeFile(questionFilePaths[index]!, serialize(file, pretty), 'utf-8');
    });

    const tagEntries: ExportedTagEntry[] = [...data.questionsByTag.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([slug, qs]) => ({ slug, questionCount: qs.length }));

    const tagsIndex: TagsIndex = {
        version: 2,
        generatedAt: data.generatedAt,
        tags: tagEntries,
    };
    const tagsIndexPath = path.join(outDir, 'tags.json');
    await writeFile(tagsIndexPath, serialize(tagsIndex, pretty), 'utf-8');

    const tagEntriesList = [...data.questionsByTag.entries()];
    const tagFilePaths = tagEntriesList.map(([tagSlug]) => path.join(tagsDir, `${tagSlug}.json`));
    await mapLimit(tagEntriesList, WRITE_CONCURRENCY, ([tagSlug, questionList], index) => {
        const file: TagQuestionsFile = {
            version: 2,
            tagSlug,
            questions: questionList,
        };
        return writeFile(tagFilePaths[index]!, serialize(file, pretty), 'utf-8');
    });

    const allBundle: AllQuestionsBundle = {
        version: 2,
        generatedAt: data.generatedAt,
        posts: data.posts,
        questions: allQuestions,
    };
    const allBundlePath = path.join(outDir, '_all.json');
    await writeFile(allBundlePath, serialize(allBundle, pretty), 'utf-8');

    const removedOrphans = (await removeOrphans(questionsDir, new Set(questionEntries.map(([slug]) => `${slug}.json`)))) + (await removeOrphans(tagsDir, new Set(tagEntriesList.map(([slug]) => `${slug}.json`))));

    return { postsIndexPath, questionFilePaths, tagsIndexPath, tagFilePaths, allBundlePath, removedOrphans };
}
