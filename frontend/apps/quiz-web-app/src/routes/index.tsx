import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedPostEntry } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { loadPostsIndex } from "@/data/loadQuizData";
import { useStudySetActions } from "@/hooks/useStudySetActions";
import { useStore } from "@/store";

export const Route = createFileRoute("/")({
  component: BrowsePage,
});

type SortBy = "title" | "questions";

function BrowsePage() {
  const addedPosts = useStore((s) => s.addedPosts);
  const { addToStudySet, removeFromStudySet, loadingSlug, error, clearError } =
    useStudySetActions();

  const [posts, setPosts] = useState<ExportedPostEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("title");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPostsIndex()
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load posts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addedSet = useMemo(() => new Set(addedPosts), [addedPosts]);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = posts;
    if (q) {
      filtered = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)),
      );
    }
    const sorted = [...filtered];
    if (sortBy === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => b.questionCount - a.questionCount);
    return sorted;
  }, [posts, search, sortBy]);

  return (
    <PageLayout>
      <section className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="smallcaps text-sm text-[var(--slate)]">Front Page · The Catalogue</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Browse Posts
          </h2>
          <p className="mt-2 text-base text-[var(--charcoal)] italic max-w-xl">
            Add a post to your study set — all of its flashcards join your deck without resetting
            prior progress.
          </p>
        </div>
        <Link to="/sets" className={stampClasses("ghost", "md")}>
          My Sets ({addedPosts.length})
        </Link>
      </section>

      <div className="flex flex-wrap items-center gap-4 mb-6 text-base">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, slug, or tag…"
          className="border-2 border-[var(--ink-black)] bg-transparent px-3 py-2 flex-1 min-w-[200px]"
        />
        <div className="flex items-center gap-3 text-sm smallcaps">
          <span className="text-[var(--slate)]">Sort:</span>
          {(["title", "questions"] as SortBy[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSortBy(s)}
              className={`underline-offset-4 ${sortBy === s ? "underline font-bold" : "hover:underline"}`}
            >
              {s === "title" ? "Title" : "Most Questions"}
            </button>
          ))}
        </div>
      </div>

      {(loadError || error) && (
        <div className="mb-6 border-2 border-[var(--ink-black)] bg-[var(--highlight)] p-4 text-base">
          {loadError ?? error}
          {error && (
            <button type="button" onClick={clearError} className="ml-3 underline smallcaps">
              Dismiss
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="italic text-[var(--slate)]">Loading catalogue…</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 border-y-[3px] border-[var(--ink-black)]">
          <p className="italic text-xl" style={{ fontFamily: "var(--font-display)" }}>
            No posts match your search.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {rows.map((post) => {
            const isAdded = addedSet.has(post.slug);
            const isLoading = loadingSlug === post.slug;
            return (
              <article key={post.slug} className="border-t-[3px] border-[var(--ink-black)] pt-4">
                <p className="smallcaps text-[10px] text-[var(--slate)] mb-1">
                  {post.type} · {post.questionCount} questions
                </p>
                {isAdded ? (
                  <Link
                    to="/sets/$postSlug"
                    params={{ postSlug: post.slug }}
                    className="hover:underline"
                  >
                    <h3
                      className="text-2xl font-bold leading-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {post.title}
                    </h3>
                  </Link>
                ) : (
                  <h3
                    className="text-2xl font-bold leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {post.title}
                  </h3>
                )}
                {post.excerpt && (
                  <p className="mt-2 text-base text-[var(--charcoal)] line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                {post.tags.length > 0 && (
                  <p className="mt-2 text-[10px] smallcaps text-[var(--slate)]">
                    {post.tags.slice(0, 4).join(" · ")}
                    {post.tags.length > 4 ? " …" : ""}
                  </p>
                )}
                <div className="rule-thin my-4" />
                <div className="flex gap-2">
                  {isAdded ? (
                    <>
                      <Link
                        to="/sets/$postSlug"
                        params={{ postSlug: post.slug }}
                        className={stampClasses("solid", "sm")}
                      >
                        Open Set
                      </Link>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => removeFromStudySet(post.slug)}
                        className={stampClasses("ghost", "sm")}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => addToStudySet(post.slug)}
                      className={stampClasses("solid", "sm")}
                    >
                      {isLoading ? "Loading…" : "Add to Study Set"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
