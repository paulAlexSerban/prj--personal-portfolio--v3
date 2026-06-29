import { skills, type SkillRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { asc } from 'drizzle-orm';

export interface SkillGroup {
    category: string;
    skills: SkillRow[];
}

export function getSkillsGrouped(db: DrizzleDb): SkillGroup[] {
    const rows = db
        .select()
        .from(skills)
        .orderBy(asc(skills.category), asc(skills.sort_order), asc(skills.name))
        .all();

    const grouped = new Map<string, SkillRow[]>();
    for (const row of rows) {
        const list = grouped.get(row.category) ?? [];
        list.push(row);
        grouped.set(row.category, list);
    }

    return [...grouped.entries()].map(([category, items]) => ({ category, skills: items }));
}
