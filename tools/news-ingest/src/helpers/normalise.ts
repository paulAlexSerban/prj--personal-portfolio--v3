import { ulid } from 'ulidx';
import type { NewNewsItemRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { ParsedCacheFile } from './parseCache.ts';

export type NormalisedNews = {
    rows: NewNewsItemRow[];
    slugs: Set<string>;
    labels: Map<string, string>;
};

export function normalise(files: ParsedCacheFile[]): NormalisedNews {
    const rows: NewNewsItemRow[] = [];
    const slugs = new Set<string>();
    const labels = new Map<string, string>();
    const now = new Date();

    for (const file of files) {
        labels.set(file.data.category, file.data.label);
        const fetchedAt = file.data.fetchedAt ? new Date(file.data.fetchedAt) : now;

        for (const item of file.data.items) {
            if (slugs.has(item.slug)) continue;
            slugs.add(item.slug);

            rows.push({
                id: ulid(),
                slug: item.slug,
                guid: item.guid,
                title: item.title,
                link: item.link,
                source: item.source,
                source_url: item.sourceUrl,
                category: file.data.category,
                summary: item.summary ?? '',
                published_at: item.publishedAt ? new Date(item.publishedAt) : null,
                fetched_at: Number.isNaN(fetchedAt.getTime()) ? now : fetchedAt,
                sync_source: 'rss',
                locked: false,
            });
        }
    }

    return { rows, slugs, labels };
}
