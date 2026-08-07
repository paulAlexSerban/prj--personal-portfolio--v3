import { news_items, type NewsItemRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { count, desc, eq, sql } from 'drizzle-orm';

/** Stable nav / listing order (matches tools/news-sync CATEGORY_ORDER). */
export const CATEGORY_ORDER = [
    'tech',
    'web-dev',
    'front-end',
    'javascript',
    'programming',
    'system-design',
    'cybersecurity',
] as const;

export type CategorySlug = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABEL: Record<string, string> = {
    tech: 'Tech',
    'web-dev': 'Web Development',
    'front-end': 'Front-end',
    javascript: 'JavaScript',
    programming: 'Programming',
    'system-design': 'System Design',
    cybersecurity: 'Cybersecurity',
};

export type NewsCategory = {
    slug: string;
    label: string;
    count: number;
};

export function getCategories(db: DrizzleDb): NewsCategory[] {
    const rows = db
        .select({
            slug: news_items.category,
            count: count(),
        })
        .from(news_items)
        .groupBy(news_items.category)
        .all();

    const bySlug = new Map(rows.map((r) => [r.slug, r.count]));

    // Prefer stable order; append any unexpected categories at the end.
    const ordered: NewsCategory[] = CATEGORY_ORDER.filter((slug) => bySlug.has(slug)).map((slug) => ({
        slug,
        label: CATEGORY_LABEL[slug] ?? slug,
        count: bySlug.get(slug) ?? 0,
    }));

    for (const [slug, itemCount] of bySlug) {
        if (!(CATEGORY_ORDER as readonly string[]).includes(slug)) {
            ordered.push({ slug, label: CATEGORY_LABEL[slug] ?? slug, count: itemCount });
        }
    }

    return ordered;
}

export function getStaticCategoryPaths(db: DrizzleDb): { category: string }[] {
    return getCategories(db).map((c) => ({ category: c.slug }));
}

export function countAllItems(db: DrizzleDb): number {
    return db.select({ value: count() }).from(news_items).get()?.value ?? 0;
}

export function countItemsByCategory(db: DrizzleDb, category: string): number {
    return (
        db
            .select({ value: count() })
            .from(news_items)
            .where(eq(news_items.category, category))
            .get()?.value ?? 0
    );
}

export function getAllItems(db: DrizzleDb, opts: { limit: number; offset: number }): NewsItemRow[] {
    return db
        .select()
        .from(news_items)
        .orderBy(desc(sql`coalesce(${news_items.published_at}, ${news_items.fetched_at})`))
        .limit(opts.limit)
        .offset(opts.offset)
        .all();
}

export function getItemsByCategory(
    db: DrizzleDb,
    category: string,
    opts: { limit: number; offset: number },
): NewsItemRow[] {
    return db
        .select()
        .from(news_items)
        .where(eq(news_items.category, category))
        .orderBy(desc(sql`coalesce(${news_items.published_at}, ${news_items.fetched_at})`))
        .limit(opts.limit)
        .offset(opts.offset)
        .all();
}

export function isPublishedToday(publishedAt: Date | null | undefined, asOf = new Date()): boolean {
    if (!publishedAt) return false;
    return (
        publishedAt.getFullYear() === asOf.getFullYear() &&
        publishedAt.getMonth() === asOf.getMonth() &&
        publishedAt.getDate() === asOf.getDate()
    );
}

export function formatNewsDate(publishedAt: Date | null | undefined): string {
    if (!publishedAt) return 'Undated';
    return publishedAt.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Pages needed for a total count at PAGE_SIZE. */
export function pageCount(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / pageSize));
}

export function getHomePagePaths(db: DrizzleDb, pageSize: number): { page: string }[] {
    const total = countAllItems(db);
    const pages = pageCount(total, pageSize);
    // page/1 redirects conceptually to index - only emit 2..N
    return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export function getCategoryPagePaths(
    db: DrizzleDb,
    category: string,
    pageSize: number,
): { category: string; page: string }[] {
    const total = countItemsByCategory(db, category);
    const pages = pageCount(total, pageSize);
    return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
        category,
        page: String(i + 2),
    }));
}

export function categoryLabel(slug: string): string {
    return CATEGORY_LABEL[slug] ?? slug;
}
