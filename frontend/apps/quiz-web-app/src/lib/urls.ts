import { createSiteUrls, externalLinkAttrs, isExternalUrl } from '@prj--personal-portfolio--v3/shared--navigation';

const base = import.meta.env.BASE_URL;

const crossApp = createSiteUrls({
    appSegment: 'quiz',
    baseUrl: base,
    production: {
        portfolio: 'https://paulserban.eu',
        blog: 'https://blog.paulserban.eu',
        quiz: 'https://quiz.paulserban.eu',
    },
});

export const siteUrls = {
    portfolio: crossApp.portfolio,
    blog: crossApp.blog,
} as const;

export { isExternalUrl, externalLinkAttrs };
