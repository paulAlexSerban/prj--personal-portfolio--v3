import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type {
  ExportedPostEntry,
  ExportedQuestion,
} from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { Modal } from "@prj--personal-portfolio--v3/shared--ui";
import { PaginationBar } from "@prj--personal-portfolio--v3/shared--ui/pagination-bar";
import {
  clampPage,
  paginate,
  totalPages,
} from "@prj--personal-portfolio--v3/shared--ui/pagination";
import { QuestionPreviewDrawer } from "@/containers/QuestionPreviewDrawer";
import { Stamp, stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { loadPostQuestions, loadPostsIndex } from "@/data/loadQuizData";
import { stripMarkdownPreview } from "@/lib/questionFilters";
import {
  renderStampNext,
  renderStampPrev,
  stampPaginationLabelClassName,
  TABLE_PAGE_SIZE,
} from "@/lib/paginationUi";
import { blogPostUrl } from "@/lib/urls";
import { useStudySetActions } from "@/hooks/useStudySetActions";
import { useStore } from "@/store";
import type { QuizState } from "@/store";
import { getPostStats } from "@/store/selectors";
import { resolvePostConfig } from "@/lib/postConfig";
import { cardRetrievability } from "@/algorithms/scheduler";
import type { PostConfigOverride } from "@/store/types";
import { todayISO } from "@/utils/dates";

export const Route = createFileRoute("/sets/$postSlug/")({
  component: SetDetailPage,
});

function SetDetailPage() {
  const { postSlug } = Route.useParams();
  const nav = useNavigate();

  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);
  const addedPosts = useStore((s) => s.addedPosts);
  const config = useStore((s) => s.config);
  const postConfigs = useStore((s) => s.postConfigs);
  const dailyByPost = useStore((s) => s.dailyByPost);
  const settings = useStore((s) => s.settings);
  const setPostConfig = useStore((s) => s.setPostConfig);
  const resetPost = useStore((s) => s.resetPost);
  const ignoreQuestion = useStore((s) => s.ignoreQuestion);
  const unignoreQuestion = useStore((s) => s.unignoreQuestion);
  const { removeFromStudySet } = useStudySetActions();

  const [meta, setMeta] = useState<ExportedPostEntry | null>(null);
  const [questions, setQuestions] = useState<ExportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [preview, setPreview] = useState<ExportedQuestion | null>(null);

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

  const statsState = {
    cardStates,
    ignored,
    addedPosts,
    postConfigs,
    dailyByPost,
    config,
    settings,
    suspended: {},
    reviewLogs: [],
    studySessions: [],
    daily: { date: todayISO(0, settings.dayStartHour), new: 0, reviews: 0 },
    lastReview: null,
  } as QuizState;
  const stats = getPostStats(statsState, postSlug, todayISO(0, settings.dayStartHour));
  const effectiveConfig = resolvePostConfig(config, postConfigs[postSlug]);
  const postOverride = postConfigs[postSlug];
  const postDaily = dailyByPost[postSlug];
  const today = todayISO(0, settings.dayStartHour);

  function updateOverride(patch: PostConfigOverride) {
    setPostConfig(postSlug, { ...postOverride, ...patch });
  }

  const forecast7 = useMemo(() => {
    const postCards = Object.values(cardStates).filter((c) => c.postSlug === postSlug);
    const out: { label: string; date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = todayISO(i);
      const count =
        postCards.filter((c) => c.cardType === "review" && c.dueDate === d).length +
        (i === 0 ? postCards.filter((c) => c.cardType === "review" && c.dueDate < d).length : 0);
      out.push({
        date: d,
        count,
        label:
          i === 0
            ? "Today"
            : new Date(d).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
      });
    }
    return out;
  }, [cardStates, postSlug]);

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

  const pages = totalPages(filtered.length, TABLE_PAGE_SIZE);
  const current = clampPage(page, pages);
  const pageItems = paginate(filtered, current, TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (!isAdded && !loading) {
    return (
      <PageLayout>
        <p className="italic mb-4">This post is not in your study set.</p>
        <Link to="/" className={stampClasses("solid", "md")} title="Go to the posts catalogue">
          Browse Posts
        </Link>
      </PageLayout>
    );
  }

  const blogHref = meta ? blogPostUrl(meta.type, meta.slug) : undefined;

  return (
    <PageLayout>
      {loading ? (
        <p className="italic text-[var(--slate)]">Loading study set…</p>
      ) : error ? (
        <p className="text-base border-2 border-[var(--ink-black)] p-4">{error}</p>
      ) : (
        <article>
          <p className="smallcaps text-sm text-[var(--slate)]">Study Set</p>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {meta?.title ?? postSlug}
          </h2>
          {meta?.excerpt && (
            <p className="mt-2 text-base text-[var(--charcoal)] italic">{meta.excerpt}</p>
          )}
          {blogHref && (
            <p className="mt-3">
              <a
                href={blogHref}
                target="_blank"
                rel="noopener noreferrer"
                className={stampClasses("ghost", "md")}
                title="Open the source blog post in a new tab"
              >
                Read post on blog ↗
              </a>
            </p>
          )}

          <div className="rule mt-4 mb-6" />

          <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3 mb-6">
            <Link
              to="/sets/$postSlug/study"
              params={{ postSlug }}
              className={stampClasses("solid", "lg")}
              title="Start a study session for this set"
            >
              Begin Study
            </Link>
            <Link
              to="/sets"
              className={stampClasses("ghost", "md")}
              title="Back to all your study sets"
            >
              ← All Sets
            </Link>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              title="Reset scheduling progress for this set"
              className={stampClasses("ghost", "md")}
            >
              Reset Progress
            </button>
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              title="Remove this post from your study sets"
              className="stamp stamp-ghost text-base md:ml-auto"
            >
              Remove from Set
            </button>
          </div>

          <div
            className="grid grid-cols-5 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {(
              [
                ["New", stats.newCount],
                ["Learning", stats.learningCount],
                ["Due", stats.reviewDueCount],
                ["Ignored", stats.ignoredCount],
                ["Total", stats.total],
              ] as [string, number][]
            ).map(([label, n]) => (
              <div key={label} className="p-2 text-center">
                <p className="text-[10px] smallcaps text-[var(--slate)]">{label}</p>
                <p className="text-xl md:text-2xl font-bold">{n}</p>
              </div>
            ))}
          </div>

          <section className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Seven-Day Forecast
              </h3>
              <div className="rule-thin mb-3" />
              {(() => {
                const maxF = Math.max(1, ...forecast7.map((f) => f.count));
                return (
                  <div style={{ fontFamily: "var(--font-mono)" }} className="text-sm">
                    {forecast7.map((f) => (
                      <div key={f.date} className="flex items-center gap-3 py-1">
                        <span className="w-28 smallcaps text-[var(--slate)]">{f.label}</span>
                        <span className="flex-1 truncate" style={{ letterSpacing: "0px" }}>
                          {"█".repeat(Math.round((f.count / maxF) * 24))}
                        </span>
                        <span className="w-8 text-right font-bold">{f.count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                At a Glance
              </h3>
              <div className="rule-thin mb-3" />
              <dl className="text-base space-y-1" style={{ fontFamily: "var(--font-mono)" }}>
                <ConfigRow
                  label="Daily new limit"
                  value={effectiveConfig.newCardsPerDay}
                  overridden={postOverride?.newCardsPerDay !== undefined}
                  onChange={(n) => updateOverride({ newCardsPerDay: n })}
                />
                <ConfigRow
                  label="Daily review limit"
                  value={effectiveConfig.maxReviewsPerDay}
                  overridden={postOverride?.maxReviewsPerDay !== undefined}
                  onChange={(n) => updateOverride({ maxReviewsPerDay: n })}
                />
                <ConfigRowText
                  label="Learning steps (min)"
                  value={effectiveConfig.learningSteps.join(" ")}
                  overridden={postOverride?.learningSteps !== undefined}
                  onChange={(s) =>
                    updateOverride({
                      learningSteps: s
                        .split(/[\s,]+/)
                        .map(Number)
                        .filter((x) => !Number.isNaN(x) && x > 0),
                    })
                  }
                />
                <div className="flex justify-between border-b border-dotted border-[var(--column-rule)] py-1">
                  <dt className="smallcaps text-[var(--slate)]">Studied today</dt>
                  <dd>
                    {postDaily?.date === today
                      ? `${postDaily.new} new · ${postDaily.reviews} reviews`
                      : "0 new · 0 reviews"}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-dotted border-[var(--column-rule)] py-1">
                  <dt className="smallcaps text-[var(--slate)]">Starting ease</dt>
                  <dd>{config.startingEaseFactor.toFixed(2)}</dd>
                </div>
              </dl>
              {postOverride && Object.keys(postOverride).length > 0 && (
                <button
                  type="button"
                  onClick={() => setPostConfig(postSlug, null)}
                  title="Clear per-set overrides and use the global defaults"
                  className="smallcaps text-[10px] underline mt-2 text-[var(--slate)]"
                >
                  Reset to global defaults
                </button>
              )}
              <p className="text-sm italic text-[var(--slate)] mt-2">
                Per-set overrides · global defaults in{" "}
                <Link to="/settings" className="underline">
                  Settings
                </Link>
              </p>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Questions
            </h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stem or slug…"
              className="border-2 border-[var(--ink-black)] bg-transparent px-2 py-1 text-base flex-1 min-w-[180px]"
            />
          </div>

          <div className="border-2 border-[var(--ink-black)] overflow-x-auto">
            <table
              className="data-table w-full text-base"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <thead className="border-b-2 border-[var(--ink-black)] bg-[var(--highlight)]">
                <tr>
                  <th className="p-2 text-left">Stem</th>
                  <th className="p-2 text-left w-24">Format</th>
                  <th className="p-2 text-left w-20">Type</th>
                  <th className="p-2 text-left w-20">Due</th>
                  <th className="p-2 text-left w-14">Ivl</th>
                  {settings.scheduler === "fsrs" ? (
                    <th className="p-2 text-left w-14" title="Predicted retrievability">
                      R(t)
                    </th>
                  ) : (
                    <th className="p-2 text-left w-14">Ease</th>
                  )}
                  <th className="p-2 text-left w-24">Actions</th>
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
                      <td className="p-2 max-w-[260px]">
                        <span className="line-clamp-2">{stripMarkdownPreview(q.stem)}</span>
                      </td>
                      <td className="p-2 smallcaps text-[14px]">{q.answerFormat}</td>
                      <td className="p-2">{card?.cardType ?? "—"}</td>
                      {/**date fromat yy-MM-dd */}
                      <td className="p-2">
                        {card?.dueDate
                          ? new Date(card.dueDate).toLocaleDateString("en-US", {
                              year: "2-digit",
                              month: "2-digit",
                              day: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="p-2">{card ? `${card.interval}d` : "—"}</td>
                      {settings.scheduler === "fsrs" ? (
                        <td className="p-2">
                          <RetrievabilityCell card={card} today={today} />
                        </td>
                      ) : (
                        <td className="p-2">{card ? card.easeFactor.toFixed(2) : "—"}</td>
                      )}
                      <td className="p-2 ">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isIgnored) unignoreQuestion(q.slug);
                            else ignoreQuestion(q.slug);
                          }}
                          title={
                            isIgnored
                              ? "Include this question in study sessions again"
                              : "Exclude this question from all future sessions"
                          }
                          className="smallcaps text-[14px] underline"
                        >
                          {isIgnored ? "Unignore" : "Ignore"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center italic text-[var(--slate)]">
                      No questions match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={current}
            pages={pages}
            total={filtered.length}
            itemLabel="questions"
            onPageChange={setPage}
            className="mt-4 text-base"
            labelClassName={stampPaginationLabelClassName}
            renderPrev={renderStampPrev}
            renderNext={renderStampNext}
          />
        </article>
      )}

      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove from study set?"
      >
        <p className="text-base mb-4">
          Removes <b>{meta?.title ?? postSlug}</b> from your active sets. Your card progress is kept
          if you add it again later.
        </p>
        <div className="flex gap-3">
          <Stamp
            title="Confirm removing this post from your study sets"
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
            title="Cancel and keep this post in your study sets"
            className="smallcaps underline text-base"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset progress?">
        <p className="text-base mb-4">
          Resets all {settings.scheduler === "fsrs" ? "FSRS-5" : "SM-2"} progress for questions in
          this set. Content stays in your library.
        </p>
        <div className="flex gap-3">
          <Stamp
            title="Confirm resetting scheduling progress for this set"
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
            title="Cancel and keep your progress"
            className="smallcaps underline text-base"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <QuestionPreviewDrawer
        question={preview}
        open={preview !== null}
        onClose={() => setPreview(null)}
        blogPostHref={blogHref}
      />
    </PageLayout>
  );
}

function RetrievabilityCell({
  card,
  today,
}: {
  card: import("@/store/types").CardState | undefined;
  today: string;
}) {
  if (!card) return <>—</>;
  const r = cardRetrievability(card, today);
  if (r == null) return <>—</>;
  const pct = Math.round(r * 100);
  const color = r >= 0.9 ? "var(--ink-black)" : r >= 0.7 ? "var(--slate)" : "#c0392b";
  return (
    <span style={{ color }} title={`Predicted retrievability ${pct}%`}>
      {pct}%
    </span>
  );
}

function ConfigRow({
  label,
  value,
  overridden,
  onChange,
}: {
  label: string;
  value: number;
  overridden?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex justify-between items-center border-b border-dotted border-[var(--column-rule)] py-1">
      <dt className="smallcaps text-[var(--slate)]">
        {label}
        {overridden && <span className="ml-1 text-[var(--ink-black)]">*</span>}
      </dt>
      <dd>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-transparent border-b border-[var(--ink-black)] w-16 text-right py-0.5"
        />
      </dd>
    </div>
  );
}

function ConfigRowText({
  label,
  value,
  overridden,
  onChange,
}: {
  label: string;
  value: string;
  overridden?: boolean;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex justify-between items-center border-b border-dotted border-[var(--column-rule)] py-1">
      <dt className="smallcaps text-[var(--slate)]">
        {label}
        {overridden && <span className="ml-1 text-[var(--ink-black)]">*</span>}
      </dt>
      <dd>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-b border-[var(--ink-black)] w-24 text-right py-0.5 text-base"
        />
      </dd>
    </div>
  );
}
