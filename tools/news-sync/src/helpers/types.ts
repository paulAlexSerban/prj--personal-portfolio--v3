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
