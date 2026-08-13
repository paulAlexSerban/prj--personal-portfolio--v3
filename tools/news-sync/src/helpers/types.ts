export type FeedConfig = {
    title: string;
    url: string;
};

export type CategoryFeedFile = {
    category: string;
    label: string;
    feeds: FeedConfig[];
};

export type CachedNewsItem = {
    slug: string;
    guid: string;
    title: string;
    link: string;
    source: string;
    sourceUrl: string;
    summary: string;
    publishedAt: string | null;
};

export type CategoryCacheFile = {
    category: string;
    label: string;
    fetchedAt: string;
    items: CachedNewsItem[];
};

export type NewsIndexCategory = {
    slug: string;
    label: string;
    count: number;
};

/** Discovery file the news-feed client loads first from the JSON CDN. */
export type NewsIndexFile = {
    fetchedAt: string;
    categories: NewsIndexCategory[];
};
