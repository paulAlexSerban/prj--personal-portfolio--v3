import fs from 'node:fs';
import path from 'node:path';
import type { CategoryFeedFile, FeedConfig } from './types.ts';

type LoadedCategory = CategoryFeedFile & { sort_order: number; sourceFile: string };

function isFeedConfig(value: unknown): value is FeedConfig {
    if (typeof value !== 'object' || value === null) return false;
    const feed = value as Record<string, unknown>;
    return typeof feed['title'] === 'string' && feed['title'].length > 0 && typeof feed['url'] === 'string' && feed['url'].length > 0;
}

function parseCategoryFile(raw: unknown): CategoryFeedFile | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const data = raw as Record<string, unknown>;
    if (typeof data['category'] !== 'string' || data['category'].length === 0) return null;
    if (typeof data['label'] !== 'string' || data['label'].length === 0) return null;
    if (!Array.isArray(data['feeds'])) return null;

    const sort_order = typeof data['sort_order'] === 'number' && Number.isFinite(data['sort_order']) ? data['sort_order'] : 0;

    return {
        category: data['category'],
        label: data['label'],
        sort_order,
        feeds: data['feeds'] as FeedConfig[],
    };
}

export function loadFeedConfigs(feedsDir: string): CategoryFeedFile[] {
    if (!fs.existsSync(feedsDir) || !fs.statSync(feedsDir).isDirectory()) {
        throw new Error(`[news-sync] feeds directory missing: ${feedsDir} (run content-sync first)`);
    }

    const files = fs
        .readdirSync(feedsDir)
        .filter((name) => name.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b));

    const loaded: LoadedCategory[] = [];
    const seenCategories = new Set<string>();

    for (const file of files) {
        const filePath = path.join(feedsDir, file);
        let parsed: unknown;
        try {
            parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[news-sync] skipping invalid JSON: ${file} (${message})`);
            continue;
        }

        const raw = parseCategoryFile(parsed);
        if (!raw) {
            console.warn(`[news-sync] skipping invalid feed config: ${file}`);
            continue;
        }

        if (seenCategories.has(raw.category)) {
            console.warn(`[news-sync] duplicate category skipped: ${raw.category} (${file})`);
            continue;
        }
        seenCategories.add(raw.category);

        const seenUrls = new Set<string>();
        const feeds = raw.feeds.filter((feed) => {
            if (!isFeedConfig(feed)) {
                console.warn(`[news-sync] skipping invalid feed entry in ${raw.category}`);
                return false;
            }
            const key = feed.url.trim().replace(/\/$/, '');
            if (seenUrls.has(key)) {
                console.warn(`[news-sync] duplicate feed URL skipped in ${raw.category}: ${feed.url}`);
                return false;
            }
            seenUrls.add(key);
            return true;
        });

        loaded.push({ ...raw, feeds, sourceFile: file, sort_order: raw.sort_order ?? 0 });
    }

    loaded.sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.sourceFile.localeCompare(b.sourceFile);
    });

    return loaded.map((cat) => ({
        category: cat.category,
        label: cat.label,
        sort_order: cat.sort_order,
        feeds: cat.feeds,
    }));
}
