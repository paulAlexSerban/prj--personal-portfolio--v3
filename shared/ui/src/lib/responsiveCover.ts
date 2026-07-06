const IMAGE_EXTENSION_REGEX = /\.(avif|webp|jpe?g|png|gif|svg)$/i;
const RESPONSIVE_HASH_SUFFIX_REGEX = /^(.+)\.([a-z0-9]{8})$/i;

export interface ResponsiveCoverRef {
    imageName: string;
    hash: string;
}

/**
 * Parse a cover frontmatter value into ImageResponsive props.
 * Expected format: `{imageName}.{8-char-hash}` with an optional `images/` prefix,
 * e.g. `images/hero-banner.a3f91c2b` or `hero-banner.a3f91c2b`.
 */
export function parseResponsiveCover(cover: string | null | undefined): ResponsiveCoverRef | null {
    const value = cover?.trim();
    if (!value) return null;
    if (/^https?:\/\//.test(value) || value.startsWith('/')) return null;

    const [pathPart] = value.split(/[?#]/);
    const withoutExtension = pathPart.replace(IMAGE_EXTENSION_REGEX, '');
    const match = withoutExtension.match(RESPONSIVE_HASH_SUFFIX_REGEX);
    if (!match) return null;

    const imageName = match[1]
        .replace(/^\/+/, '')
        .replace(/^images\//, '')
        .split('/')
        .filter(Boolean)
        .pop();
    const hash = match[2].toLowerCase();

    if (!imageName || hash.length !== 8) {
        return null;
    }

    return { imageName, hash };
}
