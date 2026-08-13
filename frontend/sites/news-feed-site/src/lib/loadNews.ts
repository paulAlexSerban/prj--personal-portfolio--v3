import { CATEGORY_ORDER } from '@/lib/queries/news.ts';

export type CachedNewsItem = {
    slug: string;
    guid: string;
    title: string;
    link: string;
    source: string;
    sourceUrl: string;
    summary: string;
    publishedAt: string | null;
};

export type NewsItem = CachedNewsItem & {
    category: string;
};

export type NewsIndexCategory = {
    slug: string;
    label: string;
    count: number;
};

export type NewsIndex = {
    fetchedAt: string;
    categories: NewsIndexCategory[];
};

type CategoryCacheFile = {
    category: string;
    label: string;
    fetchedAt: string;
    items: CachedNewsItem[];
};

export type NewsBundle = {
    index: NewsIndex;
    items: NewsItem[];
};

function newsDataBase(): string {
    const fromEnv = import.meta.env.PUBLIC_NEWS_DATA_URL?.replace(/\/$/, '');
    if (fromEnv) return fromEnv;
    return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/news-data`;
}

async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

let bundleCache: NewsBundle | null = null;

function sortItems(items: NewsItem[]): NewsItem[] {
    return [...items].sort((a, b) => {
        const ta = a.publishedAt ?? '';
        const tb = b.publishedAt ?? '';
        if (ta !== tb) return tb.localeCompare(ta);
        return a.slug.localeCompare(b.slug);
    });
}

function sortCategories(categories: NewsIndexCategory[]): NewsIndexCategory[] {
    const order = CATEGORY_ORDER as readonly string[];
    return [...categories].sort((a, b) => {
        const ia = order.indexOf(a.slug);
        const ib = order.indexOf(b.slug);
        const sa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
        const sb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
        return sa - sb;
    });
}

/** Load index.json plus every category file. Cached for the lifetime of the page. */
export async function loadNewsBundle(): Promise<NewsBundle> {
    if (bundleCache) return bundleCache;

    const base = newsDataBase();
    const index = await fetchJson<NewsIndex>(`${base}/index.json`);
    const files = await Promise.all(
        index.categories.map((category) => fetchJson<CategoryCacheFile>(`${base}/${category.slug}.json`)),
    );

    const items: NewsItem[] = [];
    for (const file of files) {
        for (const item of file.items) {
            items.push({ ...item, category: file.category });
        }
    }

    bundleCache = {
        index: { ...index, categories: sortCategories(index.categories) },
        items: sortItems(items),
    };
    return bundleCache;
}

export function itemsForCategory(bundle: NewsBundle, category?: string): NewsItem[] {
    if (!category) return bundle.items;
    return bundle.items.filter((item) => item.category === category);
}

export function clearNewsBundleCache(): void {
    bundleCache = null;
}
