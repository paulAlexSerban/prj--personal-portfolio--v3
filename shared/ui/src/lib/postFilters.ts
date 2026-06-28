export interface BlogPostTag {
  name: string;
  slug: string;
}

export interface BlogPostFilterItem {
  title: string;
  slug: string;
  excerpt: string | null;
  date: string | null;
  tags: BlogPostTag[];
  type: "post" | "snippet" | "book-note";
}

export type BlogSortBy = "title" | "date";

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
    sorted.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }
  return sorted;
}
