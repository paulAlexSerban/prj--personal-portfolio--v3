import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { QuestionPreviewDrawer } from "@/components/question/QuestionPreviewDrawer";
import { stampClasses } from "@/components/ui/Stamp";
import { loadTagQuestions, loadTagsIndex } from "@/data/loadQuizData";
import { getCardStateLabel, stripMarkdownPreview } from "@/lib/questionFilters";
import { useStore } from "@/store";
import { todayISO } from "@/utils/dates";

export const Route = createFileRoute("/tags/$tag/")({
  component: TagDetailPage,
});

function TagDetailPage() {
  const { tag } = Route.useParams();
  const addedPosts = useStore((s) => s.addedPosts);
  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);

  const [questions, setQuestions] = useState<ExportedQuestion[]>([]);
  const [tagMeta, setTagMeta] = useState<{ questionCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExportedQuestion | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadTagQuestions(tag), loadTagsIndex()])
      .then(([qs, tags]) => {
        if (cancelled) return;
        const added = new Set(addedPosts);
        setQuestions(qs.filter((q) => added.has(q.postSlug)));
        setTagMeta(tags.find((t) => t.slug === tag) ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load tag");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tag, addedPosts]);

  const today = todayISO(0);

  if (addedPosts.length === 0 && !loading) {
    return (
      <PageLayout>
        <p className="italic mb-4">Add study sets to browse questions by tag.</p>
        <Link to="/" className={stampClasses("solid", "md")}>
          Browse Posts
        </Link>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <p className="smallcaps text-sm text-[var(--slate)]">Tag</p>
      <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {tag}
      </h2>
      <p className="text-base italic text-[var(--charcoal)] mb-6">
        {tagMeta
          ? `${tagMeta.questionCount} in export · ${questions.length} in your sets`
          : `${questions.length} in your sets`}
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        {questions.length > 0 && (
          <>
            <Link to="/tags/$tag/study" params={{ tag }} className={stampClasses("solid", "lg")}>
              Study Due
            </Link>
            <Link
              to="/tags/$tag/study"
              params={{ tag }}
              search={{ cram: "1" }}
              className={stampClasses("ghost", "lg")}
            >
              Cram All ({questions.length})
            </Link>
          </>
        )}
        <Link to="/tags" className={stampClasses("ghost", "md")}>
          ← All Tags
        </Link>
        <Link to="/browse" className={stampClasses("ghost", "md")}>
          Question Browser
        </Link>
      </div>

      {loading ? (
        <p className="italic text-[var(--slate)]">Loading…</p>
      ) : error ? (
        <p className="text-base border-2 border-[var(--ink-black)] p-4">{error}</p>
      ) : questions.length === 0 ? (
        <p className="italic text-[var(--slate)]">
          No questions with this tag in your active study sets.
        </p>
      ) : (
        <div className="border-2 border-[var(--ink-black)] overflow-x-auto">
          <table className="w-full text-base" style={{ fontFamily: "var(--font-mono)" }}>
            <thead className="border-b-2 border-[var(--ink-black)] bg-[var(--highlight)]">
              <tr>
                <th className="p-2 text-left">Stem</th>
                <th className="p-2 text-left w-24">Format</th>
                <th className="p-2 text-left w-20">State</th>
                <th className="p-2 text-left w-20">Diff</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => {
                const card = cardStates[q.slug];
                const isIgnored = Boolean(ignored[q.slug]);
                return (
                  <tr
                    key={q.slug}
                    className={`border-b border-[var(--column-rule)] cursor-pointer hover:bg-[var(--highlight)] ${
                      isIgnored ? "opacity-50" : ""
                    }`}
                    onClick={() => setPreview(q)}
                  >
                    <td className="p-2 max-w-[320px]">
                      <span className="line-clamp-2">{stripMarkdownPreview(q.stem)}</span>
                    </td>
                    <td className="p-2 smallcaps text-[10px]">{q.answerFormat}</td>
                    <td className="p-2 capitalize">{getCardStateLabel(card, isIgnored, today)}</td>
                    <td className="p-2 capitalize">{q.difficulty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <QuestionPreviewDrawer
        question={preview}
        open={preview !== null}
        onClose={() => setPreview(null)}
        studyTo={
          preview
            ? {
                to: "/tags/$tag/study",
                params: { tag },
                search: { cram: preview.slug },
              }
            : undefined
        }
      />
    </PageLayout>
  );
}
