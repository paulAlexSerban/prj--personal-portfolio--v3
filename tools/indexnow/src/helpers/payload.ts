export type IndexNowPayload = {
    host: string;
    key: string;
    keyLocation: string;
    urlList: string[];
};

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export function siteHost(site: string): string {
    try {
        return new URL(site).hostname;
    } catch {
        throw new Error(`Invalid --site URL: ${site}`);
    }
}

export function keyLocationUrl(site: string, key: string): string {
    const origin = new URL(site).origin;
    return `${origin}/${key}.txt`;
}

export function buildPayload(opts: { site: string; key: string; urls: string[] }): IndexNowPayload {
    const host = siteHost(opts.site);
    const urlList = opts.urls.filter((url) => {
        try {
            return new URL(url).hostname === host;
        } catch {
            return false;
        }
    });

    if (urlList.length === 0) {
        throw new Error(`No URLs to submit for host ${host}`);
    }

    const mismatched = urlList.find((url) => new URL(url).hostname !== host);
    if (mismatched) {
        throw new Error(`urlList contains a different host: ${mismatched}`);
    }

    return {
        host,
        key: opts.key,
        keyLocation: keyLocationUrl(opts.site, opts.key),
        urlList,
    };
}

export function redactedPayload(payload: IndexNowPayload, redactFn: (text: string) => string): Record<string, unknown> {
    return {
        host: payload.host,
        key: redactFn(payload.key),
        keyLocation: redactFn(payload.keyLocation),
        urlList: payload.urlList,
        urlCount: payload.urlList.length,
    };
}
