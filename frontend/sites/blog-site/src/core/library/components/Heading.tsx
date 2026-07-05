import { createElement, type ReactNode } from 'react';

interface HeadingProps {
    level?: number;
    mainText?: string;
    subheadingText?: string;
    hasSeparator?: boolean;
    children?: ReactNode;
}

const Heading = ({ level = 2, mainText, subheadingText, hasSeparator, children }: HeadingProps) => {
    const headingLevel = Math.min(Math.max(level, 1), 6);
    const tag = `h${headingLevel}`;
    const className = hasSeparator ? 'mb-3 border-b border-dashed border-rule pb-[0.35em]' : undefined;

    if (subheadingText) {
        return createElement(
            tag,
            { className },
            createElement('span', null, children ?? mainText),
            createElement('span', { className: 'mt-1 block text-[0.85em] font-normal text-slate-ink' }, subheadingText)
        );
    }

    return createElement(tag, { className }, children ?? mainText);
};

export default Heading;
