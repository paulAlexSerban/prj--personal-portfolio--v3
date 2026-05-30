import path from 'path';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import { openConnection, runMigrations, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { jsonFilesScanner, type ScannedDirectory } from './helpers/jsonFileScanner.ts';
import { jsonParser, type ParsedFile } from './helpers/jsonParser.ts';
import { validateParsedFiles, type ValidationResult } from './helpers/validateParsedFiles.ts';
import { normalise, type NormalisedRows } from './helpers/normalise.ts';
import { upsertRecords } from './helpers/upsertRecords.ts';

const CONTENT_DIR    = path.resolve(process.env['CONTENT_DIR']    ?? '../../content/live/content/publish');
const DATABASE_PATH  = path.resolve(process.env['DATABASE_PATH']  ?? '../../database/content.db');
const MIGRATIONS_DIR = path.resolve(process.env['MIGRATIONS_DIR'] ?? '../../database/migrations');

const scanJsonFiles = jsonFilesScanner({ baseDir: CONTENT_DIR });

const tasks: Task<unknown>[] = [
    {
        name: 'Scan JSON Files',
        action: () => scanJsonFiles(),
        dependsOn: [],
    },
    {
        name: 'Parse JSON Files',
        action: (ctx) => jsonParser(ctx.getResult<ScannedDirectory[]>('Scan JSON Files')),
        dependsOn: ['Scan JSON Files'],
    },
    {
        name: 'Validate Parsed Files',
        action: (ctx) => validateParsedFiles(ctx.getResult<ParsedFile[]>('Parse JSON Files')),
        dependsOn: ['Parse JSON Files'],
    },
    {
        name: 'Normalise to DB Rows',
        action: (ctx) => normalise(ctx.getResult<ValidationResult>('Validate Parsed Files').valid),
        dependsOn: ['Validate Parsed Files'],
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
            upsertRecords({
                db:     ctx.getResult<DrizzleDb>('Open DB Connection'),
                rows:   ctx.getResult<NormalisedRows>('Normalise to DB Rows'),
                dryRun: process.argv.includes('--dry-run'),
            }),
        dependsOn: ['Run Migrations', 'Normalise to DB Rows', 'Open DB Connection'],
    },
];

const main = async () => {
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) console.log('[json-ingest] dry-run mode — no writes will happen');

    const executor = taskManager().init(tasks);
    await executor.execute();
};

main().catch((err) => {
    console.error('[json-ingest] fatal:', err);
    process.exit(1);
});
