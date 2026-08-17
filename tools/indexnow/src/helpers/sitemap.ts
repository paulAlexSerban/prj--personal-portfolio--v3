import fs from 'node:fs/promises';
import path from 'node:path';

const LOC_RE = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;

export function extractLocs(xml: string): string[] {
    const locs: string[] = [];
    for (const match of xml.matchAll(LOC_RE)) {
        const loc = match[1]?.trim();
        if (loc) {
            locs.push(loc);
        }
    }
    return locs;
}

export function isSitemapIndex(xml: string): boolean {
    return /<sitemapindex[\s>]/i.test(xml);
}

export function isSitemapPath(url: string): boolean {
    try {
        const { pathname } = new URL(url);
        return /sitemap[^/]*\.xml$/i.test(pathname);
    } catch {
        return false;
    }
}

function hostnameOf(value: string): string | undefined {
    try {
        return new URL(value).hostname;
    } catch {
        return undefined;
    }
}

export function filterUrlsForHost(urls: string[], site: string): string[] {
    const host = hostnameOf(site);
    if (!host) {
        throw new Error(`Invalid --site URL: ${site}`);
    }

    const seen = new Set<string>();
    const filtered: string[] = [];

    for (const url of urls) {
        if (isSitemapPath(url)) {
            continue;
        }
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            continue;
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            continue;
        }
        if (parsed.hostname !== host) {
            continue;
        }
        if (seen.has(parsed.href)) {
            continue;
        }
        seen.add(parsed.href);
        filtered.push(parsed.href);
    }

    return filtered;
}

function sitemapBasename(loc: string): string {
    try {
        return path.basename(new URL(loc).pathname);
    } catch {
        return path.basename(loc);
    }
}

async function readIfExists(filePath: string): Promise<string | undefined> {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch {
        return undefined;
    }
}

async function collectFromXml(distDir: string, xml: string, visited: Set<string>): Promise<string[]> {
    const locs = extractLocs(xml);
    if (!isSitemapIndex(xml)) {
        return locs;
    }

    const nested: string[] = [];
    for (const loc of locs) {
        const localPath = path.join(distDir, sitemapBasename(loc));
        if (visited.has(localPath)) {
            continue;
        }
        visited.add(localPath);
        const child = await readIfExists(localPath);
        if (!child) {
            throw new Error(`Sitemap index points to missing file: ${localPath}`);
        }
        nested.push(...(await collectFromXml(distDir, child, visited)));
    }
    return nested;
}

export async function collectUrlsFromDist(distDir: string, site: string): Promise<string[]> {
    const candidates = ['sitemap-index.xml', 'sitemap-0.xml', 'sitemap.xml'];
    let xml: string | undefined;
    let used: string | undefined;

    for (const name of candidates) {
        const filePath = path.join(distDir, name);
        xml = await readIfExists(filePath);
        if (xml) {
            used = filePath;
            break;
        }
    }

    if (!xml || !used) {
        throw new Error(`No sitemap found in ${distDir} (looked for ${candidates.join(', ')})`);
    }

    const urls = await collectFromXml(distDir, xml, new Set([used]));
    const filtered = filterUrlsForHost(urls, site);
    if (filtered.length === 0) {
        throw new Error(`Sitemap in ${distDir} contained no URLs for ${site}`);
    }
    return filtered;
}
