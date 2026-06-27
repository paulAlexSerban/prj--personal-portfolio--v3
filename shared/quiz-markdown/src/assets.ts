/** Extract relative image paths from markdown `![](…)` and `<Figure src="…">`. */
export function extractRelativeImagePaths(src: string): string[] {
    const paths = new Set<string>();
    const mdRe = /!\[[^\]]*\]\((\.\/?[^)\s]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = mdRe.exec(src)) !== null) {
        paths.add(m[1]);
    }
    const figRe = /<Figure\s+[^>]*src\s*=\s*["'](\.\/?[^"']+)["']/gi;
    while ((m = figRe.exec(src)) !== null) {
        paths.add(m[1]);
    }
    return [...paths];
}

/** Rewrite relative image paths in source text (before compilation). */
export function rewriteImagePaths(src: string, rewrites: Map<string, string>): string {
    let out = src;
    for (const [from, to] of rewrites) {
        out = out.split(from).join(to);
    }
    return out;
}

/** Public URL path for a copied question asset. */
export function questionAssetUrl(questionSlug: string, fileName: string, base = '/data/assets/questions'): string {
    return `${base}/${questionSlug}/${fileName}`;
}
