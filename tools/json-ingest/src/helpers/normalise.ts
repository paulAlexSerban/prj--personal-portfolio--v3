import { ulid } from 'ulidx';
import type { NewExperienceRow, NewProfileRow, NewSkillRow, NewPageRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import type { ParsedFile } from './jsonParser.ts';

export type NormalisedRows = {
    profile: NewProfileRow[];
    skills: NewSkillRow[];
    pages: NewPageRow[];
    experience: NewExperienceRow[];
};

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);

const now = (): Date => new Date();

const serialisePageBody = (data: Record<string, unknown>): string => {
    const { title: _title, status: _status, slug: _slug, ...rest } = data;
    void _title;
    void _status;
    void _slug;
    return JSON.stringify(rest);
};

const serialiseTech = (raw: unknown): string | undefined => {
    if (!Array.isArray(raw)) return undefined;
    const tech = raw.filter((t) => typeof t === 'string' && t.trim() !== '');
    return tech.length > 0 ? JSON.stringify(tech) : undefined;
};

const normaliseProfile = (file: ParsedFile): NewProfileRow => {
    const d = file.data;
    return {
        id: ulid(),
        slug: 'profile',
        name: str(d['name'])!,
        headline: str(d['headline'])!,
        bio: str(d['bio'])!,
        photo_url: str(d['photo_url']),
        github_url: str(d['github_url']),
        linkedin_url: str(d['linkedin_url']),
        sync_source: 'json',
        locked: false,
        updated_at: now(),
    };
};

const normaliseSkill = (file: ParsedFile): NewSkillRow => {
    const d = file.data;
    return {
        id: ulid(),
        slug: file.slug,
        name: str(d['name'])!,
        category: str(d['category'])!,
        sort_order: typeof d['sort_order'] === 'number' ? d['sort_order'] : 0,
        proficiency: typeof d['proficiency'] === 'number' ? d['proficiency'] : 0,
        depth_note: str(d['depth_note']),
        sync_source: 'json',
        locked: false,
    };
};

const normaliseExperience = (file: ParsedFile): NewExperienceRow => {
    const d = file.data;
    return {
        id: ulid(),
        slug: file.slug,
        role: str(d['role'])!,
        company: str(d['company'])!,
        start_date: str(d['start_date'])!,
        end_date: str(d['end_date']),
        summary: str(d['summary']),
        tech: serialiseTech(d['tech']),
        location: str(d['location']),
        sort_order: typeof d['sort_order'] === 'number' ? d['sort_order'] : 0,
        status: str(d['status']) ?? 'draft',
        sync_source: 'json',
        locked: false,
        updated_at: now(),
    };
};

const normalisePage = (file: ParsedFile): NewPageRow => {
    const d = file.data;
    return {
        id: ulid(),
        slug: file.slug,
        title: str(d['title'])!,
        body: serialisePageBody(d),
        status: str(d['status']) ?? 'draft',
        sync_source: 'json',
        locked: false,
        updated_at: now(),
    };
};

export const normalise = (files: ParsedFile[]): NormalisedRows => {
    const rows: NormalisedRows = { profile: [], skills: [], pages: [], experience: [] };

    for (const file of files) {
        switch (file.contentType) {
            case 'profile':
                rows.profile.push(normaliseProfile(file));
                break;
            case 'skill':
                rows.skills.push(normaliseSkill(file));
                break;
            case 'page':
                rows.pages.push(normalisePage(file));
                break;
            case 'experience':
                rows.experience.push(normaliseExperience(file));
                break;
        }
    }

    console.log(`[normalise] profile=${rows.profile.length}  skills=${rows.skills.length}  pages=${rows.pages.length}  experience=${rows.experience.length}`);

    return rows;
};
