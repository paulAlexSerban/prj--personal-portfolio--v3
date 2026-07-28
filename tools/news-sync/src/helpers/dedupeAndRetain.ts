import { isWithinRetention, normalizeLink, retentionCutoffMs, sortByPublishedDesc } from './normalize.ts';
import type { CachedNewsItem } from './types.ts';
import type { FetchedCategory } from './fetchFeeds.ts';

const MAX_ITEMS_PER_CATEGORY = 100;
const MIN_ITEMS_PER_CATEGORY = 10;

/**
 * Cross-category dedupe by guid, then by normalized link.
 * First-seen category wins (CATEGORY_ORDER from loadFeedConfigs).
 */
export function dedupeAcrossCategories(categories: FetchedCategory[]): FetchedCategory[] {
    const seenGuids = new Set<string>();
    const seenLinks = new Set<string>();

    return categories.map((cat) => {
        const items: CachedNewsItem[] = [];
        for (const item of cat.items) {
            const linkKey = normalizeLink(item.link);
            if (seenGuids.has(item.guid) || seenLinks.has(linkKey)) continue;
            seenGuids.add(item.guid);
            seenLinks.add(linkKey);
            items.push(item);
        }
        return { ...cat, items };
    });
}

export function applyRetention(categories: FetchedCategory[], retentionDays: number): FetchedCategory[] {
    const cutoff = retentionCutoffMs(retentionDays);

    return categories.map((cat) => {
        const sorted = sortByPublishedDesc(cat.items);
        const withinWindow = sorted.filter((item) => isWithinRetention(item.publishedAt, cutoff));

        // If the window is too sparse, fall back to the newest MIN items (legacy behaviour).
        const pool = withinWindow.length >= MIN_ITEMS_PER_CATEGORY ? withinWindow : sorted;
        const items = pool.slice(0, MAX_ITEMS_PER_CATEGORY);

        return { ...cat, items };
    });
}
