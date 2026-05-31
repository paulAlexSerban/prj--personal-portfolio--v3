import path from 'node:path';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import { openConnection, runMigrations, type DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { markdownFilesScanner, type ScannedDirectory } from './helpers/markdownFileScanner.ts';
import { markdownParser, type ParsedFile } from './helpers/markdownParser.ts';
import { validateParsedFiles, type ValidationResult } from './helpers/validateParsedFiles.ts';
import { normalise, type NormalisedRows } from './helpers/normalise.ts';
import { upsertRecords } from './helpers/upsertRecords.ts';

const CONTENT_DIR = path.resolve(process.env['CONTENT_DIR'] ?? '../../content/live/content/publish');
const DATABASE_PATH = path.resolve(process.env['DATABASE_PATH'] ?? '../../database/output/content.db');
const MIGRATIONS_DIR = path.resolve(process.env['MIGRATIONS_DIR'] ?? '../../database/migrations');

const scanMarkdownFiles = markdownFilesScanner({ baseDir: CONTENT_DIR });

const tasks: Task<unknown>[] = [
    {
        name: 'Scan Markdown Files',
        action: () => scanMarkdownFiles(),
        dependsOn: [],
    },
    {
        name: 'Parse Markdown Files',
        action: (ctx) => markdownParser(ctx.getResult<ScannedDirectory[]>('Scan Markdown Files')),
        dependsOn: ['Scan Markdown Files'],
    },
    {
        name: 'Validate Parsed Files',
        action: (ctx) => validateParsedFiles(ctx.getResult<ParsedFile[]>('Parse Markdown Files')),
        dependsOn: ['Parse Markdown Files'],
    },
    {
        name: 'Normalise to DB Rows',
        action: (ctx) => normalise(ctx.getResult<ValidationResult>('Validate Parsed Files').valid),
        dependsOn: ['Validate Parsed Files'],
    },
    {
        name: 'Open DB Connection',
        action: () => openConnection(DATABASE_PATH),
        dependsOn: [], // runs in parallel with the parse chain
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
                db: ctx.getResult<DrizzleDb>('Open DB Connection'),
                rows: ctx.getResult<NormalisedRows>('Normalise to DB Rows'),
                dryRun: process.argv.includes('--dry-run'),
            }),
        dependsOn: ['Run Migrations', 'Normalise to DB Rows', 'Open DB Connection'],
    },
];

const main = async () => {
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) console.log('[mdx-ingest] dry-run mode — no writes will happen');

    const executor = taskManager().init(tasks);
    await executor.execute();
};

main().catch((err) => {
    console.error('[mdx-ingest] fatal:', err);
    process.exit(1);
});
