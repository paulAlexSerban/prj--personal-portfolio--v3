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

export function categoryLabel(slug: string): string {
    return CATEGORY_LABEL[slug] ?? slug;
}

export function parseNewsDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function isPublishedToday(publishedAt: string | null | undefined, asOf = new Date()): boolean {
    const date = parseNewsDate(publishedAt);
    if (!date) return false;
    return date.getFullYear() === asOf.getFullYear() && date.getMonth() === asOf.getMonth() && date.getDate() === asOf.getDate();
}

export function formatNewsDate(publishedAt: string | null | undefined): string {
    const date = parseNewsDate(publishedAt);
    if (!date) return 'Undated';
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Pages needed for a total count at PAGE_SIZE. */
export function pageCount(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / pageSize));
}
