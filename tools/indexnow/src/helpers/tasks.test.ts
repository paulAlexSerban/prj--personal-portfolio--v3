import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { taskManager } from '@prj--personal-portfolio--v3/shared--task-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INDEXNOW_ENDPOINT } from './payload.ts';
import { createTasks } from './tasks.ts';

const key = 'abcd1234efgh5678';
const site = 'https://paulserban.eu';
const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://paulserban.eu/</loc></url>
  <url><loc>https://paulserban.eu/cv/</loc></url>
</urlset>
`;

let distDir = '';

beforeEach(async () => {
    distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'indexnow-tasks-'));
    await fs.writeFile(path.join(distDir, 'sitemap-0.xml'), urlset);
});

afterEach(async () => {
    if (distDir) {
        await fs.rm(distDir, { recursive: true, force: true });
    }
});

describe('createTasks', () => {
    it('dry-run never calls fetch and does not write the key file', async () => {
        const fetchImpl = vi.fn();
        const log = vi.fn();

        await taskManager()
            .init(createTasks({ dist: distDir, site, dryRun: true, writeKey: true, submit: true }, { INDEX_NOW_API_KEY: key }, { fetch: fetchImpl, log, sleep: vi.fn() }))
            .execute();

        expect(fetchImpl).not.toHaveBeenCalled();
        await expect(fs.access(path.join(distDir, `${key}.txt`))).rejects.toThrow();
        const logs = log.mock.calls.map((call) => String(call[0])).join('\n');
        expect(logs).toContain('[dry-run]');
        expect(logs).toContain(INDEXNOW_ENDPOINT);
        expect(logs).not.toContain(key);
        expect(logs).toContain('***5678');
    });

    it('writes the key and submits after the key URL is reachable', async () => {
        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce(new Response(key, { status: 200 }))
            .mockResolvedValueOnce(new Response('', { status: 202 }));
        const log = vi.fn();

        await taskManager()
            .init(createTasks({ dist: distDir, site, dryRun: false, writeKey: true, submit: true }, { INDEX_NOW_API_KEY: key }, { fetch: fetchImpl, log, sleep: vi.fn() }))
            .execute();

        expect(await fs.readFile(path.join(distDir, `${key}.txt`), 'utf8')).toBe(key);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(fetchImpl.mock.calls[0]?.[0]).toBe(`https://paulserban.eu/${key}.txt`);
        expect(fetchImpl.mock.calls[1]?.[0]).toBe(INDEXNOW_ENDPOINT);
        const logs = log.mock.calls.map((call) => String(call[0])).join('\n');
        expect(logs).not.toContain(key);
    });

    it('omits submit tasks when only --write-key is set', () => {
        const names = createTasks({ dist: distDir, dryRun: false, writeKey: true, submit: false }, { INDEX_NOW_API_KEY: key }).map((task) => task.name);
        expect(names).toEqual(['Setup Environment', 'Write Key File']);
    });

    it('omits write-key when only --submit is set', () => {
        const names = createTasks({ dist: distDir, site, dryRun: false, writeKey: false, submit: true }, { INDEX_NOW_API_KEY: key }).map((task) => task.name);
        expect(names).toEqual(['Setup Environment', 'Parse Sitemap', 'Build Payload', 'Wait for Key Location', 'Submit IndexNow']);
    });
});
