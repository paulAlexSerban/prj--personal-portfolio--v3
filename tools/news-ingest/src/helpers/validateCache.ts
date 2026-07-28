import type { CachedNewsItem, CategoryCacheFile, ParsedCacheFile } from './parseCache.ts';

export type ValidatedCache = {
    valid: ParsedCacheFile[];
    invalidCount: number;
};

const requiredItemFields = ['slug', 'guid', 'title', 'link', 'source', 'sourceUrl'] as const;

function isValidItem(item: CachedNewsItem): boolean {
    return requiredItemFields.every((field) => typeof item[field] === 'string' && item[field].trim().length > 0);
}

function isValidCache(data: CategoryCacheFile): boolean {
    if (!data.category || !data.label || !Array.isArray(data.items)) return false;
    return data.items.every(isValidItem);
}

export function validateCacheFiles(files: ParsedCacheFile[]): ValidatedCache {
    const valid: ParsedCacheFile[] = [];
    let invalidCount = 0;

    for (const file of files) {
        if (!isValidCache(file.data)) {
            console.warn(`[news-ingest] invalid cache skipped: ${file.path}`);
            invalidCount += 1;
            continue;
        }
        if (file.data.category !== pathCategory(file.path) && pathCategory(file.path)) {
            // Prefer file name as source of truth for category slug.
            file.data.category = pathCategory(file.path)!;
        }
        valid.push(file);
    }

    return { valid, invalidCount };
}

function pathCategory(filePath: string): string | undefined {
    const base = filePath.split(/[/\\]/).pop();
    return base?.replace(/\.json$/, '');
}
