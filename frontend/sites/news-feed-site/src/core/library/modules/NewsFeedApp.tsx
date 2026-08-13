import { useEffect, useMemo, useState } from 'react';

import { NewsCard } from '@/library/modules/NewsCard.tsx';
import { NewsPagination } from '@/library/modules/NewsPagination.tsx';
import { itemsForCategory, loadNewsBundle, type NewsIndexCategory, type NewsItem } from '@/lib/loadNews.ts';
import { categoryLabel, pageCount } from '@/lib/queries/news.ts';
import { PAGE_SIZE, siteUrls } from '@/lib/urls.ts';

function pageFromSearch(): number {
    if (typeof window === 'undefined') return 1;
    const raw = Number(new URLSearchParams(window.location.search).get('page') ?? '1');
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

function writePageToUrl(nextPage: number): void {
    const url = new URL(window.location.href);
    if (nextPage <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(nextPage));
    window.history.pushState({}, '', url);
}

interface Props {
    category?: string;
}

export function NewsFeedApp({ category }: Props) {
    const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
    const [categories, setCategories] = useState<NewsIndexCategory[]>([]);
    const [items, setItems] = useState<NewsItem[]>([]);
    const [fetchedAt, setFetchedAt] = useState<string | null>(null);
    const [page, setPage] = useState(pageFromSearch);

    useEffect(() => {
        let cancelled = false;
        loadNewsBundle()
            .then((bundle) => {
                if (cancelled) return;
                setCategories(bundle.index.categories);
                setFetchedAt(bundle.index.fetchedAt);
                setItems(itemsForCategory(bundle, category));
                setStatus('ready');
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                console.error('[news-feed] failed to load JSON', err);
                setStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, [category]);

    useEffect(() => {
        setPage(pageFromSearch());
        const onPopState = () => setPage(pageFromSearch());
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [category]);

    const pages = pageCount(items.length, PAGE_SIZE);
    const currentPage = Math.min(page, pages);

    const pageItems = useMemo(() => {
        const offset = (currentPage - 1) * PAGE_SIZE;
        return items.slice(offset, offset + PAGE_SIZE);
    }, [items, currentPage]);

    const handlePageChange = (nextPage: number) => {
        writePageToUrl(nextPage);
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const label = category ? categoryLabel(category) : null;
    const showCategoryOnCards = !category;

    return (
        <section className="mb-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-ink pb-2">
                <div>
                    <p className="kicker text-sm">{category ? 'Category' : 'Latest'}</p>
                    {category && <h2 className="m-0 font-display text-4xl font-bold">{label}</h2>}
                    {!category && (
                        <p className="deck mt-2 text-sm">
                            A personal RSS digest I maintain so I can skim what is new. Cards link to the original publishers — this is not a news outlet, and I do not host or
                            author these articles.
                            {fetchedAt && (
                                <>
                                    {' '}
                                    Last sync{' '}
                                    {new Date(fetchedAt).toLocaleString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                    .
                                </>
                            )}
                        </p>
                    )}
                </div>
                {category && (
                    <a className="stamp stamp-ghost px-3 py-1.5 text-sm no-underline" href={siteUrls.home}>
                        All latest
                    </a>
                )}
            </div>

            {categories.length > 0 && (
                <ul className="mb-8 m-0 flex list-none flex-wrap gap-2 p-0">
                    {categories.map((c) => (
                        <li key={c.slug}>
                            <a
                                className={c.slug === category ? 'stamp px-3 py-1.5 text-sm no-underline' : 'stamp stamp-ghost px-3 py-1.5 text-sm no-underline'}
                                href={siteUrls.category(c.slug)}
                                aria-current={c.slug === category ? 'page' : undefined}
                            >
                                {c.label}
                                <span className="ml-1 opacity-60">({c.count})</span>
                            </a>
                        </li>
                    ))}
                </ul>
            )}

            {status === 'loading' && <p className="deck">Loading headlines…</p>}
            {status === 'error' && <p className="deck">Could not load the news feed. Check your connection and try again.</p>}
            {status === 'ready' && pageItems.length === 0 && (
                <p className="deck">{category ? 'No articles in this category yet.' : 'No articles yet. The daily news sync has not populated the feed cache.'}</p>
            )}
            {status === 'ready' && pageItems.length > 0 && (
                <ul className="m-0 list-none columns-1 gap-5 p-0 sm:columns-2 lg:columns-3">
                    {pageItems.map((item) => (
                        <li key={`${item.category}-${item.slug}`} className="mb-5 break-inside-avoid">
                            <NewsCard item={item} showCategory={showCategoryOnCards} />
                        </li>
                    ))}
                </ul>
            )}

            {status === 'ready' && (
                <div className="mt-10 border-t border-rule pt-4">
                    <NewsPagination page={currentPage} pages={pages} total={items.length} onPageChange={handlePageChange} />
                </div>
            )}
        </section>
    );
}
