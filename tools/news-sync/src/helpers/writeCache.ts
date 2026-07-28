import fs from 'node:fs';
import path from 'node:path';
import type { CategoryCacheFile } from './types.ts';
import type { FetchedCategory } from './fetchFeeds.ts';

export function writeCategoryCaches(outDir: string, categories: FetchedCategory[], fetchedAt: string): void {
    fs.mkdirSync(outDir, { recursive: true });

    // Remove stale category files so deleted categories don't linger.
    for (const existing of fs.readdirSync(outDir)) {
        if (!existing.endsWith('.json')) continue;
        const slug = existing.replace(/\.json$/, '');
        if (!categories.some((c) => c.category === slug)) {
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
}
