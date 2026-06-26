import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type {
  ExportedPostEntry,
  ExportedQuestion,
} from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { Modal } from "@/components/ui/Modal";
import { Stamp, stampClasses } from "@/components/ui/Stamp";
import { loadPostQuestions, loadPostsIndex } from "@/data/loadQuizData";
import { useStudySetActions } from "@/hooks/useStudySetActions";
import { useStore } from "@/store";
import type { QuizState } from "@/store";
import { getPostStats } from "@/store/selectors";

export const Route = createFileRoute("/sets/$postSlug")({
  component: SetDetailPage,
});

function SetDetailPage() {
  const { postSlug } = Route.useParams();
  const nav = useNavigate();

  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);
  const addedPosts = useStore((s) => s.addedPosts);
  const resetPost = useStore((s) => s.resetPost);
  const ignoreQuestion = useStore((s) => s.ignoreQuestion);
  const unignoreQuestion = useStore((s) => s.unignoreQuestion);
  const { removeFromStudySet } = useStudySetActions();

  const [meta, setMeta] = useState<ExportedPostEntry | null>(null);
  const [questions, setQuestions] = useState<ExportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isAdded = addedPosts.includes(postSlug);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadPostsIndex(), loadPostQuestions(postSlug)])
      .then(([posts, qs]) => {
        if (cancelled) return;
        setMeta(posts.find((p) => p.slug === postSlug) ?? null);
        setQuestions(qs);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load set");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  const statsState = { cardStates, ignored } as QuizState;
  const stats = getPostStats(statsState, postSlug);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return questions;
    return questions.filter(
      (question) =>
        question.stem.toLowerCase().includes(q) ||
        question.slug.toLowerCase().includes(q) ||
        question.answerFormat.includes(q),
    );
  }, [questions, search]);

  if (!isAdded && !loading) {
    return (
      <PageLayout>
        <p className="italic mb-4">This post is not in your study set.</p>
        <Link to="/" className={stampClasses("solid", "md")}>
          Browse Posts
        </Link>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {loading ? (
        <p className="italic text-[var(--slate)]">Loading study set…</p>
      ) : error ? (
        <p className="text-sm border-2 border-[var(--ink-black)] p-4">{error}</p>
      ) : (
        <article>
          <p className="smallcaps text-xs text-[var(--slate)]">Study Set</p>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {meta?.title ?? postSlug}
          </h2>
          {meta?.excerpt && (
            <p className="mt-2 text-sm text-[var(--charcoal)] italic">{meta.excerpt}</p>
          )}

          <div className="rule mt-4 mb-6" />

          <div className="flex flex-wrap gap-3 mb-6">
            <Link to="/sets" className={stampClasses("ghost", "md")}>
              ← All Sets
            </Link>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className={stampClasses("ghost", "md")}
            >
              Reset Progress
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="stamp stamp-ghost text-sm ml-auto"
            >
              Remove from Set
            </button>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-5 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {[
              ["New", stats.newCount],
              ["Learning", stats.learningCount],
              ["Due", stats.reviewDueCount],
              ["Ignored", stats.ignoredCount],
              ["Total", stats.total],
            ].map(([label, n]) => (
              <div key={label} className="p-4 text-center">
                <p className="text-[10px] smallcaps text-[var(--slate)]">{label}</p>
                <p className="text-3xl font-bold">{n}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Questions
            </h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stem or slug…"
              className="border-2 border-[var(--ink-black)] bg-transparent px-2 py-1 text-sm flex-1 min-w-[180px]"
            />
          </div>

          <div className="border-2 border-[var(--ink-black)] overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              <thead className="border-b-2 border-[var(--ink-black)] bg-[var(--highlight)]">
                <tr>
                  <th className="p-2 text-left">Stem</th>
                  <th className="p-2 text-left w-28">Format</th>
                  <th className="p-2 text-left w-24">Type</th>
                  <th className="p-2 text-left w-24">Due</th>
                  <th className="p-2 text-left w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => {
                  const card = cardStates[q.slug];
                  const isIgnored = Boolean(ignored[q.slug]);
                  return (
                    <tr
                      key={q.slug}
                      className={`border-b border-[var(--column-rule)] ${isIgnored ? "opacity-50" : ""}`}
                    >
                      <td className="p-2 max-w-[320px]">
                        <span className="line-clamp-2">{stripHtml(q.stem)}</span>
                      </td>
                      <td className="p-2 smallcaps text-[10px]">{q.answerFormat}</td>
                      <td className="p-2">{card?.cardType ?? "—"}</td>
                      <td className="p-2">{card?.dueDate ?? "—"}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() =>
                            isIgnored ? unignoreQuestion(q.slug) : ignoreQuestion(q.slug)
                          }
                          className="smallcaps text-[10px] underline"
                        >
                          {isIgnored ? "Unignore" : "Ignore"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center italic text-[var(--slate)]">
                      No questions match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove from study set?"
      >
        <p className="text-sm mb-4">
          Removes <b>{meta?.title ?? postSlug}</b> from your active sets. Your card progress is kept
          if you add it again later.
        </p>
        <div className="flex gap-3">
          <Stamp
            onClick={() => {
              removeFromStudySet(postSlug);
              setConfirmRemove(false);
              nav({ to: "/sets" });
            }}
          >
            Remove
          </Stamp>
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            className="smallcaps underline text-sm"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset progress?">
        <p className="text-sm mb-4">
          Resets all SM-2 progress for questions in this set. Content stays in your library.
        </p>
        <div className="flex gap-3">
          <Stamp
            onClick={() => {
              resetPost(postSlug);
              setConfirmReset(false);
            }}
          >
            Reset Progress
          </Stamp>
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="smallcaps underline text-sm"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </PageLayout>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}
