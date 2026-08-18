import type { ProjectRow } from '@prj--personal-portfolio--v3/shared--db-schema';

export function formatAxisLabel(value: string): string {
    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
}

export function projectAxisBadge(project: Pick<ProjectRow, 'scope' | 'maturity'>): string {
    return `${formatAxisLabel(project.scope)} - ${formatAxisLabel(project.maturity)}`;
}
