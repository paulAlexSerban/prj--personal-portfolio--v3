import type { ReactNode } from 'react';

import { resolveInternalBlogHref } from '../../../lib/urls.ts';

interface LinkProps {
    href?: string;
    children?: ReactNode;
    isInternal?: boolean;
    isEncoded?: boolean;
    ariaLabel?: string;
    className?: string;
    classNames?: string;
}

const normalizeBlogHref = (href: string, isInternal?: boolean): string => {
    if (isInternal === false || /^https?:\/\//.test(href)) return href;
    if (!href.startsWith('/')) return href;
    return resolveInternalBlogHref(href);
};

const Link = ({ href = '#', children, isInternal, ariaLabel, className, classNames }: LinkProps) => {
    const normalized = normalizeBlogHref(href, isInternal);
    const external = isInternal === false || /^https?:\/\//.test(normalized);

    return (
        <a href={normalized} aria-label={ariaLabel} className={className ?? classNames} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {children}
        </a>
    );
};

export default Link;
