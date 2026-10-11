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

describe('compileContent - MDX components', () => {
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

describe('compileMarkdown - math + code (inherited behaviour)', () => {
    it('preserves inline math placeholder', () => {
        const html = compileMarkdown('Sum $\\sum_{i=1}^n i$');
        expect(html).toContain('math-inline');
        expect(html).toContain('\\sum_{i=1}^n i');
    });
});

describe('compileMarkdown - stable output', () => {
    it('reuses the compiler without changing HTML', () => {
        const cloze = 'The {{c1::answer}} is here';
        const revealed = '<p>The <b class="cloze-filled">answer</b> is here</p>';
        const hidden = '<p>The <span class="cloze-blank">[…]</span> is here</p>';
        expect(compileMarkdown(cloze)).toBe(revealed);
        expect(compileMarkdown(cloze)).toBe(revealed);
        expect(compileMarkdown(cloze, { reveal: false })).toBe(hidden);
        expect(compileMarkdown(cloze, { reveal: false })).toBe(hidden);

        const math = '<p>Sum <span class="math math-inline">\\sum_{i=1}^n i</span></p>';
        expect(compileMarkdown('Sum $\\sum_{i=1}^n i$')).toBe(math);
        expect(compileMarkdown('Sum $\\sum_{i=1}^n i$')).toBe(math);

        const code = '<pre><code class="language-js">const a = 1;\n</code></pre>';
        expect(compileMarkdown('```js\nconst a = 1;\n```')).toBe(code);

        expect(compileMarkdown('**bold** label', { inline: true })).toBe('<strong>bold</strong> label');
    });

    it('renders Callout and Figure to the same HTML on repeat calls', () => {
        const callout = '<aside class="mdx-callout mdx-callout-tip">Remember this.</aside>';
        expect(compileContent('<Callout type="tip">Remember this.</Callout>')).toBe(callout);
        expect(compileContent('<Callout type="tip">Remember this.</Callout>')).toBe(callout);

        const figure = '<figure class="mdx-figure"><img src="./images/chart.png" alt="Chart"><figcaption>Levels</figcaption></figure>';
        expect(compileContent('<Figure src="./images/chart.png" alt="Chart" caption="Levels" />')).toBe(figure);
        expect(compileContent('<Figure src="./images/chart.png" alt="Chart" caption="Levels" />')).toBe(figure);
    });
});

describe('sanitizeHtml - repeated calls', () => {
    it('returns the same HTML across repeated calls', async () => {
        const { sanitizeHtml } = await import('../index.ts');
        const hostile = '<p onclick="alert(1)">ok</p><script>alert(1)</script>';
        const first = sanitizeHtml(hostile);
        for (let i = 0; i < 500; i++) sanitizeHtml('<p>pad</p>');
        expect(sanitizeHtml(hostile)).toBe(first);
        expect(first.toLowerCase()).not.toContain('<script');
        expect(first).not.toContain('onclick');
    });
});

describe('compileContent - XSS', () => {
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
