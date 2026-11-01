type SanitizeFn = (html: string) => string;

let impl: SanitizeFn | undefined;

/** Installed by the Node or browser package entry before any compile call. */
export function setSanitizer(fn: SanitizeFn): void {
    impl = fn;
}

/** Sanitize HTML with the shared quiz allow-list. */
export function sanitizeHtml(html: string): string {
    if (!impl) {
        throw new Error('sanitizeHtml was called before a markdown sanitizer was installed');
    }
    return impl(html);
}
