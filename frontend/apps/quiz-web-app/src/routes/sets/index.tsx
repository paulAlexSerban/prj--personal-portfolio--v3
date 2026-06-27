import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedPostEntry } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@/components/ui/Stamp";
import { loadPostsIndex } from "@/data/loadQuizData";
import { useStore } from "@/store";
import type { QuizState } from "@/store";
import { getPostStats } from "@/store/selectors";

export const Route = createFileRoute("/sets/")({
  component: StudySetsPage,
});

function StudySetsPage() {
  const addedPosts = useStore((s) => s.addedPosts);
  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);

  const [posts, setPosts] = useState<ExportedPostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPostsIndex()
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load posts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const bySlug = new Map(posts.map((p) => [p.slug, p]));
    const statsState = { cardStates, ignored } as QuizState;
    return addedPosts
      .map((slug) => {
        const meta = bySlug.get(slug);
        const stats = getPostStats(statsState, slug);
        const due = stats.newCount + stats.learningCount + stats.reviewDueCount;
        return { slug, meta, stats, due };
      })
      .sort(
        (a, b) => b.due - a.due || (a.meta?.title ?? a.slug).localeCompare(b.meta?.title ?? b.slug),
      );
  }, [addedPosts, posts, cardStates, ignored]);

  const totalDue = rows.reduce((n, r) => n + r.due, 0);

  return (
    <PageLayout>
      <section className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="smallcaps text-xs text-[var(--slate)]">Front Page · My Collection</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Study Sets
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="border-2 border-[var(--ink-black)] px-3 py-1 text-center">
            <p className="text-[10px] smallcaps text-[var(--slate)]">Cards Awaiting</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)" }}>
              {totalDue}
            </p>
          </div>
          {totalDue > 0 && (
            <Link to="/study" className={stampClasses("solid", "md")}>
              Study All ({totalDue})
            </Link>
          )}
          <Link to="/" className={stampClasses("ghost", "md")}>
            Browse Posts
          </Link>
        </div>
      </section>

      {error && (
        <div className="mb-6 border-2 border-[var(--ink-black)] bg-[var(--highlight)] p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="italic text-[var(--slate)]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-24 border-y-[3px] border-[var(--ink-black)]">
          <p
            className="italic text-2xl max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your study shelf is empty. Browse posts and add your first set.
          </p>
          <div className="mt-6">
            <Link to="/" className={stampClasses("solid", "lg")}>
              Browse Posts
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
          {rows.map(({ slug, meta, stats, due }) => (
            <article key={slug} className="border-t-[3px] border-[var(--ink-black)] pt-4">
              <p className="smallcaps text-[10px] text-[var(--slate)] mb-1">
                Study Set · {meta?.questionCount ?? stats.total} questions
              </p>
              <Link to="/sets/$postSlug" params={{ postSlug: slug }} className="hover:underline">
                <h3
                  className="text-3xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {meta?.title ?? slug}
                </h3>
              </Link>
              <div className="rule-thin my-4" />
              <div
                className="grid grid-cols-4 gap-2 text-center"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">New</p>
                  <p className="text-xl font-bold">{stats.newCount}</p>
                </div>
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">Due</p>
                  <p className="text-xl font-bold">{stats.reviewDueCount + stats.learningCount}</p>
                </div>
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">Ignored</p>
                  <p className="text-xl font-bold">{stats.ignoredCount}</p>
                </div>
                <div>
                  <p className="text-[10px] smallcaps text-[var(--slate)]">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {due > 0 ? (
                  <Link
                    to="/sets/$postSlug/study"
                    params={{ postSlug: slug }}
                    className={stampClasses("solid", "sm")}
                  >
                    Study ({due})
                  </Link>
                ) : (
                  <Link
                    to="/sets/$postSlug"
                    params={{ postSlug: slug }}
                    className={stampClasses("solid", "sm")}
                  >
                    Browse
                  </Link>
                )}
                <Link
                  to="/sets/$postSlug"
                  params={{ postSlug: slug }}
                  className={stampClasses("ghost", "sm")}
                >
                  Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
