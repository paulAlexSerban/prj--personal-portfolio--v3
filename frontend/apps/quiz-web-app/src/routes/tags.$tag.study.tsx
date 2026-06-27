import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@/components/ui/Stamp";
import { StudySession } from "@/components/study/StudySession";
import { loadTagQuestions } from "@/data/loadQuizData";
import { useStore } from "@/store";

type TagStudySearch = {
  cram?: string;
};

export const Route = createFileRoute("/tags/$tag/study")({
  validateSearch: (search: Record<string, unknown>): TagStudySearch => ({
    cram:
      search.cram === "1" || (typeof search.cram === "string" && search.cram.length > 0)
        ? typeof search.cram === "string"
          ? search.cram
          : "1"
        : undefined,
  }),
  component: TagStudyPage,
});

function TagStudyPage() {
  const { tag } = Route.useParams();
  const { cram } = Route.useSearch();
  const addedPosts = useStore((s) => s.addedPosts);

  const [questions, setQuestions] = useState<ExportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTagQuestions(tag)
      .then((qs) => {
        if (cancelled) return;
        const added = new Set(addedPosts);
        setQuestions(qs.filter((q) => added.has(q.postSlug)));
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

  const questionSlugs = useMemo(() => questions.map((q) => q.slug), [questions]);
  const postSlugs = useMemo(() => [...new Set(questions.map((q) => q.postSlug))], [questions]);

  const isFullCram = cram === "1";
  const isSingleCram = Boolean(cram && cram !== "1");
  const cramMode = Boolean(cram);
  const scopedSlugs = isSingleCram && cram ? [cram] : questionSlugs;

  if (loading) {
    return (
      <PageLayout>
        <p className="italic text-[var(--slate)]">Loading tag study session…</p>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <p className="text-sm border-2 border-[var(--ink-black)] p-4">{error}</p>
      </PageLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <PageLayout>
        <p className="italic mb-4">No questions in your sets for tag “{tag}”.</p>
        <Link to="/tags/$tag" params={{ tag }} className={stampClasses("solid", "md")}>
          Back to Tag
        </Link>
      </PageLayout>
    );
  }

  return (
    <StudySession
      postSlugs={postSlugs}
      questionSlugs={scopedSlugs}
      cram={cramMode}
      completionSubtitle={
        cramMode
          ? `You have finished this cram session for tag “${tag}”.`
          : `You have reached the end of today's queue for tag “${tag}”.`
      }
      exitSlot={
        <Link to="/tags/$tag" params={{ tag }} className="smallcaps underline">
          ← End Session
        </Link>
      }
      completionActions={
        <>
          <Link to="/tags/$tag" params={{ tag }} className={stampClasses("solid", "lg")}>
            Back to Tag
          </Link>
          <Link to="/tags" className={stampClasses("ghost", "lg")}>
            All Tags
          </Link>
        </>
      }
    />
  );
}
