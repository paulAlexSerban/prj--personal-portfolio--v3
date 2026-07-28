import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CategoryFeedFile } from './types.ts';

const FEEDS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../feeds');

/** Stable display order for category tabs / nav. */
export const CATEGORY_ORDER = ['tech', 'web-dev', 'front-end', 'javascript', 'programming', 'system-design', 'cybersecurity'] as const;

export function loadFeedConfigs(): CategoryFeedFile[] {
    const files = fs
        .readdirSync(FEEDS_DIR)
        .filter((name) => name.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b));

    const byCategory = new Map<string, CategoryFeedFile>();

    for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(path.join(FEEDS_DIR, file), 'utf8')) as CategoryFeedFile;
        if (!raw.category || !raw.label || !Array.isArray(raw.feeds)) {
            console.warn(`[news-sync] skipping invalid feed config: ${file}`);
            continue;
        }

        // Deduplicate feed URLs within a category (legacy had duplicates).
        const seenUrls = new Set<string>();
        const feeds = raw.feeds.filter((feed) => {
            const key = feed.url.trim().replace(/\/$/, '');
            if (seenUrls.has(key)) {
                console.warn(`[news-sync] duplicate feed URL skipped in ${raw.category}: ${feed.url}`);
                return false;
            }
            seenUrls.add(key);
            return Boolean(feed.title && feed.url);
        });

        byCategory.set(raw.category, { ...raw, feeds });
    }

    return CATEGORY_ORDER.map((slug) => byCategory.get(slug)).filter((c): c is CategoryFeedFile => Boolean(c));
}
