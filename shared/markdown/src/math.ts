import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Remark plugin: convert remark-math nodes into HTML placeholders for client-side KaTeX.
 * Emits `.math.math-inline` / `.math.math-block` nodes matching `shared/ui` richText enhancer.
 */
export const remarkMathPlaceholder: Plugin<[], Root> = () => (tree) => {
    visit(tree, (node, index, parent) => {
        if (index === undefined || parent === undefined || !('children' in parent)) return;

        if (node.type === 'inlineMath') {
            const html = `<span class="math math-inline">${escapeHtml(node.value)}</span>`;
            parent.children.splice(index, 1, { type: 'html', value: html });
            return index;
        }

        if (node.type === 'math') {
            const html = `<div class="math math-block">${escapeHtml(node.value)}</div>`;
            parent.children.splice(index, 1, { type: 'html', value: html });
            return index;
        }
    });
};
