import fs from 'node:fs';
import path from 'node:path';

export type ScannedCacheFile = {
    path: string;
    category: string;
};

export function scanCacheFiles(cacheDir: string): ScannedCacheFile[] {
    if (!fs.existsSync(cacheDir)) {
        console.warn(`[news-ingest] cache dir missing: ${cacheDir}`);
        return [];
    }

    return fs
        .readdirSync(cacheDir)
        .filter((name) => name.endsWith('.json') && name !== 'index.json')
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({
            path: path.join(cacheDir, name),
            category: name.replace(/\.json$/, ''),
        }));
}
