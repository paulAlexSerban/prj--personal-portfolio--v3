import { useEffect, useMemo, useState } from 'react';
import { Button } from '@prj--personal-portfolio--v3/shared--ui/button';
import { Calendar } from '@prj--personal-portfolio--v3/shared--ui/calendar';
import { Input } from '@prj--personal-portfolio--v3/shared--ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@prj--personal-portfolio--v3/shared--ui/popover';
import { cn } from '@prj--personal-portfolio--v3/shared--ui/utils';
import {
    filterByDateRange,
    filterByQuery,
    formatDateLabel,
    getAvailableDateKeys,
    parseDateKey,
    sortBlogPosts,
    toDateKey,
    type BlogPostFilterItem,
    type BlogSortBy,
} from '@prj--personal-portfolio--v3/shared--ui/post-filters';
import { clampPage, paginate, totalPages } from '@prj--personal-portfolio--v3/shared--ui/pagination';
import { PaginationBar } from '@prj--personal-portfolio--v3/shared--ui/pagination-bar';

import { PostCardReact } from '@/library/modules/PostCard/PostCardReact';

/** Shape accepted by Calendar `mode="range"` (mirrors react-day-picker without a direct dep). */
type DateRange = { from: Date | undefined; to?: Date | undefined };

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
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

interface UrlState {
    q: string;
    sort: BlogSortBy;
    page: number;
    from: string | null;
    to: string | null;
}

function parseDateParam(value: string | null): string | null {
    if (!value || !DATE_KEY_RE.test(value)) return null;
    return parseDateKey(value) ? value : null;
}

function readUrlState(): UrlState {
    if (typeof window === 'undefined') return { q: '', sort: DEFAULT_SORT, page: 1, from: null, to: null };
    const params = new URLSearchParams(window.location.search);
    const sortParam = params.get('sort');
    const pageNum = Number(params.get('page'));
    const from = parseDateParam(params.get('from'));
    let to = parseDateParam(params.get('to'));
    // If only `to` is present, or `to` is before `from`, drop the invalid half.
    if (!from) to = null;
    else if (to && to < from) to = null;
    return {
        q: params.get('q') ?? '',
        sort: sortParam === 'title' || sortParam === 'date' ? sortParam : DEFAULT_SORT,
        page: Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1,
        from,
        to,
    };
}

function writeUrlState({ q, sort, page, from, to }: UrlState): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const trimmed = q.trim();
    if (trimmed) url.searchParams.set('q', trimmed);
    else url.searchParams.delete('q');
    if (sort !== DEFAULT_SORT) url.searchParams.set('sort', sort);
    else url.searchParams.delete('sort');
    if (page > 1) url.searchParams.set('page', String(page));
    else url.searchParams.delete('page');
    if (from) {
        url.searchParams.set('from', from);
        // Omit `to` for a single-day selection (to === from or to unset).
        if (to && to !== from) url.searchParams.set('to', to);
        else url.searchParams.delete('to');
    } else {
        url.searchParams.delete('from');
        url.searchParams.delete('to');
    }
    window.history.replaceState({}, '', url);
}

function dateFilterLabel(from: string | null, to: string | null): string {
    if (!from) return 'Date';
    if (!to || to === from) return formatDateLabel(from);
    return `${formatDateLabel(from)} - ${formatDateLabel(to)}`;
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
    const [from, setFrom] = useState<string | null>(null);
    const [to, setTo] = useState<string | null>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);

    useEffect(() => {
        const { q, sort, page: p, from: f, to: t } = readUrlState();
        setSearchInput(q);
        setQuery(q);
        setUrlQuery(q.trim());
        setSortBy(sort);
        setFrom(f);
        setTo(t);
        if (p > 1) setPage(p);
    }, []);

    // Live filtering: debounce the text box into `query`. URL is left untouched
    // here - it is only written on Enter (and on sort/pagination actions).
    // Page reset happens in the typing handler so this doesn't clobber a page
    // restored from the URL on first load.
    useEffect(() => {
        const handle = setTimeout(() => setQuery(searchInput), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [searchInput]);

    const availableDateKeys = useMemo(() => getAvailableDateKeys(posts), [posts]);

    /** Bound dropdown years/months to the range that actually has posts. */
    const dateBounds = useMemo(() => {
        if (availableDateKeys.size === 0) return undefined;
        const sorted = [...availableDateKeys].sort();
        const earliest = parseDateKey(sorted[0]!);
        const latest = parseDateKey(sorted.at(-1)!);
        if (!earliest || !latest) return undefined;
        return {
            start: new Date(earliest.getFullYear(), 0, 1),
            end: new Date(latest.getFullYear(), 11, 1),
        };
    }, [availableDateKeys]);

    const onSearchInput = (value: string) => {
        setSearchInput(value);
        setPage(1);
    };

    const applySearch = () => {
        const next = searchInput.trim();
        setQuery(searchInput);
        setUrlQuery(next);
        setPage(1);
        writeUrlState({ q: searchInput, sort: sortBy, page: 1, from, to });
    };

    const changeSort = (s: BlogSortBy) => {
        setSortBy(s);
        setPage(1);
        writeUrlState({ q: urlQuery, sort: s, page: 1, from, to });
    };

    const goToPage = (p: number) => {
        setPage(p);
        writeUrlState({ q: urlQuery, sort: sortBy, page: p, from, to });
    };

    const applyDateRange = (nextFrom: string | null, nextTo: string | null) => {
        setFrom(nextFrom);
        setTo(nextTo);
        setPage(1);
        writeUrlState({ q: urlQuery, sort: sortBy, page: 1, from: nextFrom, to: nextTo });
    };

    const clearDateFilter = () => {
        applyDateRange(null, null);
        setCalendarOpen(false);
    };

    const onCalendarSelect = (range: DateRange | undefined) => {
        if (!range?.from) {
            applyDateRange(null, null);
            return;
        }
        const nextFrom = toDateKey(range.from);
        const nextTo = range.to ? toDateKey(range.to) : null;
        applyDateRange(nextFrom, nextTo);
        // Close once a complete range is chosen. With range mode, the first click
        // sets `from` only; keep open until `to` is set.
        if (range.to) setCalendarOpen(false);
    };

    const selectedRange: DateRange | undefined = useMemo(() => {
        if (!from) return undefined;
        const fromDate = parseDateKey(from);
        if (!fromDate) return undefined;
        const toDate = to ? parseDateKey(to) : fromDate;
        return { from: fromDate, to: toDate ?? fromDate };
    }, [from, to]);

    const defaultMonth = useMemo(() => {
        if (from) {
            const parsed = parseDateKey(from);
            if (parsed) return parsed;
        }
        if (availableDateKeys.size === 0) return undefined;
        const newest = [...availableDateKeys].sort().at(-1);
        return newest ? (parseDateKey(newest) ?? undefined) : undefined;
    }, [from, availableDateKeys]);

    const rows = useMemo(() => {
        const filtered = filterByQuery(posts, query, (p) => [...p.tags.map((t) => t.name), ...p.tags.map((t) => t.slug)]);
        const dated = filterByDateRange(filtered, from, to);
        return sortBlogPosts(dated, sortBy);
    }, [posts, query, sortBy, from, to]);

    const pages = totalPages(rows.length, PAGE_SIZE);
    const current = clampPage(page, pages);
    const pageItems = paginate(rows, current, PAGE_SIZE);

    const pendingSearch = searchInput.trim() !== urlQuery;
    const hasDateFilter = from !== null;

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
                    <p id="post-search-hint" aria-live="polite" className={cn('kicker mt-1 text-sm', pendingSearch ? 'font-bold text-ink' : 'text-slate-ink')}>
                        {pendingSearch ? 'Filtering live - press Enter to save this search to the URL' : 'Search is saved to the URL (share or reload to keep it)'}
                    </p>
                </form>
                <div className="kicker flex flex-wrap items-center gap-3 pt-2 text-[11px]">
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
                    <span className="text-slate-ink" aria-hidden="true">
                        |
                    </span>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                title="Filter by date or date range"
                                aria-label={hasDateFilter ? `Date filter: ${dateFilterLabel(from, to)}` : 'Filter by date'}
                                className={cn(
                                    'h-auto p-0 text-[11px] uppercase tracking-wide text-ink underline-offset-4',
                                    hasDateFilter ? 'font-bold underline' : 'no-underline hover:underline'
                                )}
                            >
                                {dateFilterLabel(from, to)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto rounded-none border-2 border-ink p-0">
                            <Calendar
                                mode="range"
                                selected={selectedRange}
                                onSelect={onCalendarSelect}
                                defaultMonth={defaultMonth}
                                captionLayout="dropdown"
                                startMonth={dateBounds?.start}
                                endMonth={dateBounds?.end}
                                disabled={(day) => !availableDateKeys.has(toDateKey(day))}
                                numberOfMonths={1}
                            />
                            {hasDateFilter && (
                                <div className="border-t-2 border-ink px-3 py-2">
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        onClick={clearDateFilter}
                                        className="h-auto p-0 text-[11px] uppercase tracking-wide text-ink underline-offset-4"
                                    >
                                        Clear date
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                    {hasDateFilter && (
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={clearDateFilter}
                            title="Clear date filter"
                            aria-label="Clear date filter"
                            className="h-auto p-0 text-[11px] uppercase tracking-wide text-slate-ink no-underline hover:underline"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="border-y-[3px] border-ink py-16 text-center">
                    <p className="font-display text-xl italic">No posts match your filters.</p>
                </div>
            ) : (
                <>
                    <ul className="post-list-grid">
                        {pageItems.map((post) => (
                            <li key={post.slug}>
                                <PostCardReact post={post} />
                            </li>
                        ))}
                    </ul>

                    {pages > 1 && (
                        <PaginationBar
                            page={current}
                            pages={pages}
                            total={rows.length}
                            onPageChange={goToPage}
                            className="mt-8 text-base"
                            labelClassName="kicker text-[10px] text-slate-ink"
                            renderPrev={({ disabled, onClick }) => (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={onClick}
                                    title="Go to the previous page"
                                    className="rounded-none border-ink text-sm disabled:opacity-40"
                                >
                                    ← Prev
                                </Button>
                            )}
                            renderNext={({ disabled, onClick }) => (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={onClick}
                                    title="Go to the next page"
                                    className="rounded-none border-ink text-sm disabled:opacity-40"
                                >
                                    Next &gt;
                                </Button>
                            )}
                        />
                    )}
                </>
            )}
        </div>
    );
};
