import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@/components/ui/Stamp";
import { loadAllQuestions } from "@/data/loadQuizData";
import { useStore } from "@/store";

export const Route = createFileRoute("/tags/")({
  component: TagsIndexPage,
});

function TagsIndexPage() {
  const addedPosts = useStore((s) => s.addedPosts);
  const [questions, setQuestions] = useState<ExportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAllQuestions()
      .then((qs) => {
        if (cancelled) return;
        const added = new Set(addedPosts);
        setQuestions(qs.filter((q) => added.has(q.postSlug)));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load tags");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addedPosts]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      for (const t of q.tags) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  if (addedPosts.length === 0 && !loading) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="italic text-[var(--charcoal)] mb-4">
            Add study sets to browse questions by tag.
          </p>
          <Link to="/" className={stampClasses("solid", "lg")}>
            Browse Posts
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <p className="smallcaps text-sm text-[var(--slate)]">Tags</p>
      <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        By Topic
      </h2>
      <p className="text-base italic text-[var(--charcoal)] mb-8">
        Tags from questions in your active study sets.
      </p>

      <div className="flex gap-3 mb-8">
        <Link to="/browse" className={stampClasses("ghost", "md")}>
          Question Browser
        </Link>
        <Link to="/sets" className={stampClasses("ghost", "md")}>
          My Sets
        </Link>
      </div>

      {loading ? (
        <p className="italic text-[var(--slate)]">Loading tags…</p>
      ) : error ? (
        <p className="text-base border-2 border-[var(--ink-black)] p-4">{error}</p>
      ) : tagCounts.length === 0 ? (
        <p className="italic text-[var(--slate)]">No tags found in your study sets.</p>
      ) : (
        <ul
          className="border-2 border-[var(--ink-black)] divide-y-2 divide-[var(--ink-black)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tagCounts.map(([slug, count]) => (
            <li key={slug}>
              <Link
                to="/tags/$tag"
                params={{ tag: slug }}
                className="flex items-center justify-between p-4 hover:bg-[var(--highlight)]"
              >
                <span className="font-bold">{slug}</span>
                <span className="smallcaps text-[10px] text-[var(--slate)]">
                  {count} question{count === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
