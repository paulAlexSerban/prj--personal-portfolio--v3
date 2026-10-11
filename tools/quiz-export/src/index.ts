import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKDOWN_COMPILER_VERSION } from '@prj--personal-portfolio--v3/shared--markdown';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import { openConnection, closeConnection, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { openCompileCache, type CompileCache } from './cache.ts';
import { buildQuizData } from './export.ts';
import { compileQuizData } from './compile.ts';
import { writeQuizJson, type WriteResult } from './write.ts';
import type { QuizData } from './contract.ts';

const DATABASE_PATH = path.resolve(process.env['DATABASE_PATH'] ?? '../../database/output/content.db');
const QUIZ_DATA_OUT = path.resolve(process.env['QUIZ_DATA_OUT'] ?? '../../frontend/apps/quiz-web-app/public/data');
const CONTENT_DIR = path.resolve(process.env['CONTENT_DIR'] ?? '../../content/live/content/publish');
const ASSETS_OUT = path.join(QUIZ_DATA_OUT, 'assets', 'questions');
const CACHE_PATH = path.resolve(process.env['QUIZ_EXPORT_CACHE'] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/.cache/quiz-export/compile-cache.json'));

const isDryRun = process.argv.includes('--dry-run');
const noCache = process.argv.includes('--no-cache') || process.env['QUIZ_EXPORT_NO_CACHE'] === '1';
const pretty = process.argv.includes('--pretty');

const logSummary = (data: QuizData) => {
    const totalQuestions = [...data.questionsByPost.values()].reduce((sum, qs) => sum + qs.length, 0);
    console.log(`[quiz-export] found ${data.posts.length} posts with ${totalQuestions} published questions across ${data.questionsByTag.size} tags`);
};

const writeOrDryRun = async (data: QuizData): Promise<WriteResult | undefined> => {
    logSummary(data);

    if (isDryRun) {
        const totalQuestions = [...data.questionsByPost.values()].reduce((sum, qs) => sum + qs.length, 0);
        console.log(`[quiz-export] would write ${data.posts.length} question files, ${data.questionsByTag.size} tag files, posts.json, tags.json, and _all.json (${totalQuestions} questions) to ${QUIZ_DATA_OUT}`);
        return undefined;
    }

    console.log(`[quiz-export] writing to: ${QUIZ_DATA_OUT}`);
    return writeQuizJson(data, QUIZ_DATA_OUT, { pretty });
};

const logWarnings = (warnings: string[]) => {
    if (warnings.length === 0) return;
    const shown = warnings.slice(0, 20);
    console.log(`[quiz-export] ${warnings.length} warning(s):`);
    for (const warning of shown) {
        console.log(`  ${warning}`);
    }
    if (warnings.length > shown.length) {
        console.log(`  … and ${warnings.length - shown.length} more`);
    }
};

const stage = async <T>(name: string, fn: () => T | Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
        return await fn();
    } finally {
        console.log(`[quiz-export] ${name} in ${Math.round(performance.now() - start)}ms`);
    }
};

const main = async () => {
    if (isDryRun) {
        console.log('[quiz-export] dry-run mode - no files will be written');
    }
    if (noCache) {
        console.log('[quiz-export] cache disabled');
    }

    const warnings: string[] = [];
    const cache: CompileCache | undefined = noCache ? undefined : await openCompileCache(CACHE_PATH, MARKDOWN_COMPILER_VERSION);

    const tasks: Task<unknown>[] = [
        {
            name: 'Open DB Connection',
            action: () =>
                stage('open database', () => {
                    console.log(`[quiz-export] reading database: ${DATABASE_PATH}`);
                    return openConnection(DATABASE_PATH);
                }),
            dependsOn: [],
        },
        {
            name: 'Export Quiz Data',
            action: (ctx) => stage('read quiz rows', () => buildQuizData(ctx.getResult<DrizzleDb>('Open DB Connection'))),
            dependsOn: ['Open DB Connection'],
        },
        {
            name: 'Close DB Connection',
            action: (ctx) => closeConnection(ctx.getResult<DrizzleDb>('Open DB Connection')),
            dependsOn: ['Open DB Connection', 'Export Quiz Data'],
        },
        {
            name: 'Compile Quiz Data',
            action: (ctx) =>
                stage('compile markdown', async () => {
                    try {
                        return await compileQuizData(ctx.getResult<QuizData>('Export Quiz Data'), {
                            contentDir: CONTENT_DIR,
                            assetsOutDir: ASSETS_OUT,
                            warnings,
                            cache,
                        });
                    } finally {
                        if (cache) {
                            await cache.save();
                            console.log(`[quiz-export] compile cache: ${cache.stats.hits} hits, ${cache.stats.misses} misses (${CACHE_PATH})`);
                        }
                        logWarnings(warnings);
                    }
                }),
            dependsOn: ['Export Quiz Data'],
        },
        {
            name: 'Write Quiz JSON',
            action: (ctx) =>
                stage('write json', async () => {
                    const result = await writeOrDryRun(ctx.getResult<QuizData>('Compile Quiz Data'));
                    if (result) {
                        console.log(
                            `[quiz-export] wrote ${result.questionFilePaths.length} question files, ${result.tagFilePaths.length} tag files, posts.json, tags.json, _all.json; removed ${result.removedOrphans} stale files`
                        );
                    }
                    console.log('[quiz-export] done');
                }),
            dependsOn: ['Compile Quiz Data', 'Close DB Connection'],
        },
    ];

    const executor = taskManager().init(tasks);
    await executor.execute();
};

main().catch((err) => {
    console.error('[quiz-export] fatal:', err);
    process.exit(1);
});
