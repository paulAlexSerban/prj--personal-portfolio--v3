import { describe, expect, it } from 'vitest';
import { parseResponsiveCover } from './responsiveCover';

describe('parseResponsiveCover', () => {
    it('returns null for empty values', () => {
        expect(parseResponsiveCover(null)).toBeNull();
        expect(parseResponsiveCover(undefined)).toBeNull();
        expect(parseResponsiveCover('')).toBeNull();
        expect(parseResponsiveCover('   ')).toBeNull();
    });

    it('returns null for absolute and local paths', () => {
        expect(parseResponsiveCover('https://cdn.example.com/x.png')).toBeNull();
        expect(parseResponsiveCover('/placeholder-cover.png')).toBeNull();
        expect(parseResponsiveCover('covers/my-post.png')).toBeNull();
    });

    it('parses imageName.hash', () => {
        expect(parseResponsiveCover('hero-banner.a3f91c2b')).toEqual({
            imageName: 'hero-banner',
            hash: 'a3f91c2b',
        });
    });

    it('parses images/ prefix and strips image extensions before the hash suffix', () => {
        expect(parseResponsiveCover('images/hero-banner.a3f91c2b.png')).toEqual({
            imageName: 'hero-banner',
            hash: 'a3f91c2b',
        });
    });

    it('normalizes hash casing', () => {
        expect(parseResponsiveCover('hero-banner.A3F91C2B')).toEqual({
            imageName: 'hero-banner',
            hash: 'a3f91c2b',
        });
    });
});
