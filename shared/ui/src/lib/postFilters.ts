import { format } from "date-fns";

export interface BlogPostTag {
  name: string;
  slug: string;
}

export interface BlogPostFilterItem {
  title: string;
  slug: string;
  excerpt: string | null;
  date: string | null;
  cover: string | null;
  tags: BlogPostTag[];
  type: "post" | "snippet" | "book-note";
}

export type BlogSortBy = "title" | "date";

export type QuizSortBy = "date" | "title" | "questions";

export interface QuizPostSortItem {
  title: string;
  date: string | null;
  questionCount: number;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function compareDateNewestFirst(a: string | null, b: string | null): number {
  const dateA = a ? new Date(a).getTime() : 0;
  const dateB = b ? new Date(b).getTime() : 0;
  return dateB - dateA;
}

/** Local calendar-day key `yyyy-MM-dd` (not UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a `yyyy-MM-dd` key into a local-midnight Date. Returns null if invalid. */
export function parseDateKey(key: string): Date | null {
  if (!DATE_KEY_RE.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Human label for a `yyyy-MM-dd` key (e.g. `Jul 12, 2026`). Falls back to the key. */
export function formatDateLabel(key: string): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return format(date, "MMM d, yyyy");
}

/**
 * Day-keys (`yyyy-MM-dd`) that have ≥1 post. Skips null/invalid dates.
 * Used to enable only those days in the calendar picker.
 */
export function getAvailableDateKeys(
  items: BlogPostFilterItem[],
): Set<string> {
  const keys = new Set<string>();
  for (const item of items) {
    if (!item.date) continue;
    const parsed = new Date(item.date);
    if (Number.isNaN(parsed.getTime())) continue;
    keys.add(toDateKey(parsed));
  }
  return keys;
}

/**
 * Filter items to those whose date falls within `[from, to]` (inclusive).
 * No-op when `from` is null. When `to` is null, treats as a single-day filter
 * (`to = from`). Undated items are excluded when a filter is active.
 */
export function filterByDateRange(
  items: BlogPostFilterItem[],
  from: string | null,
  to: string | null,
): BlogPostFilterItem[] {
  if (!from) return items;
  const end = to ?? from;
  return items.filter((item) => {
    if (!item.date) return false;
    const parsed = new Date(item.date);
    if (Number.isNaN(parsed.getTime())) return false;
    const key = toDateKey(parsed);
    return key >= from && key <= end;
  });
}

/**
 * Generic case-insensitive text filter over title, slug, and an app-provided
 * tag-string extractor. Shared by the quiz catalogue and the blog listings.
 *
 * Quiz: filterByQuery(posts, q, (p) => p.tags)            // tags: string[]
 * Blog: filterByQuery(posts, q, (p) => p.tags.map((t) => t.name))  // tags: BlogPostTag[]
 */
export function filterByQuery<T extends { title: string; slug: string }>(
  items: T[],
  query: string,
  getTagStrings: (item: T) => string[] = () => [],
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      getTagStrings(p).some((t) => t.toLowerCase().includes(q)),
  );
}

/** Sort blog listing items by title (A→Z) or date (newest first). Pure; does not mutate input. */
export function sortBlogPosts(
  items: BlogPostFilterItem[],
  sort: BlogSortBy,
): BlogPostFilterItem[] {
  const sorted = [...items];
  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => compareDateNewestFirst(a.date, b.date));
  }
  return sorted;
}

/** Sort quiz catalogue items by date (newest first), title (A→Z), or question count. Pure; does not mutate input. */
export function sortQuizPosts<T extends QuizPostSortItem>(
  items: T[],
  sort: QuizSortBy,
): T[] {
  const sorted = [...items];
  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "questions") {
    sorted.sort((a, b) => b.questionCount - a.questionCount);
  } else {
    sorted.sort((a, b) => compareDateNewestFirst(a.date, b.date));
  }
  return sorted;
}
