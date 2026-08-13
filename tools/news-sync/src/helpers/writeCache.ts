import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_ORDER } from './loadFeedConfigs.ts';
import type { CategoryCacheFile, NewsIndexFile } from './types.ts';
import type { FetchedCategory } from './fetchFeeds.ts';

const INDEX_FILE = 'index.json';

export function writeCategoryCaches(outDir: string, categories: FetchedCategory[], fetchedAt: string): void {
    fs.mkdirSync(outDir, { recursive: true });

    const knownSlugs = new Set(categories.map((c) => c.category));

    // Remove stale category files so deleted categories don't linger.
    // Keep index.json — it is rewritten below.
    for (const existing of fs.readdirSync(outDir)) {
        if (!existing.endsWith('.json') || existing === INDEX_FILE) continue;
        const slug = existing.replace(/\.json$/, '');
        if (!knownSlugs.has(slug)) {
            fs.unlinkSync(path.join(outDir, existing));
            console.log(`[news-sync] removed stale cache: ${existing}`);
        }
    }

    for (const cat of categories) {
        const payload: CategoryCacheFile = {
            category: cat.category,
            label: cat.label,
            fetchedAt,
            items: cat.items,
        };
        const filePath = path.join(outDir, `${cat.category}.json`);
        fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        console.log(`[news-sync] wrote ${filePath} (${cat.items.length} items)`);
    }

    const bySlug = new Map(categories.map((c) => [c.category, c]));
    const ordered = CATEGORY_ORDER.map((slug) => bySlug.get(slug)).filter((c): c is FetchedCategory => Boolean(c));
    for (const cat of categories) {
        if (!(CATEGORY_ORDER as readonly string[]).includes(cat.category)) {
            ordered.push(cat);
        }
    }

    const index: NewsIndexFile = {
        fetchedAt,
        categories: ordered.map((c) => ({
            slug: c.category,
            label: c.label,
            count: c.items.length,
        })),
    };
    const indexPath = path.join(outDir, INDEX_FILE);
    fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
    console.log(`[news-sync] wrote ${indexPath} (${index.categories.length} categories)`);
}
