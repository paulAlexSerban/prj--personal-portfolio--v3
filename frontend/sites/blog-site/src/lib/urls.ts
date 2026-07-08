import {
    assetUrl as sharedAssetUrl,
    createSiteUrls,
    externalLinkAttrs,
    isExternalUrl,
    isNavLinkActive as sharedIsNavLinkActive,
} from '@prj--personal-portfolio--v3/shared--navigation';

import type { BlogContentType } from '@/lib/queries/posts.ts';

const base = import.meta.env.BASE_URL;

const crossApp = createSiteUrls({
    appSegment: 'blog',
    baseUrl: base,
    production: {
        portfolio: 'https://paulserban.eu',
        blog: 'https://blog.paulserban.eu',
        quiz: 'https://quiz.paulserban.eu',
    },
});

export const siteUrls = {
    home: base,
    post: `${base}post/`,
    postSlug: (slug: string) => `${base}post/${slug}/`,
    snippet: `${base}snippet/`,
    booknote: `${base}booknote/`,
    portfolio: import.meta.env.PUBLIC_PORTFOLIO_URL ?? crossApp.portfolio,
    quiz: import.meta.env.PUBLIC_QUIZ_URL ?? crossApp.quiz,
} as const;

const DETAIL_SEGMENT: Record<BlogContentType, string> = {
    post: 'post',
    snippet: 'snippet',
    'book-note': 'booknote',
};

export function postDetailPath(type: BlogContentType, slug: string): string {
    return `${base}${DETAIL_SEGMENT[type]}/${slug}/`;
}

export function tagPath(slug: string): string {
    return `${base}tags/${slug}/`;
}

/**
 * Resolve an internal link from MDX content to a path that respects BASE_URL.
 * Legacy content may prefix paths with `/blog/` (production subdomain convention).
 */
export function resolveInternalBlogHref(href: string): string {
    if (/^https?:\/\//.test(href)) return href;

    let path = href.startsWith('/') ? href : `/${href}`;
    if (path.startsWith('/blog/')) {
        path = path.slice('/blog'.length);
    }

    const basePath = base.replace(/\/$/, '');
    if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
        return path;
    }

    return `${basePath}${path}`;
}

export const assetUrl = (path: string) => sharedAssetUrl(base, path);
export const isNavLinkActive = (pathname: string, href: string) => sharedIsNavLinkActive(pathname, href, base);
export { isExternalUrl, externalLinkAttrs };
