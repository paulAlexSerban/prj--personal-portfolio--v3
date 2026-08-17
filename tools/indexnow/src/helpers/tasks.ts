import path from 'node:path';
import { type Task } from '@prj--personal-portfolio--v3/shared--task-manager';
import type { CliArgs } from './args.ts';
import { defaultSleep, type FetchLike, type Sleep } from './http.ts';
import { redact, redactKey, validateKey } from './key.ts';
import { buildPayload, INDEXNOW_ENDPOINT, redactedPayload, type IndexNowPayload } from './payload.ts';
import { collectUrlsFromDist } from './sitemap.ts';
import { submitIndexNow } from './submit.ts';
import { waitForKeyLocation } from './waitForKey.ts';
import { writeKeyFile } from './writeKey.ts';

export type SetupResult = {
    key: string;
    distDir: string;
    site?: string;
    dryRun: boolean;
};

export type RuntimeDeps = {
    fetch: FetchLike;
    sleep: Sleep;
    log: (message: string) => void;
};

const defaultDeps: RuntimeDeps = {
    fetch,
    sleep: defaultSleep,
    log: (message) => console.log(message),
};

export function createTasks(args: CliArgs, env: NodeJS.ProcessEnv = process.env, deps: Partial<RuntimeDeps> = {}): Task<unknown>[] {
    const runtime: RuntimeDeps = { ...defaultDeps, ...deps };

    const tasks: Task<unknown>[] = [
        {
            name: 'Setup Environment',
            action: (): SetupResult => {
                const key = validateKey(env['INDEX_NOW_API_KEY']);
                const distDir = path.resolve(args.dist);
                runtime.log(`[indexnow] dist=${distDir} write-key=${args.writeKey} submit=${args.submit} dry-run=${args.dryRun} key=${redactKey(key)}`);
                return { key, distDir, site: args.site, dryRun: args.dryRun };
            },
            dependsOn: [],
        },
    ];

    if (args.writeKey) {
        tasks.push({
            name: 'Write Key File',
            action: async (ctx) => {
                const setup = ctx.getResult<SetupResult>('Setup Environment');
                const filePath = path.join(setup.distDir, `${setup.key}.txt`);
                const mask = (text: string) => redact(text, setup.key);
                if (setup.dryRun) {
                    runtime.log(`[indexnow] [dry-run] would write ${mask(filePath)}`);
                    return filePath;
                }
                const written = await writeKeyFile(setup.distDir, setup.key);
                runtime.log(`[indexnow] wrote ${mask(written)}`);
                return written;
            },
            dependsOn: ['Setup Environment'],
        });
    }

    if (args.submit) {
        tasks.push(
            {
                name: 'Parse Sitemap',
                action: async (ctx) => {
                    const setup = ctx.getResult<SetupResult>('Setup Environment');
                    if (!setup.site) {
                        throw new Error('--site is required with --submit');
                    }
                    return collectUrlsFromDist(setup.distDir, setup.site);
                },
                dependsOn: ['Setup Environment'],
            },
            {
                name: 'Build Payload',
                action: (ctx) => {
                    const setup = ctx.getResult<SetupResult>('Setup Environment');
                    const urls = ctx.getResult<string[]>('Parse Sitemap');
                    if (!setup.site) {
                        throw new Error('--site is required with --submit');
                    }
                    const payload = buildPayload({ site: setup.site, key: setup.key, urls });
                    const mask = (text: string) => redact(text, setup.key);
                    runtime.log(`[indexnow] ${JSON.stringify(redactedPayload(payload, mask))}`);
                    return payload;
                },
                dependsOn: ['Parse Sitemap', 'Setup Environment'],
            },
            {
                name: 'Wait for Key Location',
                action: async (ctx) => {
                    const setup = ctx.getResult<SetupResult>('Setup Environment');
                    const payload = ctx.getResult<IndexNowPayload>('Build Payload');
                    const mask = (text: string) => redact(text, setup.key);
                    if (setup.dryRun) {
                        runtime.log(`[indexnow] [dry-run] would wait for ${mask(payload.keyLocation)} then POST ${INDEXNOW_ENDPOINT}`);
                        return;
                    }
                    runtime.log(`[indexnow] waiting for ${mask(payload.keyLocation)}`);
                    await waitForKeyLocation(payload.keyLocation, { fetch: runtime.fetch, sleep: runtime.sleep });
                    runtime.log(`[indexnow] keyLocation reachable`);
                },
                dependsOn: ['Build Payload', 'Setup Environment'],
            },
            {
                name: 'Submit IndexNow',
                action: async (ctx) => {
                    const setup = ctx.getResult<SetupResult>('Setup Environment');
                    const payload = ctx.getResult<IndexNowPayload>('Build Payload');
                    if (setup.dryRun) {
                        return;
                    }
                    const status = await submitIndexNow(payload, { fetch: runtime.fetch, sleep: runtime.sleep });
                    runtime.log(`[indexnow] submitted ${payload.urlList.length} URLs status=${status}`);
                    return status;
                },
                dependsOn: ['Wait for Key Location', 'Build Payload', 'Setup Environment'],
            }
        );
    }

    return tasks;
}
