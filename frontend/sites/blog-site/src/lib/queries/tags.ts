import {
    content_tags,
    posts,
    tags,
    type PostRow,
    type TagRow,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, eq, inArray } from 'drizzle-orm';

import { publishedQuestionPostSlugs, isPublishedOnOrBefore, type BlogContentType } from './posts.ts';

const BLOG_CONTENT_TYPES: BlogContentType[] = ['post', 'book-note', 'snippet'];

export function getAllBlogTags(db: DrizzleDb): TagRow[] {
    return db
        .selectDistinct({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
        })
        .from(tags)
        .innerJoin(content_tags, eq(content_tags.tag_slug, tags.slug))
        .where(
            and(
                inArray(content_tags.content_type, BLOG_CONTENT_TYPES),
                // inArray(content_tags.content_slug, publishedQuestionPostSlugs(db)), # uncomment this line to filter by posts that have at least one published question
            ),
        )
        .all();
}

export function getPostsByTagAndType(
    db: DrizzleDb,
    tagSlug: string,
    type: BlogContentType,
): PostRow[] {
    const rows = db
        .select({
            id: posts.id,
            slug: posts.slug,
            type: posts.type,
            title: posts.title,
            body: posts.body,
            subheading: posts.subheading,
            excerpt: posts.excerpt,
            cover_image: posts.cover_image,
            author: posts.author,
            date: posts.date,
            pinned: posts.pinned,
            status: posts.status,
            sync_source: posts.sync_source,
            locked: posts.locked,
            published_at: posts.published_at,
            updated_at: posts.updated_at,
        })
        .from(content_tags)
        .innerJoin(posts, eq(content_tags.content_slug, posts.slug))
        .where(
            and(
                eq(content_tags.tag_slug, tagSlug),
                eq(content_tags.content_type, type),
                eq(posts.status, 'published'),
                // inArray(posts.slug, publishedQuestionPostSlugs(db)), # uncomment this line to filter by posts that have at least one published question
            ),
        )
        .limit(9)
        .all();

    return rows
        .filter((row) => isPublishedOnOrBefore(row.date))
        .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
}
