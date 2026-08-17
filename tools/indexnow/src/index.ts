import path from 'node:path';
import dotenv from 'dotenv';
import { taskManager } from '@prj--personal-portfolio--v3/shared--task-manager';
import { parseArgs } from './helpers/args.ts';
import { createTasks } from './helpers/tasks.ts';

dotenv.config({
    path: path.resolve('../../.env'),
});

const main = async () => {
    const args = parseArgs(process.argv.slice(2));
    if (args.dryRun) {
        console.log('[indexnow] dry-run mode - no writes or POSTs will happen');
    }

    const executor = taskManager().init(createTasks(args));
    await executor.execute();
};

main().catch((err) => {
    console.error('[indexnow] fatal:', err instanceof Error ? err.message : err);
    process.exit(1);
});
