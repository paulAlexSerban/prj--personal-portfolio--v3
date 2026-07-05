import { useEffect, useMemo, useState } from 'react';
import { Button } from '@prj--personal-portfolio--v3/shared--ui/button';
import { Input } from '@prj--personal-portfolio--v3/shared--ui/input';
import { cn } from '@prj--personal-portfolio--v3/shared--ui/utils';
import { filterByQuery, sortBlogPosts, type BlogPostFilterItem, type BlogSortBy } from '@prj--personal-portfolio--v3/shared--ui/post-filters';
import { clampPage, paginate, totalPages } from '@prj--personal-portfolio--v3/shared--ui/pagination';

import { PostCardReact } from '@/library/modules/PostCard/PostCardReact';

interface PostListIslandProps {
    posts: BlogPostFilterItem[];
}

const PAGE_SIZE = 12;

const SORT_LABELS: Record<BlogSortBy, string> = {
    title: 'Title',
    date: 'Newest',
};

const DEFAULT_SORT: BlogSortBy = 'date';
const SEARCH_DEBOUNCE_MS = 500;

interface UrlState {
    q: string;
    sort: BlogSortBy;
    page: number;
}

function readUrlState(): UrlState {
    if (typeof window === 'undefined') return { q: '', sort: DEFAULT_SORT, page: 1 };
    const params = new URLSearchParams(window.location.search);
    const sortParam = params.get('sort');
    const pageNum = Number(params.get('page'));
    return {
        q: params.get('q') ?? '',
        sort: sortParam === 'title' || sortParam === 'date' ? sortParam : DEFAULT_SORT,
        page: Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1,
    };
}

function writeUrlState({ q, sort, page }: UrlState): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const trimmed = q.trim();
    if (trimmed) url.searchParams.set('q', trimmed);
    else url.searchParams.delete('q');
    if (sort !== DEFAULT_SORT) url.searchParams.set('sort', sort);
    else url.searchParams.delete('sort');
    if (page > 1) url.searchParams.set('page', String(page));
    else url.searchParams.delete('page');
    window.history.replaceState({}, '', url);
}

export const PostListIsland = ({ posts }: PostListIslandProps) => {
    // `searchInput` is the live text box value; `query` is the debounced value
    // that actually filters; `urlQuery` is what is currently persisted in the URL
    // (only updated on Enter) and drives the "press Enter to save" hint.
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
    const [urlQuery, setUrlQuery] = useState('');
    const [sortBy, setSortBy] = useState<BlogSortBy>(DEFAULT_SORT);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const { q, sort, page: p } = readUrlState();
        setSearchInput(q);
        setQuery(q);
        setUrlQuery(q.trim());
        setSortBy(sort);
        if (p > 1) setPage(p);
    }, []);

    // Live filtering: debounce the text box into `query`. URL is left untouched
    // here — it is only written on Enter (and on sort/pagination actions).
    // Page reset happens in the typing handler so this doesn't clobber a page
    // restored from the URL on first load.
    useEffect(() => {
        const handle = setTimeout(() => setQuery(searchInput), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const onSearchInput = (value: string) => {
        setSearchInput(value);
        setPage(1);
    };

    const applySearch = () => {
        const next = searchInput.trim();
        setQuery(searchInput);
        setUrlQuery(next);
        setPage(1);
        writeUrlState({ q: searchInput, sort: sortBy, page: 1 });
    };

    const changeSort = (s: BlogSortBy) => {
        setSortBy(s);
        setPage(1);
        writeUrlState({ q: urlQuery, sort: s, page: 1 });
    };

    const goToPage = (p: number) => {
        setPage(p);
        writeUrlState({ q: urlQuery, sort: sortBy, page: p });
    };

    const rows = useMemo(() => {
        const filtered = filterByQuery(posts, query, (p) => [...p.tags.map((t) => t.name), ...p.tags.map((t) => t.slug)]);
        return sortBlogPosts(filtered, sortBy);
    }, [posts, query, sortBy]);

    const pages = totalPages(rows.length, PAGE_SIZE);
    const current = clampPage(page, pages);
    const pageItems = paginate(rows, current, PAGE_SIZE);

    const pendingSearch = searchInput.trim() !== urlQuery;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-start gap-4 text-base">
                <form
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        applySearch();
                    }}
                    className="min-w-[200px] flex-1"
                >
                    <Input
                        type="search"
                        value={searchInput}
                        onChange={(e) => onSearchInput(e.target.value)}
                        placeholder="Search title, slug, or tag…"
                        aria-label="Search posts"
                        aria-describedby="post-search-hint"
                        className="h-auto w-full rounded-none border-2 border-ink bg-transparent px-3 py-2 text-base shadow-none focus-visible:ring-0"
                    />
                    <p id="post-search-hint" aria-live="polite" className={cn('kicker mt-1 text-[10px]', pendingSearch ? 'font-bold text-ink' : 'text-slate-ink')}>
                        {pendingSearch ? 'Filtering live — press Enter to save this search to the URL' : 'Search is saved to the URL (share or reload to keep it)'}
                    </p>
                </form>
                <div className="kicker flex items-center gap-3 pt-2 text-[11px]">
                    <span className="text-slate-ink">Sort:</span>
                    {(['title', 'date'] as BlogSortBy[]).map((s) => (
                        <Button
                            key={s}
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => changeSort(s)}
                            title={s === 'title' ? 'Sort alphabetically by title' : 'Sort by newest first'}
                            className={cn(
                                'h-auto p-0 text-[11px] uppercase tracking-wide text-ink underline-offset-4',
                                sortBy === s ? 'font-bold underline' : 'no-underline hover:underline'
                            )}
                        >
                            {SORT_LABELS[s]}
                        </Button>
                    ))}
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="border-y-[3px] border-ink py-16 text-center">
                    <p className="font-display text-xl italic">No posts match your search.</p>
                </div>
            ) : (
                <>
                    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-5 p-0">
                        {pageItems.map((post) => (
                            <li key={post.slug}>
                                <PostCardReact post={post} />
                            </li>
                        ))}
                    </ul>

                    {pages > 1 && (
                        <div className="mt-8 flex items-center justify-between text-base">
                            <span className="kicker text-[10px] text-slate-ink">
                                Page {current} of {pages} · {rows.length} total
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={current <= 1}
                                    onClick={() => goToPage(current - 1)}
                                    title="Go to the previous page"
                                    className="rounded-none border-ink text-sm disabled:opacity-40"
                                >
                                    ← Prev
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={current >= pages}
                                    onClick={() => goToPage(current + 1)}
                                    title="Go to the next page"
                                    className="rounded-none border-ink text-sm disabled:opacity-40"
                                >
                                    Next →
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
