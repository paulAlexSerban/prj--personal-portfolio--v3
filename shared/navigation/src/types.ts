export interface NavLink {
    label: string;
    href: string;
    active?: boolean;
}

export type SiteId = 'portfolio' | 'blog' | 'quiz';

export interface SiteTab {
    id: SiteId;
    label: string;
    href: string;
}
