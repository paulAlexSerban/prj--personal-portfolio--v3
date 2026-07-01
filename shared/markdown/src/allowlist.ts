export const ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'b', 'strong', 'i', 'em', 'u', 'del', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'aside', 'figure', 'figcaption',  // MDX component placeholders
] as const;

export const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'] as const;
