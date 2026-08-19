import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NewsIndex } from '@/lib/loadNews.ts';

const LOCAL_INDEX_CANDIDATES = [
    path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../../../content/news/cache/index.json'),
    path.resolve(process.cwd(), '../../../content/news/cache/index.json'),
];

/**
 * Build-time discovery of news categories (header, footer, getStaticPaths).
 * Prefers the CDN index when PUBLIC_NEWS_DATA_URL is set; falls back to the local news-sync cache.
 */
export async function loadNewsIndex(): Promise<NewsIndex> {
    const cdn = import.meta.env.PUBLIC_NEWS_DATA_URL?.replace(/\/$/, '');
    if (cdn) {
        try {
            const res = await fetch(`${cdn}/index.json`);
            if (res.ok) {
                return (await res.json()) as NewsIndex;
            }
            console.warn(`[news-feed] CDN index ${res.status}, falling back to local cache`);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[news-feed] CDN index fetch failed, falling back to local cache: ${message}`);
        }
    }

    for (const candidate of LOCAL_INDEX_CANDIDATES) {
        if (fs.existsSync(candidate)) {
            return JSON.parse(fs.readFileSync(candidate, 'utf8')) as NewsIndex;
        }
    }

    throw new Error('[news-feed] no news index: set PUBLIC_NEWS_DATA_URL or run news-sync to populate content/news/cache/index.json');
}
