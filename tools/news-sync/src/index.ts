import path from 'node:path';
import dotenv from 'dotenv';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import { applyRetention, dedupeAcrossCategories } from './helpers/dedupeAndRetain.ts';
import { fetchAllCategories, type FetchedCategory } from './helpers/fetchFeeds.ts';
import { loadFeedConfigs } from './helpers/loadFeedConfigs.ts';
import type { CategoryFeedFile } from './helpers/types.ts';
import { writeCategoryCaches } from './helpers/writeCache.ts';
import cleanRepoDir from './helpers/cleanRepoDir.ts';

dotenv.config({ path: path.resolve('../../.env') });

const CACHE_DIR = path.resolve(process.env['NEWS_CACHE_DIR'] ?? '../../content/news/cache');
const RETENTION_DAYS = Number(process.env['NEWS_RETENTION_DAYS'] ?? 14);

const tasks: Task<unknown>[] = [
    {
        name: 'Clean Cache Directory',
        action: () => cleanRepoDir(CACHE_DIR),
        dependsOn: [],
    },
    {
        name: 'Load Feed Configs',
        action: () => loadFeedConfigs(),
        dependsOn: ['Clean Cache Directory'],
    },
    {
        name: 'Fetch Feeds',
        action: (ctx) => fetchAllCategories(ctx.getResult<CategoryFeedFile[]>('Load Feed Configs')),
        dependsOn: ['Load Feed Configs'],
    },
    {
        name: 'Dedupe Items',
        action: (ctx) => dedupeAcrossCategories(ctx.getResult<FetchedCategory[]>('Fetch Feeds')),
        dependsOn: ['Fetch Feeds'],
    },
    {
        name: 'Apply Retention',
        action: (ctx) => applyRetention(ctx.getResult<FetchedCategory[]>('Dedupe Items'), RETENTION_DAYS),
        dependsOn: ['Dedupe Items'],
    },
    {
        name: 'Write Cache',
        action: (ctx) => {
            const categories = ctx.getResult<FetchedCategory[]>('Apply Retention');
            writeCategoryCaches(CACHE_DIR, categories, new Date().toISOString());
            return categories;
        },
        dependsOn: ['Apply Retention'],
    },
];

const main = async () => {
    console.log(`[news-sync] retention=${RETENTION_DAYS}d cache=${CACHE_DIR}`);
    const executor = taskManager().init(tasks);
    await executor.execute();
};

main()
    .catch((err) => {
        console.error('[news-sync] fatal:', err);
        process.exit(1);
    })
    .then(() => {
        // isomorphic-dompurify/jsdom keeps the event loop alive otherwise
        process.exit(0);
    });
