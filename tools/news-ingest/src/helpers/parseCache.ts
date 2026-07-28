import fs from 'node:fs';
import type { ScannedCacheFile } from './scanCache.ts';

export type CachedNewsItem = {
    slug: string;
    guid: string;
    title: string;
    link: string;
    source: string;
    sourceUrl: string;
    summary?: string;
    publishedAt?: string | null;
};

export type CategoryCacheFile = {
    category: string;
    label: string;
    fetchedAt: string;
    items: CachedNewsItem[];
};

export type ParsedCacheFile = {
    path: string;
    data: CategoryCacheFile;
};

export function parseCacheFiles(files: ScannedCacheFile[]): ParsedCacheFile[] {
    const parsed: ParsedCacheFile[] = [];

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(file.path, 'utf8')) as CategoryCacheFile;
            parsed.push({ path: file.path, data });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[news-ingest] failed to parse ${file.path}: ${message}`);
        }
    }

    return parsed;
}
