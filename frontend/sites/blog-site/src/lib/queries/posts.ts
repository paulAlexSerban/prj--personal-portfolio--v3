import {
    content_tags,
    posts,
    questions,
    tags,
    type PostRow,
    type TagRow,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, count, eq, inArray } from 'drizzle-orm';

export type BlogContentType = 'post' | 'book-note' | 'snippet';

export const CONTENT_TYPE_LABEL: Record<BlogContentType, string> = {
    post: 'Post',
    snippet: 'Snippet',
    'book-note': 'Book note',
};

/** True when `date` is missing, unparseable, or on/before the calendar day of `asOf`. */
export function isPublishedOnOrBefore(date: string | null | undefined, asOf = new Date()): boolean {
    if (!date) return true;
    const published = new Date(date);
    if (Number.isNaN(published.getTime())) return true;
    const asOfDay = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
    const publishedDay = new Date(published.getFullYear(), published.getMonth(), published.getDate());
    return publishedDay.getTime() <= asOfDay.getTime();
}

function filterPublishedAsOfToday(rows: PostRow[]): PostRow[] {
    return rows.filter((row) => isPublishedOnOrBefore(row.date));
}

function sortByDateDesc(rows: PostRow[]): PostRow[] {
    return [...rows].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
}

/**
 * Subquery of post slugs that have at least one published quiz question
 * (questions link to a post via `questions.post_slug`, regardless of post type).
 * The blog only renders content that carries a quiz, so callers gate every
 * listing, detail, and tag query with `inArray(<slug column>, …)`.
 */
export function publishedQuestionPostSlugs(db: DrizzleDb) {
    return db
        .select({ slug: questions.post_slug })
        .from(questions)
        .where(eq(questions.status, 'published'));
}

export function getPublishedByType(db: DrizzleDb, type: BlogContentType): PostRow[] {
    const rows = db
        .select()
        .from(posts)
        .where(
            and(
                eq(posts.type, type),
                eq(posts.status, 'published'),
                // inArray(posts.slug, publishedQuestionPostSlugs(db)), # uncomment this line to filter by posts that have at least one published question
            ),
        )
        .all();
    return sortByDateDesc(filterPublishedAsOfToday(rows));
}

export function getPinnedByType(db: DrizzleDb, type: BlogContentType): PostRow[] {
    const rows = db
        .select()
        .from(posts)
        .where(
            and(
                eq(posts.type, type),
                eq(posts.status, 'published'),
                eq(posts.pinned, true),
                // inArray(posts.slug, publishedQuestionPostSlugs(db)), # uncomment this line to filter by posts that have at least one published question
            ),
        )
        .limit(6)
        .all();
    return sortByDateDesc(filterPublishedAsOfToday(rows));
}

export function getAllSlugs(db: DrizzleDb, type: BlogContentType): { slug: string }[] {
    return db
        .select({ slug: posts.slug, date: posts.date })
        .from(posts)
        .where(and(eq(posts.type, type)))
        // .where(and(eq(posts.type, type), inArray(posts.slug, publishedQuestionPostSlugs(db)))) # uncommend and use this line to filter by posts that have at least one published question
        .all()
        .filter((row) => isPublishedOnOrBefore(row.date))
        .map(({ slug }) => ({ slug }));
}

export function getPostBySlug(db: DrizzleDb, slug: string): PostRow | undefined {
    return db.select().from(posts).where(eq(posts.slug, slug)).get();
}

export function getPostBySlugAndType(
    db: DrizzleDb,
    slug: string,
    type: BlogContentType,
): PostRow | undefined {
    const post = getPostBySlug(db, slug);
    if (!post || post.type !== type || !isPublishedOnOrBefore(post.date)) return undefined;
    return post;
}

export function getPostStaticPaths(db: DrizzleDb, type: BlogContentType) {
    return getAllSlugs(db, type).map(({ slug }) => ({ params: { slug } }));
}

export function getTagsForPost(db: DrizzleDb, slug: string): TagRow[] {
    return db
        .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
        })
        .from(content_tags)
        .innerJoin(tags, eq(content_tags.tag_slug, tags.slug))
        .where(eq(content_tags.content_slug, slug))
        .all();
}

export function getQuestionCountForPost(db: DrizzleDb, slug: string): number {
    const result = db
        .select({ value: count() })
        .from(questions)
        .where(and(eq(questions.post_slug, slug), eq(questions.status, 'published')))
        .get();
    return result?.value ?? 0;
}

export function buildTagsMap(
    db: DrizzleDb,
    items: PostRow[],
): Map<string, TagRow[]> {
    const map = new Map<string, TagRow[]>();
    for (const item of items) {
        map.set(item.slug, getTagsForPost(db, item.slug));
    }
    return map;
}
