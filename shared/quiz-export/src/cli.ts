import path from 'node:path';
import { openConnection, closeConnection } from '@prj--personal-portfolio--v3/shared--db';
import { buildQuizData } from './export.ts';
import { writeQuizJson } from './write.ts';

const DATABASE_PATH = path.resolve(process.env['DATABASE_PATH'] ?? '../../database/output/content.db');
const QUIZ_DATA_OUT = path.resolve(process.env['QUIZ_DATA_OUT'] ?? '../../frontend/apps/quiz-web-app/public/data');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
    if (isDryRun) {
        console.log('[quiz-export] dry-run mode — no files will be written');
    }

    console.log(`[quiz-export] reading database: ${DATABASE_PATH}`);
    const db = openConnection(DATABASE_PATH);

    let data;
    try {
        data = await buildQuizData(db);
    } finally {
        closeConnection(db);
    }

    const totalQuestions = [...data.questionsByPost.values()].reduce((sum, qs) => sum + qs.length, 0);
    console.log(`[quiz-export] found ${data.posts.length} posts with ${totalQuestions} published questions`);

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
}

main().catch((err) => {
    console.error('[quiz-export] fatal:', err);
    process.exit(1);
});
