import { useEffect, useMemo, useState } from 'react';
import { filterByQuery, sortBlogPosts, type BlogPostFilterItem, type BlogSortBy } from '@prj--personal-portfolio--v3/shared--ui/post-filters';
import { clampPage, paginate, totalPages } from '@prj--personal-portfolio--v3/shared--ui/pagination';
import { PostCardReact } from './PostCardReact';

interface Props {
    posts: BlogPostFilterItem[];
}

const PAGE_SIZE = 12;

const SORT_LABELS: Record<BlogSortBy, string> = {
    title: 'Title',
    date: 'Newest',
};

function readPageFromUrl(): number {
    if (typeof window === 'undefined') return 1;
    const p = Number(new URLSearchParams(window.location.search).get('page'));
    return Number.isInteger(p) && p > 0 ? p : 1;
}

function writePageToUrl(page: number): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (page <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(page));
    window.history.replaceState({}, '', url);
}

export function PostListIsland({ posts }: Props) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<BlogSortBy>('date');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const p = readPageFromUrl();
        if (p > 1) setPage(p);
    }, []);

    const goToPage = (p: number) => {
        setPage(p);
        writePageToUrl(p);
    };

    const rows = useMemo(() => {
        const filtered = filterByQuery(posts, search, (p) => [...p.tags.map((t) => t.name), ...p.tags.map((t) => t.slug)]);
        return sortBlogPosts(filtered, sortBy);
    }, [posts, search, sortBy]);

    const pages = totalPages(rows.length, PAGE_SIZE);
    const current = clampPage(page, pages);
    const pageItems = paginate(rows, current, PAGE_SIZE);

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center gap-4 text-base">
                <input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        goToPage(1);
                    }}
                    placeholder="Search title, slug, or tag…"
                    aria-label="Search posts"
                    className="min-w-[200px] flex-1 border-2 border-ink bg-transparent px-3 py-2"
                />
                <div className="kicker flex items-center gap-3 text-[11px]">
                    <span className="text-slate-ink">Sort:</span>
                    {(['title', 'date'] as BlogSortBy[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => {
                                setSortBy(s);
                                goToPage(1);
                            }}
                            title={s === 'title' ? 'Sort alphabetically by title' : 'Sort by newest first'}
                            className={`underline-offset-4 ${sortBy === s ? 'font-bold underline' : 'hover:underline'}`}
                        >
                            {SORT_LABELS[s]}
                        </button>
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
                                <button
                                    type="button"
                                    disabled={current <= 1}
                                    onClick={() => goToPage(current - 1)}
                                    title="Go to the previous page"
                                    className="stamp stamp-ghost text-sm disabled:opacity-40"
                                >
                                    ← Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={current >= pages}
                                    onClick={() => goToPage(current + 1)}
                                    title="Go to the next page"
                                    className="stamp stamp-ghost text-sm disabled:opacity-40"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
