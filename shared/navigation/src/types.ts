export interface NavLink {
    label: string;
    href: string;
    active?: boolean;
}

export type SiteId = 'portfolio' | 'blog' | 'quiz' | 'news';

export interface SiteTab {
    id: SiteId;
    label: string;
    href: string;
}
