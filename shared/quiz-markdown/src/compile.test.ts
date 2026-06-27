import { describe, it, expect } from 'vitest';
import { compileContent, compileMarkdown, detectContentFormat } from '../index.ts';

describe('detectContentFormat', () => {
    it('detects MDX when Callout is present', () => {
        expect(detectContentFormat('<Callout>tip</Callout>')).toBe('mdx');
    });

    it('returns markdown for plain text', () => {
        expect(detectContentFormat('## Hello\n\nPlain **markdown**.')).toBe('markdown');
    });
});

describe('compileContent — MDX components', () => {
    it('renders Callout to an aside with type class', () => {
        const html = compileContent('<Callout type="tip">Remember this.</Callout>');
        expect(html).toContain('mdx-callout');
        expect(html).toContain('mdx-callout-tip');
        expect(html).toContain('Remember this.');
    });

    it('renders Figure with caption', () => {
        const html = compileContent('<Figure src="./images/chart.png" alt="Chart" caption="Levels" />');
        expect(html).toContain('mdx-figure');
        expect(html).toContain('src="./images/chart.png"');
        expect(html).toContain('<figcaption>Levels</figcaption>');
    });

    it('compiles markdown inside MDX body with callout and image', () => {
        const src = `## Explanation

**b** is correct.

![DFS example](./images/dfs.png)

<Callout type="tip">Kahn fails on cycles.</Callout>`;
        const html = compileContent(src);
        expect(html).toContain('<h2');
        expect(html).toContain('<strong>b</strong>');
        expect(html).toContain('mdx-callout-tip');
        expect(html).toContain('./images/dfs.png');
    });
});

describe('compileMarkdown — math + code (inherited behaviour)', () => {
    it('preserves inline math placeholder', () => {
        const html = compileMarkdown('Sum $\\sum_{i=1}^n i$');
        expect(html).toContain('math-inline');
        expect(html).toContain('\\sum_{i=1}^n i');
    });
});

describe('compileContent — XSS', () => {
    it('strips script tags and event handlers from hostile payloads', () => {
        const hostile = `<script>alert('xss')</script>
<img src=x onerror=alert(1)>
<a href="javascript:alert(1)">click</a>
<p onclick="alert(1)">text</p>`;
        const html = compileContent(hostile);
        expect(html.toLowerCase()).not.toContain('<script');
        expect(html).not.toContain('onerror');
        expect(html).not.toContain('onclick');
        expect(html).not.toContain('javascript:');
    });
});
