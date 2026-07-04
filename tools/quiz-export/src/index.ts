import path from 'node:path';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import { openConnection, closeConnection, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { buildQuizData } from './export.ts';
import { compileQuizData } from './compile.ts';
import { writeQuizJson } from './write.ts';
import type { QuizData } from './contract.ts';

const DATABASE_PATH = path.resolve(process.env['DATABASE_PATH'] ?? '../../database/output/content.db');
const QUIZ_DATA_OUT = path.resolve(process.env['QUIZ_DATA_OUT'] ?? '../../frontend/apps/quiz-web-app/public/data');
const CONTENT_DIR = path.resolve(process.env['CONTENT_DIR'] ?? '../../content/live/content/publish');
const ASSETS_OUT = path.join(QUIZ_DATA_OUT, 'assets', 'questions');

const isDryRun = process.argv.includes('--dry-run');

const logSummary = (data: QuizData) => {
    const totalQuestions = [...data.questionsByPost.values()].reduce((sum, qs) => sum + qs.length, 0);
    console.log(`[quiz-export] found ${data.posts.length} posts with ${totalQuestions} published questions`);
};

const writeOrDryRun = async (data: QuizData) => {
    logSummary(data);

    if (isDryRun) {
        console.log(`[quiz-export] would write to: ${QUIZ_DATA_OUT}`);
        for (const post of data.posts) {
            console.log(`  questions/${post.slug}.json  (${post.questionCount} questions)`);
        }
        console.log(`  tags.json  (${data.questionsByTag.size} tags)`);
        for (const [tagSlug, qs] of data.questionsByTag.entries()) {
            console.log(`  tags/${tagSlug}.json  (${qs.length} questions)`);
        }
        return;
    }

    console.log(`[quiz-export] writing to: ${QUIZ_DATA_OUT}`);
    const result = await writeQuizJson(data, QUIZ_DATA_OUT);

    console.log(`[quiz-export] wrote: ${result.postsIndexPath}`);
    for (const p of result.questionFilePaths) {
        console.log(`[quiz-export] wrote: ${p}`);
    }
    console.log(`[quiz-export] wrote: ${result.tagsIndexPath}`);
    for (const p of result.tagFilePaths) {
        console.log(`[quiz-export] wrote: ${p}`);
    }
    console.log(`[quiz-export] wrote: ${result.allBundlePath}`);
    console.log('[quiz-export] done');
};

const tasks: Task<unknown>[] = [
    {
        name: 'Open DB Connection',
        action: () => {
            console.log(`[quiz-export] reading database: ${DATABASE_PATH}`);
            return openConnection(DATABASE_PATH);
        },
        dependsOn: [],
    },
    {
        name: 'Export Quiz Data',
        action: (ctx) => buildQuizData(ctx.getResult<DrizzleDb>('Open DB Connection')),
        dependsOn: ['Open DB Connection'],
    },
    {
        name: 'Close DB Connection',
        action: (ctx) => closeConnection(ctx.getResult<DrizzleDb>('Open DB Connection')),
        dependsOn: ['Open DB Connection', 'Export Quiz Data'],
    },
    {
        name: 'Compile Quiz Data',
        action: (ctx) => {
            console.log('[quiz-export] compiling MDX/markdown → HTML…');
            return compileQuizData(ctx.getResult<QuizData>('Export Quiz Data'), {
                contentDir: CONTENT_DIR,
                assetsOutDir: ASSETS_OUT,
            });
        },
        dependsOn: ['Export Quiz Data'],
    },
    {
        name: 'Write Quiz JSON',
        action: (ctx) => writeOrDryRun(ctx.getResult<QuizData>('Compile Quiz Data')),
        dependsOn: ['Compile Quiz Data', 'Close DB Connection'],
    },
];

const main = async () => {
    if (isDryRun) {
        console.log('[quiz-export] dry-run mode — no files will be written');
    }

    const executor = taskManager().init(tasks);
    await executor.execute();
};

main().catch((err) => {
    console.error('[quiz-export] fatal:', err);
    process.exit(1);
});
