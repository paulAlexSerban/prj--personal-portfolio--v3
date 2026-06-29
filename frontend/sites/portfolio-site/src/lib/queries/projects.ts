import {
    content_tags,
    projects,
    tags,
    type ProjectRow,
    type TagRow,
} from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { and, asc, desc, eq } from 'drizzle-orm';

// Featured-first: pinned projects, then higher priority, then title.
function featuredFirst() {
    return [desc(projects.pinned), desc(projects.priority), asc(projects.title)] as const;
}

export function getFeaturedPreview(db: DrizzleDb, limit = 3): ProjectRow[] {
    return db
        .select()
        .from(projects)
        .where(eq(projects.status, 'published'))
        .orderBy(...featuredFirst())
        .limit(limit)
        .all();
}

export function getAllProjects(db: DrizzleDb): ProjectRow[] {
    return db
        .select()
        .from(projects)
        .where(eq(projects.status, 'published'))
        .orderBy(...featuredFirst())
        .all();
}

export function getProjectBySlug(db: DrizzleDb, slug: string): ProjectRow | undefined {
    return db.select().from(projects).where(eq(projects.slug, slug)).get();
}

export function getAllProjectSlugs(db: DrizzleDb): { slug: string }[] {
    return db
        .select({ slug: projects.slug })
        .from(projects)
        .where(eq(projects.status, 'published'))
        .all();
}

export function getTagsForProject(db: DrizzleDb, slug: string): TagRow[] {
    return db
        .select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(content_tags)
        .innerJoin(tags, eq(content_tags.tag_slug, tags.slug))
        .where(and(eq(content_tags.content_slug, slug), eq(content_tags.content_type, 'project')))
        .all();
}

export function buildProjectTagsMap(db: DrizzleDb, items: ProjectRow[]): Map<string, TagRow[]> {
    const map = new Map<string, TagRow[]>();
    for (const item of items) {
        map.set(item.slug, getTagsForProject(db, item.slug));
    }
    return map;
}
