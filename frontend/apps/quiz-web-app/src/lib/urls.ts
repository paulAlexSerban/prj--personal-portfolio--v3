import { createSiteUrls, externalLinkAttrs, isExternalUrl } from '@prj--personal-portfolio--v3/shared--navigation';

const base = import.meta.env.BASE_URL;

const crossApp = createSiteUrls({
    appSegment: 'quiz',
    baseUrl: base,
    production: {
        portfolio: 'https://paulserban.eu',
        blog: 'https://blog.paulserban.eu',
        quiz: 'https://quiz.paulserban.eu',
        news: 'https://news-feed.paulserban.eu',
    },
});

export const siteUrls = {
    portfolio: import.meta.env.VITE_PORTFOLIO_URL ?? crossApp.portfolio,
    blog: import.meta.env.VITE_BLOG_URL ?? crossApp.blog,
    news: import.meta.env.VITE_NEWS_URL ?? crossApp.news,
} as const;

/** Canonical GitHub repository for this platform. */
export const QUIZ_REPO_URL = 'https://github.com/paulAlexSerban/prj--personal-portfolio--v3';

/** Canonical blog detail URL for a post, snippet, or book note. */
export function blogPostUrl(postType: string, slug: string): string {
    const segment = postType === 'book-note' ? 'booknote' : postType;
    const base = siteUrls.blog.replace(/\/$/, '');
    return `${base}/${segment}/${slug}/`;
}

function blogDetailSegment(postType: string): string {
    return postType === 'book-note' ? 'booknote' : postType;
}

/** Canonical blog URL for a cheat sheet companion page. */
export function blogCheatSheetUrl(postType: string, postSlug: string, itemSlug: string): string {
    const base = siteUrls.blog.replace(/\/$/, '');
    return `${base}/${blogDetailSegment(postType)}/${postSlug}/cheat_sheet/${itemSlug}/`;
}

/** Canonical blog URL for a learning plan companion page. */
export function blogLearningPlanUrl(postType: string, postSlug: string, itemSlug: string): string {
    const base = siteUrls.blog.replace(/\/$/, '');
    return `${base}/${blogDetailSegment(postType)}/${postSlug}/learning_plans/${itemSlug}/`;
}

export { isExternalUrl, externalLinkAttrs };
