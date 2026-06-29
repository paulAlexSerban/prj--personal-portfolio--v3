import { profile, type ProfileRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { DrizzleDb } from '@prj--personal-portfolio--v3/shared--db';
import { eq } from 'drizzle-orm';

export function getProfile(db: DrizzleDb): ProfileRow | undefined {
    return db.select().from(profile).where(eq(profile.slug, 'profile')).get();
}
