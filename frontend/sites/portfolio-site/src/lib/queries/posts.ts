import { posts, type PostRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, eq } from 'drizzle-orm';

function sortByDateDesc(rows: PostRow[]): PostRow[] {
    return [...rows].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
}

// Recent published blog posts for the home page. Unlike the blog site, this is
// NOT gated on quiz questions — the portfolio surfaces writing regardless.
export function getRecentPosts(db: DrizzleDb, limit = 4): PostRow[] {
    const rows = db
        .select()
        .from(posts)
        .where(and(eq(posts.type, 'post'), eq(posts.status, 'published')))
        .all();
    return sortByDateDesc(rows).slice(0, limit);
}
