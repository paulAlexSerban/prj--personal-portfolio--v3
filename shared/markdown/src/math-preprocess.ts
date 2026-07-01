/**
 * Normalize math delimiters before remark-parse.
 * Ensures single-line `$$…$$` blocks are treated as display math, and skips fenced code.
 */
export function preprocessMath(src: string): string {
    const fences: string[] = [];
    const protectedSrc = src.replace(/```[\s\S]*?```/g, (match) => {
        fences.push(match);
        return `\x00FENCE${fences.length - 1}\x00`;
    });

    let out = protectedSrc.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => `\n$$\n${inner.trim()}\n$$\n`);

    out = out.replace(/\x00FENCE(\d+)\x00/g, (_, index) => fences[Number(index)] ?? '');
    return out;
}
