/** Detect whether source contains MDX-style JSX components. */
export function detectContentFormat(src: string): 'markdown' | 'mdx' {
    if (/<Callout\b|<Figure\b/i.test(src)) return 'mdx';
    return 'markdown';
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readAttr(attrs: string, name: string): string | undefined {
    const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
    return re.exec(attrs)?.[1];
}

/**
 * Transform a small allow-listed MDX component set into plain HTML before markdown
 * compilation. Unknown JSX is left as-is (the markdown compiler will escape or ignore it).
 */
export function preprocessMdx(src: string): string {
    let out = src;

    // <Callout type="tip">…</Callout>
    out = out.replace(/<Callout\s*([^>]*)>([\s\S]*?)<\/Callout>/gi, (_, attrs, body) => {
        const type = readAttr(attrs, 'type') ?? 'note';
        const safeType = type.replace(/[^a-z0-9-]/gi, '');
        return `<aside class="mdx-callout mdx-callout-${safeType}">${body.trim()}</aside>`;
    });

    // <Figure src="…" alt="…" caption="…" />  (attrs may contain slashes in paths)
    out = out.replace(/<Figure\s+([^>]+?)>\s*<\/Figure>|<Figure\s+([^>]+?)\s*\/>/gi, (_, blockAttrs, selfAttrs) => {
        const attrs = (blockAttrs ?? selfAttrs ?? '').trim();
        const src = readAttr(attrs, 'src');
        if (!src) return '';
        const alt = readAttr(attrs, 'alt') ?? '';
        const caption = readAttr(attrs, 'caption') ?? '';
        let html = `<figure class="mdx-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`;
        if (caption) html += `<figcaption>${caption}</figcaption>`;
        html += '</figure>';
        return html;
    });

    return out;
}
