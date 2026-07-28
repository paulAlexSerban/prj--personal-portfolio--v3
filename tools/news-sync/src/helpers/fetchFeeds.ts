import Parser from 'rss-parser';
import { normalizeItem, type RawFeedItem } from './normalize.ts';
import type { CachedNewsItem, CategoryFeedFile, FeedConfig } from './types.ts';

const parser = new Parser({
    timeout: 20_000,
    headers: {
        'User-Agent': 'paulserban-news-sync/1.0 (+https://news-feed.paulserban.eu)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
});

async function fetchOneFeed(feed: FeedConfig): Promise<CachedNewsItem[]> {
    try {
        const parsed = await parser.parseURL(feed.url);
        const items: CachedNewsItem[] = [];
        for (const raw of parsed.items ?? []) {
            const normalized = normalizeItem(raw as RawFeedItem, feed.title, feed.url);
            if (normalized) items.push(normalized);
        }
        console.log(`  [ok] ${feed.title}: ${items.length} items`);
        return items;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  [skip] ${feed.title}: ${message}`);
        return [];
    }
}

export type FetchedCategory = {
    category: string;
    label: string;
    items: CachedNewsItem[];
};

export async function fetchCategoryFeeds(config: CategoryFeedFile): Promise<FetchedCategory> {
    console.log(`[news-sync] fetching category: ${config.label} (${config.feeds.length} feeds)`);
    const batches = await Promise.all(config.feeds.map((feed) => fetchOneFeed(feed)));
    return {
        category: config.category,
        label: config.label,
        items: batches.flat(),
    };
}

export async function fetchAllCategories(configs: CategoryFeedFile[]): Promise<FetchedCategory[]> {
    // Categories in parallel; feeds within a category also parallel.
    return Promise.all(configs.map((config) => fetchCategoryFeeds(config)));
}
