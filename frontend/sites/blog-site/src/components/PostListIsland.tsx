import { useMemo, useState } from "react";
import {
  filterByQuery,
  sortBlogPosts,
  type BlogPostFilterItem,
  type BlogSortBy,
} from "@prj--personal-portfolio--v3/shared--ui/post-filters";
import { PostCardReact } from "./PostCardReact";

interface Props {
  posts: BlogPostFilterItem[];
}

const SORT_LABELS: Record<BlogSortBy, string> = {
  title: "Title",
  date: "Newest",
};

export function PostListIsland({ posts }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<BlogSortBy>("date");

  const rows = useMemo(() => {
    const filtered = filterByQuery(posts, search, (p) => [
      ...p.tags.map((t) => t.name),
      ...p.tags.map((t) => t.slug),
    ]);
    return sortBlogPosts(filtered, sortBy);
  }, [posts, search, sortBy]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-base">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, slug, or tag…"
          aria-label="Search posts"
          className="min-w-[200px] flex-1 border-2 border-ink bg-transparent px-3 py-2"
        />
        <div className="kicker flex items-center gap-3 text-[11px]">
          <span className="text-slate-ink">Sort:</span>
          {(["title", "date"] as BlogSortBy[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSortBy(s)}
              title={
                s === "title" ? "Sort alphabetically by title" : "Sort by newest first"
              }
              className={`underline-offset-4 ${
                sortBy === s ? "font-bold underline" : "hover:underline"
              }`}
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
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-5 p-0">
          {rows.map((post) => (
            <li key={post.slug}>
              <PostCardReact post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
