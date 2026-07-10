import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { QuestionPreviewDrawer } from "@/containers/QuestionPreviewDrawer";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { PaginationBar } from "@prj--personal-portfolio--v3/shared--ui/pagination-bar";
import { clampPage, paginate, totalPages } from "@prj--personal-portfolio--v3/shared--ui/pagination";
import { loadTagQuestions, loadTagsIndex, loadPostsIndex } from "@/data/loadQuizData";
import { getCardStateLabel, stripMarkdownPreview } from "@/lib/questionFilters";
import {
  renderStampNext,
  renderStampPrev,
  stampPaginationLabelClassName,
  TABLE_PAGE_SIZE,
} from "@/lib/paginationUi";
import { blogPostUrl } from "@/lib/urls";
import { useStore } from "@/store";
import { todayISO } from "@/utils/dates";

export const Route = createFileRoute("/tags/$tag/")({
  component: TagDetailView,
});

function TagDetailView() {
  const { tag } = Route.useParams();
  const addedPosts = useStore((s) => s.addedPosts);
  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);

  const [questions, setQuestions] = useState<ExportedQuestion[]>([]);
  const [tagMeta, setTagMeta] = useState<{ questionCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExportedQuestion | null>(null);
  const [postTypes, setPostTypes] = useState<Map<string, string>>(new Map());
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadTagQuestions(tag), loadTagsIndex(), loadPostsIndex()])
      .then(([qs, tags, posts]) => {
        if (cancelled) return;
        const added = new Set(addedPosts);
        setQuestions(qs.filter((q) => added.has(q.postSlug)));
        setTagMeta(tags.find((t) => t.slug === tag) ?? null);
        setPostTypes(new Map(posts.map((p) => [p.slug, p.type])));
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

  const pages = totalPages(questions.length, TABLE_PAGE_SIZE);
  const current = clampPage(page, pages);
  const pageItems = paginate(questions, current, TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [tag, addedPosts]);

  const today = todayISO(0);

  const previewBlogHref = preview
    ? blogPostUrl(postTypes.get(preview.postSlug) ?? "post", preview.postSlug)
    : undefined;

  if (addedPosts.length === 0 && !loading) {
    return (
      <PageLayout>
        <p className="italic mb-4">Add study sets to browse questions by tag.</p>
        <Link to="/" className={stampClasses("solid", "md")} title="Go to the posts catalogue">
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
            <Link
              to="/tags/$tag/study"
              params={{ tag }}
              className={stampClasses("solid", "lg")}
              title={`Study due cards tagged “${tag}”`}
            >
              Study Due
            </Link>
            <Link
              to="/tags/$tag/study"
              params={{ tag }}
              search={{ cram: "1" }}
              className={stampClasses("ghost", "lg")}
              title={`Cram all ${questions.length} cards tagged “${tag}”, ignoring due dates`}
            >
              Cram All ({questions.length})
            </Link>
          </>
        )}
        <Link to="/tags" className={stampClasses("ghost", "md")} title="Back to all tags">
          ← All Tags
        </Link>
        <Link
          to="/browse"
          className={stampClasses("ghost", "md")}
          title="Browse and preview all questions"
        >
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
        <>
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
              {pageItems.map((q) => {
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
                    <td className="p-2 smallcaps text-[14px]">{q.answerFormat}</td>
                    <td className="p-2 capitalize">{getCardStateLabel(card, isIgnored, today)}</td>
                    <td className="p-2 capitalize">{q.difficulty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={current}
          pages={pages}
          total={questions.length}
          itemLabel="questions"
          onPageChange={setPage}
          className="mt-4 text-base"
          labelClassName={stampPaginationLabelClassName}
          renderPrev={renderStampPrev}
          renderNext={renderStampNext}
        />
        </>
      )}

      <QuestionPreviewDrawer
        question={preview}
        open={preview !== null}
        onClose={() => setPreview(null)}
        blogPostHref={previewBlogHref}
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
