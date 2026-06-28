import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { QuestionPreviewDrawer } from "@/containers/QuestionPreviewDrawer";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { loadAllQuestions, loadPostsIndex } from "@/data/loadQuizData";
import {
  EMPTY_BROWSE_FILTERS,
  collectBrowseFilterOptions,
  filterBrowseQuestions,
  getCardStateLabel,
  paginate,
  stripMarkdownPreview,
  totalPages,
  type QuestionBrowseFilters,
} from "@/lib/questionFilters";
import { useStore } from "@/store";
import { todayISO } from "@/utils/dates";

const PAGE_SIZE = 25;

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  const addedPosts = useStore((s) => s.addedPosts);
  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);

  const [allQuestions, setAllQuestions] = useState<ExportedQuestion[]>([]);
  const [postTitles, setPostTitles] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuestionBrowseFilters>(EMPTY_BROWSE_FILTERS);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<ExportedQuestion | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadAllQuestions(), loadPostsIndex()])
      .then(([questions, posts]) => {
        if (cancelled) return;
        const added = new Set(addedPosts);
        setAllQuestions(questions.filter((q) => added.has(q.postSlug)));
        setPostTitles(new Map(posts.map((p) => [p.slug, p.title])));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load questions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addedPosts]);

  const today = todayISO(0);
  const filtered = useMemo(
    () => filterBrowseQuestions(allQuestions, cardStates, ignored, filters, today),
    [allQuestions, cardStates, ignored, filters, today],
  );

  const filterOptions = useMemo(() => collectBrowseFilterOptions(allQuestions), [allQuestions]);

  const pages = totalPages(filtered.length, PAGE_SIZE);
  const pageItems = paginate(filtered, page, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  if (addedPosts.length === 0 && !loading) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="italic text-[var(--charcoal)] mb-4">
            Add study sets first to browse their questions.
          </p>
          <Link to="/" className={stampClasses("solid", "lg")} title="Go to the posts catalogue">
            Browse Posts
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <p className="smallcaps text-sm text-[var(--slate)]">Question Browser</p>
      <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        All Questions
      </h2>
      <p className="text-base italic text-[var(--charcoal)] mb-6">
        Search and preview across every set you&apos;ve added — no scheduling changes.
      </p>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        options={filterOptions}
        resultCount={filtered.length}
      />

      {loading ? (
        <p className="italic text-[var(--slate)]">Loading questions…</p>
      ) : error ? (
        <p className="text-base border-2 border-[var(--ink-black)] p-4">{error}</p>
      ) : (
        <>
          <div className="border-2 border-[var(--ink-black)] overflow-x-auto mb-4">
            <table
              className="data-table w-full text-base"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <thead className="border-b-2 border-[var(--ink-black)] bg-[var(--highlight)]">
                <tr>
                  <th className="p-2 text-left">Stem</th>
                  <th className="p-2 text-left w-32">Set</th>
                  <th className="p-2 text-left w-24">Format</th>
                  <th className="p-2 text-left w-20">State</th>
                  <th className="p-2 text-left w-20">Diff</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((q) => {
                  const card = cardStates[q.slug];
                  const isIgnored = Boolean(ignored[q.slug]);
                  const state = getCardStateLabel(card, isIgnored, today);
                  return (
                    <tr
                      key={q.slug}
                      className={`border-b border-[var(--column-rule)] cursor-pointer hover:bg-[var(--highlight)] ${
                        isIgnored ? "opacity-50" : ""
                      }`}
                      onClick={() => setPreview(q)}
                    >
                      <td className="p-2 max-w-[280px]">
                        <span className="line-clamp-2">{stripMarkdownPreview(q.stem)}</span>
                      </td>
                      <td className="p-2 text-[10px] smallcaps truncate max-w-[140px]">
                        {postTitles.get(q.postSlug) ?? q.postSlug}
                      </td>
                      <td className="p-2 smallcaps text-[10px]">{q.answerFormat}</td>
                      <td className="p-2 capitalize">{state}</td>
                      <td className="p-2 capitalize">{q.difficulty}</td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center italic text-[var(--slate)]">
                      No questions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />
        </>
      )}

      <QuestionPreviewDrawer
        question={preview}
        open={preview !== null}
        onClose={() => setPreview(null)}
      />
    </PageLayout>
  );
}

function FilterBar({
  filters,
  onChange,
  options,
  resultCount,
}: {
  filters: QuestionBrowseFilters;
  onChange: (f: QuestionBrowseFilters) => void;
  options: ReturnType<typeof collectBrowseFilterOptions>;
  resultCount: number;
}) {
  const set = (patch: Partial<QuestionBrowseFilters>) => onChange({ ...filters, ...patch });

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 p-3 border-2 border-[var(--ink-black)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <input
        value={filters.query}
        onChange={(e) => set({ query: e.target.value })}
        placeholder="Search stem, tags…"
        className="col-span-2 md:col-span-2 border-2 border-[var(--ink-black)] bg-transparent px-2 py-1 text-base"
      />
      <SelectFilter
        value={filters.format}
        onChange={(v) => set({ format: v })}
        options={options.formats}
        placeholder="Format"
      />
      <SelectFilter
        value={filters.difficulty}
        onChange={(v) => set({ difficulty: v })}
        options={options.difficulties}
        placeholder="Difficulty"
      />
      <SelectFilter
        value={filters.tag}
        onChange={(v) => set({ tag: v })}
        options={options.tags}
        placeholder="Tag"
      />
      <select
        value={filters.state}
        onChange={(e) => set({ state: e.target.value as QuestionBrowseFilters["state"] })}
        className="border-2 border-[var(--ink-black)] bg-transparent px-2 py-1 text-base smallcaps"
      >
        <option value="all">All states</option>
        <option value="new">New</option>
        <option value="learning">Learning</option>
        <option value="due">Due</option>
        <option value="ignored">Ignored</option>
      </select>
      <p className="col-span-2 md:col-span-6 text-[10px] smallcaps text-[var(--slate)] pt-1">
        {resultCount} question{resultCount === 1 ? "" : "s"} · click a row to preview
      </p>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-2 border-[var(--ink-black)] bg-transparent px-2 py-1 text-base smallcaps"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between text-base"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span className="smallcaps text-[10px] text-[var(--slate)]">
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          title="Go to the previous page"
          className="stamp stamp-ghost text-sm disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          title="Go to the next page"
          className="stamp stamp-ghost text-sm disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
