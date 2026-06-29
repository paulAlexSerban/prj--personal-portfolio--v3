import { describe, expect, it } from 'vitest';
import { createSiteUrls, isNavLinkActive } from './urls.ts';

const production = {
    portfolio: 'https://paulserban.eu',
    blog: 'https://blog.paulserban.eu',
    quiz: 'https://quiz.paulserban.eu',
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
    });
});

describe('isNavLinkActive', () => {
    it('home route is exact-match only', () => {
        const base = '/prj/home/';

        expect(isNavLinkActive('/prj/home/', base, base)).toBe(true);
        expect(isNavLinkActive('/prj/home/portfolio/', base, base)).toBe(false);
    });
});
