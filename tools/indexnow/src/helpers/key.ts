const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

export function validateKey(value: string | undefined): string {
    const key = value?.trim() ?? '';
    if (!key) {
        throw new Error('INDEX_NOW_API_KEY is required');
    }
    if (!KEY_PATTERN.test(key)) {
        throw new Error('INDEX_NOW_API_KEY must be 8-128 characters: A-Z, a-z, 0-9, or dashes');
    }
    return key;
}

export function redactKey(key: string): string {
    const tail = key.slice(-4);
    return `***${tail}`;
}

export function redact(text: string, key: string): string {
    return text.split(key).join(redactKey(key));
}
