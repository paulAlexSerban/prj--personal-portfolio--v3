import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectUrlsFromDist, extractLocs, filterUrlsForHost, isSitemapIndex } from './sitemap.ts';

const SITE = 'https://paulserban.eu';

const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://paulserban.eu/</loc></url>
  <url><loc>https://paulserban.eu/cv/</loc></url>
  <url><loc>https://paulserban.eu/portfolio/foo/</loc></url>
</urlset>
`;

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://paulserban.eu/sitemap-0.xml</loc></sitemap>
</sitemapindex>
`;

let distDir = '';

beforeEach(async () => {
    distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'indexnow-sitemap-'));
});

afterEach(async () => {
    if (distDir) {
        await fs.rm(distDir, { recursive: true, force: true });
    }
});

describe('extractLocs / isSitemapIndex', () => {
    it('extracts loc values from a urlset', () => {
        expect(extractLocs(urlset)).toEqual(['https://paulserban.eu/', 'https://paulserban.eu/cv/', 'https://paulserban.eu/portfolio/foo/']);
        expect(isSitemapIndex(urlset)).toBe(false);
    });

    it('detects a sitemap index', () => {
        expect(isSitemapIndex(indexXml)).toBe(true);
        expect(extractLocs(indexXml)).toEqual(['https://paulserban.eu/sitemap-0.xml']);
    });
});

describe('filterUrlsForHost', () => {
    it('keeps same-host http(s) page URLs and drops sitemaps, other hosts, and junk', () => {
        expect(
            filterUrlsForHost(
                [
                    'https://paulserban.eu/',
                    'https://paulserban.eu/cv/',
                    'https://paulserban.eu/sitemap-0.xml',
                    'https://blog.paulserban.eu/post/x/',
                    'ftp://paulserban.eu/nope',
                    'not-a-url',
                    'https://paulserban.eu/',
                ],
                SITE
            )
        ).toEqual(['https://paulserban.eu/', 'https://paulserban.eu/cv/']);
    });

    it('preserves trailing slashes from the sitemap', () => {
        expect(filterUrlsForHost(['https://paulserban.eu/cv/'], SITE)).toEqual(['https://paulserban.eu/cv/']);
    });
});

describe('collectUrlsFromDist', () => {
    it('follows sitemap-index.xml to sitemap-0.xml', async () => {
        await fs.writeFile(path.join(distDir, 'sitemap-index.xml'), indexXml);
        await fs.writeFile(path.join(distDir, 'sitemap-0.xml'), urlset);

        await expect(collectUrlsFromDist(distDir, SITE)).resolves.toEqual(['https://paulserban.eu/', 'https://paulserban.eu/cv/', 'https://paulserban.eu/portfolio/foo/']);
    });

    it('reads sitemap-0.xml when there is no index', async () => {
        await fs.writeFile(path.join(distDir, 'sitemap-0.xml'), urlset);
        await expect(collectUrlsFromDist(distDir, SITE)).resolves.toContain('https://paulserban.eu/cv/');
    });

    it('errors when no sitemap exists', async () => {
        await expect(collectUrlsFromDist(distDir, SITE)).rejects.toThrow('No sitemap found');
    });

    it('errors when the sitemap has no URLs for the host', async () => {
        await fs.writeFile(path.join(distDir, 'sitemap-0.xml'), `<?xml version="1.0"?><urlset><url><loc>https://blog.paulserban.eu/</loc></url></urlset>`);
        await expect(collectUrlsFromDist(distDir, SITE)).rejects.toThrow('contained no URLs');
    });

    it('errors when the index points at a missing child sitemap', async () => {
        await fs.writeFile(path.join(distDir, 'sitemap-index.xml'), indexXml);
        await expect(collectUrlsFromDist(distDir, SITE)).rejects.toThrow('missing file');
    });
});
