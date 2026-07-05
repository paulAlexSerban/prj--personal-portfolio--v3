import {
    assetUrl as sharedAssetUrl,
    createSiteUrls,
    externalLinkAttrs,
    isExternalUrl,
    isNavLinkActive as sharedIsNavLinkActive,
} from '@prj--personal-portfolio--v3/shared--navigation';

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

export const assetUrl = (path: string) => sharedAssetUrl(base, path);
export const isNavLinkActive = (pathname: string, href: string) => sharedIsNavLinkActive(pathname, href, base);
export { isExternalUrl, externalLinkAttrs };
