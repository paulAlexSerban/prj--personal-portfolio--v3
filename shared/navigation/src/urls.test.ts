import { describe, expect, it } from 'vitest';
import { buildSiteTabs, createSiteUrls, isNavLinkActive } from './urls.ts';

const production = {
    portfolio: 'https://paulserban.eu',
    blog: 'https://blog.paulserban.eu',
    quiz: 'https://quiz.paulserban.eu',
    news: 'https://news-feed.paulserban.eu',
};

describe('createSiteUrls', () => {
    it('derives sibling URLs on GitHub Pages', () => {
        const urls = createSiteUrls({
            appSegment: 'home',
            baseUrl: '/prj/home/',
            production,
        });

        expect(urls.blog).toBe('/prj/blog/');
        expect(urls.quiz).toBe('/prj/quiz/');
        expect(urls.news).toBe('/prj/news/');
        expect(urls.portfolio).toBe('/prj/home/');
    });

    it('falls back to production on localhost', () => {
        const urls = createSiteUrls({
            appSegment: 'home',
            baseUrl: '/',
            production,
        });

        expect(urls.portfolio).toBe('https://paulserban.eu/');
        expect(urls.blog).toBe('https://blog.paulserban.eu/');
        expect(urls.quiz).toBe('https://quiz.paulserban.eu/');
        expect(urls.news).toBe('https://news-feed.paulserban.eu/');
    });
});

describe('isNavLinkActive', () => {
    it('home route is exact-match only', () => {
        const base = '/prj/home/';

        expect(isNavLinkActive('/prj/home/', base, base)).toBe(true);
        expect(isNavLinkActive('/prj/home/portfolio/', base, base)).toBe(false);
    });
});

describe('buildSiteTabs', () => {
    it('returns all four site tabs with correct hrefs', () => {
        const tabs = buildSiteTabs({
            portfolio: '/home/',
            blog: '/blog/',
            quiz: '/quiz/',
            news: '/news/',
        });

        expect(tabs).toEqual([
            { id: 'portfolio', label: 'Portfolio', href: '/home/' },
            { id: 'blog', label: 'Blog', href: '/blog/' },
            { id: 'quiz', label: 'Quiz', href: '/quiz/' },
            { id: 'news', label: 'News', href: '/news/' },
        ]);
    });
});
