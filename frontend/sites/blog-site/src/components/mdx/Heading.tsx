import { createElement, type ReactNode } from 'react';

interface HeadingProps {
    level?: number;
    mainText?: string;
    subheadingText?: string;
    hasSeparator?: boolean;
    children?: ReactNode;
}

const Heading = ({
    level = 2,
    mainText,
    subheadingText,
    hasSeparator,
    children,
}: HeadingProps) => {
    const headingLevel = Math.min(Math.max(level, 1), 6);
    const tag = `h${headingLevel}`;
    const className = hasSeparator ? 'mdx-heading-separator' : undefined;

    if (subheadingText) {
        return createElement(
            tag,
            { className },
            createElement('span', null, children ?? mainText),
            createElement('span', { className: 'mdx-heading-sub' }, subheadingText),
        );
    }

    return createElement(tag, { className }, children ?? mainText);
};

export default Heading;
