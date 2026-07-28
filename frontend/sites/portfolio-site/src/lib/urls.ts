import {
    assetUrl as sharedAssetUrl,
    createSiteUrls,
    externalLinkAttrs,
    isExternalUrl,
    isNavLinkActive as sharedIsNavLinkActive,
} from '@prj--personal-portfolio--v3/shared--navigation';

const base = import.meta.env.BASE_URL;

const crossApp = createSiteUrls({
    appSegment: 'home',
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
    experience: `${base}#experience`,
    portfolio: `${base}portfolio/`,
    portfolioProject: (slug: string) => `${base}portfolio/${slug}/`,
    cv: `${base}cv/`,
    blog: import.meta.env.PUBLIC_BLOG_URL ?? crossApp.blog,
    blogPost: (slug: string) => `${(import.meta.env.PUBLIC_BLOG_URL ?? crossApp.blog).replace(/\/?$/, '/')}post/${slug}/`,
    quiz: import.meta.env.PUBLIC_QUIZ_URL ?? crossApp.quiz,
    news: import.meta.env.PUBLIC_NEWS_URL ?? crossApp.news,
} as const;

export const assetUrl = (path: string) => sharedAssetUrl(base, path);
export const isNavLinkActive = (pathname: string, href: string) => sharedIsNavLinkActive(pathname, href, base);
export { isExternalUrl, externalLinkAttrs };
