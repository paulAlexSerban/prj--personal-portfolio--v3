import {
    assetUrl as sharedAssetUrl,
    createSiteUrls,
    externalLinkAttrs,
    isExternalUrl,
    isNavLinkActive as sharedIsNavLinkActive,
} from '@prj--personal-portfolio--v3/shared--navigation';

const base = import.meta.env.BASE_URL;

const crossApp = createSiteUrls({
    appSegment: 'news',
    baseUrl: base,
    production: {
        portfolio: 'https://paulserban.eu',
        blog: 'https://blog.paulserban.eu',
        quiz: 'https://quiz.paulserban.eu',
        news: 'https://news-feed.paulserban.eu',
    },
});

export const siteUrls = {
    home: base,
    category: (slug: string) => `${base}category/${slug}/`,
    categoryPage: (slug: string, page: number) =>
        page <= 1 ? `${base}category/${slug}/` : `${base}category/${slug}/page/${page}/`,
    homePage: (page: number) => (page <= 1 ? base : `${base}page/${page}/`),
    portfolio: import.meta.env.PUBLIC_PORTFOLIO_URL ?? crossApp.portfolio,
    blog: import.meta.env.PUBLIC_BLOG_URL ?? crossApp.blog,
    quiz: import.meta.env.PUBLIC_QUIZ_URL ?? crossApp.quiz,
} as const;

export const PAGE_SIZE = 24;

export const assetUrl = (path: string) => sharedAssetUrl(base, path);
export const isNavLinkActive = (pathname: string, href: string) => sharedIsNavLinkActive(pathname, href, base);
export { isExternalUrl, externalLinkAttrs };
