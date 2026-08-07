import path from 'node:path';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import { openConnection, runMigrations, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { normalise, type NormalisedNews } from './helpers/normalise.ts';
import { parseCacheFiles, type ParsedCacheFile } from './helpers/parseCache.ts';
import { scanCacheFiles, type ScannedCacheFile } from './helpers/scanCache.ts';
import { upsertNewsItems } from './helpers/upsertRecords.ts';
import { validateCacheFiles, type ValidatedCache } from './helpers/validateCache.ts';

const CACHE_DIR = path.resolve(process.env['NEWS_CACHE_DIR'] ?? '../../content/news/cache');
const DATABASE_PATH = path.resolve(process.env['DATABASE_PATH'] ?? '../../database/output/content.db');
const MIGRATIONS_DIR = path.resolve(process.env['MIGRATIONS_DIR'] ?? '../../database/migrations');

const tasks: Task<unknown>[] = [
    {
        name: 'Scan Cache Files',
        action: () => scanCacheFiles(CACHE_DIR),
        dependsOn: [],
    },
    {
        name: 'Parse Cache Files',
        action: (ctx) => parseCacheFiles(ctx.getResult<ScannedCacheFile[]>('Scan Cache Files')),
        dependsOn: ['Scan Cache Files'],
    },
    {
        name: 'Validate Cache Files',
        action: (ctx) => validateCacheFiles(ctx.getResult<ParsedCacheFile[]>('Parse Cache Files')),
        dependsOn: ['Parse Cache Files'],
    },
    {
        name: 'Normalise to DB Rows',
        action: (ctx) => normalise(ctx.getResult<ValidatedCache>('Validate Cache Files').valid),
        dependsOn: ['Validate Cache Files'],
    },
    {
        name: 'Open DB Connection',
        action: () => openConnection(DATABASE_PATH),
        dependsOn: [],
    },
    {
        name: 'Run Migrations',
        action: (ctx) => runMigrations(ctx.getResult<DrizzleDb>('Open DB Connection'), MIGRATIONS_DIR),
        dependsOn: ['Open DB Connection'],
    },
    {
        name: 'Upsert Records',
        action: (ctx) =>
            upsertNewsItems({
                db: ctx.getResult<DrizzleDb>('Open DB Connection'),
                data: ctx.getResult<NormalisedNews>('Normalise to DB Rows'),
                dryRun: process.argv.includes('--dry-run'),
            }),
        dependsOn: ['Run Migrations', 'Normalise to DB Rows', 'Open DB Connection'],
    },
];

const main = async () => {
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) console.log('[news-ingest] dry-run mode - no writes will happen');
    console.log(`[news-ingest] cache=${CACHE_DIR}`);

    const executor = taskManager().init(tasks);
    await executor.execute();
};

main().catch((err) => {
    console.error('[news-ingest] fatal:', err);
    process.exit(1);
});
