import type { ReactNode } from 'react';

interface CalloutProps {
    type?: 'tip' | 'note' | 'warning' | string;
    children?: ReactNode;
}

const Callout = ({ type = 'note', children }: CalloutProps) => {
    const safeType = type.replace(/[^a-z0-9-]/gi, '');
    return <aside className={`mdx-callout mdx-callout-${safeType}`}>{children}</aside>;
};

export default Callout;