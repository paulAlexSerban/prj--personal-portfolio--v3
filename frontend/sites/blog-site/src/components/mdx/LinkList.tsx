interface LinkItem {
    label: string;
    href: string;
    isInternal?: boolean;
    isEncoded?: boolean;
}

interface LinkListProps {
    links?: LinkItem[];
}

const normalizeBlogHref = (href: string, isInternal?: boolean): string => {
    if (isInternal) {
        return href.replace(/^\/blog\//, '/');
    }
    return href;
};

const LinkList = ({ links = [] }: LinkListProps) => {
    if (!Array.isArray(links)) {
        return null;
    }

    return (
        <ul className="mdx-link-list">
            {links.map((link, index) => {
                const href = normalizeBlogHref(link.href, link.isInternal);
                const external = link.isInternal === false || /^https?:\/\//.test(href);
                return (
                    <li key={link.label || index}>
                        <a
                            href={href}
                            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                            {link.label}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
};

export default LinkList;
