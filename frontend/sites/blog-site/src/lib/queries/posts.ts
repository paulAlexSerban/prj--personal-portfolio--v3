import {
    content_tags,
    posts,
    questions,
    tags,
    type PostRow,
    type TagRow,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, count, eq } from 'drizzle-orm';

export type BlogContentType = 'post' | 'book-note' | 'snippet';

function sortByDateDesc(rows: PostRow[]): PostRow[] {
    return [...rows].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
}

export function getPublishedByType(db: DrizzleDb, type: BlogContentType): PostRow[] {
    const rows = db
        .select()
        .from(posts)
        .where(and(eq(posts.type, type), eq(posts.status, 'published')))
        .all();
    return sortByDateDesc(rows);
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
            ),
        )
        .limit(6)
        .all();
    return sortByDateDesc(rows);
}

export function getAllSlugs(db: DrizzleDb, type: BlogContentType): { slug: string }[] {
    return db
        .select({ slug: posts.slug })
        .from(posts)
        .where(eq(posts.type, type))
        .all();
}

export function getPostBySlug(db: DrizzleDb, slug: string): PostRow | undefined {
    return db.select().from(posts).where(eq(posts.slug, slug)).get();
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
