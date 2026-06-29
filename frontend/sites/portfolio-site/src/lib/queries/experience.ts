import { experience, type ExperienceRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { asc, eq } from 'drizzle-orm';

export function parseTech(techJson: string | null | undefined): string[] {
    if (!techJson) return [];
    try {
        const parsed = JSON.parse(techJson) as unknown;
        return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
    } catch {
        return [];
    }
}

export function getExperienceTimeline(db: DrizzleDb): ExperienceRow[] {
    return db
        .select()
        .from(experience)
        .where(eq(experience.status, 'published'))
        .orderBy(asc(experience.sort_order))
        .all();
}
