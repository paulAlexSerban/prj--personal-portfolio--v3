/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_CF_BEACON_TOKEN?: string;
    readonly PUBLIC_NEWS_DATA_URL?: string;
    readonly PUBLIC_PORTFOLIO_URL?: string;
    readonly PUBLIC_BLOG_URL?: string;
    readonly PUBLIC_QUIZ_URL?: string;
}
