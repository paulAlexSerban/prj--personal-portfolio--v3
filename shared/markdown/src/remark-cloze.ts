import type { Parent, Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

export interface RemarkClozeOptions {
    reveal?: boolean;
}

const CLOZE_RE = /\{\{c\d+::([^}]+)\}\}/g;

/**
 * Remark plugin: transform cloze markers in text nodes into raw HTML placeholders.
 * Runs before remark-rehype so placeholders survive as html nodes when allowDangerousHtml is true.
 */
export const remarkCloze: Plugin<[RemarkClozeOptions?], Root> = (options = {}) => {
    const reveal = options.reveal ?? true;

    return (tree) => {
        visit(tree, 'text', (node: Text, index, parent: Parent | undefined) => {
            if (index === undefined || parent === undefined) return;

            const value = node.value;
            if (!CLOZE_RE.test(value)) return;
            CLOZE_RE.lastIndex = 0;

            const replacements: Array<Text | { type: 'html'; value: string }> = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = CLOZE_RE.exec(value)) !== null) {
                if (match.index > lastIndex) {
                    replacements.push({ type: 'text', value: value.slice(lastIndex, match.index) });
                }
                const inner = match[1];
                const html = reveal ? `<b class="cloze-filled">${inner}</b>` : `<span class="cloze-blank">[…]</span>`;
                replacements.push({ type: 'html', value: html });
                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < value.length) {
                replacements.push({ type: 'text', value: value.slice(lastIndex) });
            }

            parent.children.splice(index, 1, ...replacements);
        });
    };
};
