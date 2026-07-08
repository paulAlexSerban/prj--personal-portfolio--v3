import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedPostEntry } from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import {
  filterByQuery,
  sortQuizPosts,
  type QuizSortBy,
} from "@prj--personal-portfolio--v3/shared--ui/post-filters";
import { loadPostsIndex } from "@/data/loadQuizData";
import { useStudySetActions } from "@/hooks/useStudySetActions";
import { useStore } from "@/store";
import { blogPostUrl } from "@/lib/urls";

export const Route = createFileRoute("/")({
  component: HomeView,
});

const SORT_LABELS: Record<QuizSortBy, string> = {
  date: "Newest",
  title: "Title",
  questions: "Most Questions",
};

const SORT_TITLES: Record<QuizSortBy, string> = {
  date: "Sort by newest blog post first",
  title: "Sort posts alphabetically by title",
  questions: "Sort posts by number of questions",
};

function HomeView() {
  const addedPosts = useStore((s) => s.addedPosts);
  const { addToStudySet, removeFromStudySet, loadingSlug, error, clearError } =
    useStudySetActions();

  const [posts, setPosts] = useState<ExportedPostEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<QuizSortBy>("date");

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
    const filtered = filterByQuery(posts, search, (p) => p.tags);
    return sortQuizPosts(filtered, sortBy);
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
        <Link to="/sets" className={stampClasses("ghost", "md")} title="Go to your study sets">
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
          {(["date", "title", "questions"] as QuizSortBy[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSortBy(s)}
              title={SORT_TITLES[s]}
              className={`underline-offset-4 ${sortBy === s ? "underline font-bold" : "hover:underline"}`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {(loadError || error) && (
        <div className="mb-6 border-2 border-[var(--ink-black)] bg-[var(--highlight)] p-4 text-base">
          {loadError ?? error}
          {error && (
            <button
              type="button"
              onClick={clearError}
              title="Dismiss this error message"
              className="ml-3 underline smallcaps"
            >
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
            const blogHref = post ? blogPostUrl(post.type, post.slug) : undefined;
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
                  <p className="mt-2 text-xs smallcaps text-[var(--slate)]">
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
                        title={`Open the ${post.title} study set`}
                      >
                        Open Set
                      </Link>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => removeFromStudySet(post.slug)}
                        title={`Remove ${post.title} from your study sets`}
                        className={stampClasses("ghost", "sm")}
                      >
                        Remove
                      </button>
                      {blogHref && (
                        <a
                          href={blogHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={stampClasses("ghost", "sm")}
                          title={`View the ${post.title} blog post`}
                        >
                          View Post
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => addToStudySet(post.slug)}
                        title={`Add ${post.title} to your study sets`}
                        className={stampClasses("solid", "sm")}
                      >
                        {isLoading ? "Loading…" : "Add to Study Set"}
                      </button>
                      {blogHref && (
                        <a
                          href={blogHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={stampClasses("ghost", "sm")}
                          title={`View the ${post.title} blog post`}
                        >
                          View Post
                        </a>
                      )}
                    </>
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
