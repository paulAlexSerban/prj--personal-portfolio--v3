import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { Stamp } from "@prj--personal-portfolio--v3/shared--ui";
import { QuestionRenderer } from "@/components/study/QuestionRenderer";
import { loadPostQuestions } from "@/data/loadQuizData";
import { useStore } from "@/store";
import { selectStudyQueue } from "@/store/selectors";
import { getScheduler } from "@/algorithms/scheduler";
import { todayISO } from "@/utils/dates";
import type { Rating } from "@/store/types";

const RATING_LABELS: Record<Rating, string> = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };
const RATING_HINTS: Record<Rating, string> = {
  1: "You forgot - reschedule this card soon (Again)",
  2: "Recalled with difficulty - shorter interval (Hard)",
  3: "Recalled correctly - normal interval (Good)",
  4: "Recalled easily - longer interval (Easy)",
};

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
  totalTime: number;
}

export interface StudySessionProps {
  /** Posts whose due cards make up this session's queue. */
  postSlugs: string[];
  /** When set, only these question slugs are eligible (tag scope, single-card cram). */
  questionSlugs?: string[];
  /** Cram: include scoped cards regardless of due date. Implies ignoreLimits. */
  cram?: boolean;
  /** Top-left link/button to leave the session. */
  exitSlot: ReactNode;
  /** Actions rendered on the completion screen. */
  completionActions: ReactNode;
  /** Completion screen subtitle copy. */
  completionSubtitle?: string;
}

/**
 * Self-contained spaced-repetition session over a set of posts. Used by both
 * the per-post study route and the global "study all due" route.
 */
export function StudySession({
  postSlugs,
  questionSlugs,
  cram = false,
  exitSlot,
  completionActions,
  completionSubtitle = "You have reached the end of today's queue.",
}: StudySessionProps) {
  const scopeKey = `${postSlugs.join(",")}|${questionSlugs?.join(",") ?? ""}|${cram}`;

  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);
  const suspended = useStore((s) => s.suspended);
  const addedPosts = useStore((s) => s.addedPosts);
  const settings = useStore((s) => s.settings);
  const config = useStore((s) => s.config);
  const postConfigs = useStore((s) => s.postConfigs);
  const daily = useStore((s) => s.daily);
  const dailyByPost = useStore((s) => s.dailyByPost);
  const reviewCard = useStore((s) => s.reviewCard);
  const undoLastReview = useStore((s) => s.undoLastReview);
  const ignoreQuestion = useStore((s) => s.ignoreQuestion);
  const suspendQuestion = useStore((s) => s.suspendQuestion);
  const startSession = useStore((s) => s.startSession);
  const endSession = useStore((s) => s.endSession);

  const scheduler = useMemo(() => getScheduler(settings), [settings]);

  const [questionMap, setQuestionMap] = useState<Map<string, ExportedQuestion>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);
  // "Study ahead": ignore today's daily new/review caps for this session.
  const [ignoreLimits, setIgnoreLimits] = useState(false);
  // Auto-grade result for the current card (null = self-graded / not graded).
  const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);
  // Session-local "bury": skip these slugs for the rest of this session only.
  const [buried, setBuried] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<SessionStats>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    totalTime: 0,
  });

  const startTimeRef = useRef<number>(Date.now());
  const [sessionId] = useState(() => startSession());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // allSettled: one post failing to load must not kill the whole session
    // (critical for the global "study all" route spanning many posts).
    Promise.allSettled(postSlugs.map((slug) => loadPostQuestions(slug)))
      .then((results) => {
        if (cancelled) return;
        const map = new Map<string, ExportedQuestion>();
        const failed: string[] = [];
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            for (const q of r.value) map.set(q.slug, q);
          } else {
            failed.push(postSlugs[i]);
          }
        });
        setQuestionMap(map);
        if (failed.length === postSlugs.length) {
          setError(`Failed to load questions for: ${failed.join(", ")}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  // End the session when leaving the study page.
  useEffect(() => {
    return () => endSession(sessionId);
  }, [sessionId, endSession]);

  // Refresh queue periodically so in-session learning cards become due.
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  const queue = useMemo(() => {
    const state = {
      addedPosts,
      cardStates,
      ignored,
      suspended,
      postConfigs,
      dailyByPost,
      daily,
      config,
      settings,
    } as Parameters<typeof selectStudyQueue>[0];
    return selectStudyQueue(state, {
      postSlugs,
      questionSlugs,
      cram,
      now: Date.now(),
      ignoreLimits: ignoreLimits || cram,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addedPosts,
    cardStates,
    ignored,
    suspended,
    postConfigs,
    dailyByPost,
    daily,
    config,
    settings,
    scopeKey,
    tick,
    ignoreLimits,
    cram,
    questionSlugs,
  ]);

  // Only cards whose content is actually loaded are actionable. Cards whose
  // slugs aren't in the questionMap yet (still loading) are filtered out; once
  // loading finishes, any slug that is still missing means stale card state
  // for content that no longer exists - those are silently skipped. Session-
  // buried slugs are also skipped for the remainder of this session.
  const actionableQueue = loading
    ? []
    : queue.filter((c) => questionMap.has(c.questionSlug) && !buried.has(c.questionSlug));

  const currentCard = actionableQueue[0];
  const currentQuestion = currentCard ? questionMap.get(currentCard.questionSlug) : undefined;

  const initialTotal = useRef(0);
  if (actionableQueue.length > initialTotal.current) initialTotal.current = actionableQueue.length;

  // Raw scoped counts that ignore the daily new/review caps - so an empty queue
  // can explain *why* it's empty (nothing due vs. daily limit reached).
  const scopeCounts = useMemo(() => {
    const today = todayISO(0, settings.dayStartHour);
    const postSet = new Set(postSlugs);
    const slugSet = questionSlugs?.length ? new Set(questionSlugs) : null;
    const cards = Object.values(cardStates).filter(
      (c) =>
        postSet.has(c.postSlug) &&
        !ignored[c.questionSlug] &&
        !suspended[c.questionSlug] &&
        (!slugSet || slugSet.has(c.questionSlug)),
    );
    return {
      newTotal: cards.filter((c) => c.cardType === "new").length,
      learningDue: cards.filter(
        (c) =>
          (c.cardType === "learning" || c.cardType === "relearning") &&
          (c.learningDueAt ?? 0) <= Date.now(),
      ).length,
      reviewDue: cards.filter((c) => c.cardType === "review" && c.dueDate <= today).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStates, ignored, suspended, scopeKey, tick]);

  useEffect(() => {
    setRevealed(false);
    setGradedCorrect(null);
    startTimeRef.current = Date.now();
  }, [currentCard?.questionSlug]);

  // Wrong auto-graded answers may only be rated Again/Hard - you cannot mark a
  // card you got wrong as Good/Easy.
  const ratingDisabled = (r: Rating): boolean => gradedCorrect === false && r >= 3;

  function answer(rating: Rating) {
    if (!currentCard || ratingDisabled(rating)) return;
    const elapsed = Date.now() - startTimeRef.current;
    const slug = currentCard.questionSlug;
    reviewCard(slug, rating, elapsed);
    setStats((s) => ({
      again: s.again + (rating === 1 ? 1 : 0),
      hard: s.hard + (rating === 2 ? 1 : 0),
      good: s.good + (rating === 3 ? 1 : 0),
      easy: s.easy + (rating === 4 ? 1 : 0),
      totalTime: s.totalTime + elapsed,
    }));
    toast(`Rated ${RATING_LABELS[rating]}`, {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          const undone = undoLastReview();
          if (!undone) return;
          setStats((s) => ({
            again: s.again - (rating === 1 ? 1 : 0),
            hard: s.hard - (rating === 2 ? 1 : 0),
            good: s.good - (rating === 3 ? 1 : 0),
            easy: s.easy - (rating === 4 ? 1 : 0),
            totalTime: Math.max(0, s.totalTime - elapsed),
          }));
          setRevealed(true);
          setGradedCorrect(null);
        },
      },
    });
  }

  function buryCurrent() {
    if (!currentCard) return;
    const slug = currentCard.questionSlug;
    setBuried((prev) => new Set(prev).add(slug));
    toast("Buried for this session");
  }

  function suspendCurrent() {
    if (!currentCard) return;
    suspendQuestion(currentCard.questionSlug);
    toast("Suspended", { description: "Excluded from queues until you unsuspend it." });
  }

  useEffect(() => {
    if (!settings.keyboardShortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      if (!currentCard || !currentQuestion) return;
      if (!revealed) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      if (e.key === "1") answer(1);
      else if (e.key === "2") answer(2);
      else if (e.key === "3" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        // Space defaults to Good, but falls back to Hard when Good is locked
        // (wrong auto-graded answer).
        answer(ratingDisabled(3) ? 2 : 3);
      } else if (e.key === "4") answer(4);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, currentCard, settings.keyboardShortcuts]);

  if (loading) {
    return (
      <PageLayout>
        <p className="italic text-[var(--slate)]">Loading study session…</p>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <p className="text-base border-2 border-[var(--ink-black)] p-4">{error}</p>
      </PageLayout>
    );
  }

  if (!currentCard || !currentQuestion) {
    const reviewedAny = stats.again + stats.hard + stats.good + stats.easy > 0;
    // Distinguish "finished a session" from "nothing was due to begin with".
    if (!reviewedAny && initialTotal.current === 0) {
      return (
        <NothingDue
          counts={scopeCounts}
          actions={completionActions}
          onStudyAhead={ignoreLimits ? undefined : () => setIgnoreLimits(true)}
        />
      );
    }
    return <SessionEnd stats={stats} subtitle={completionSubtitle} actions={completionActions} />;
  }

  const done = initialTotal.current - actionableQueue.length;

  return (
    <PageLayout>
      <div
        className="flex items-center justify-between mb-4 text-base"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {exitSlot}
        <span>
          {done + 1} / {initialTotal.current}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={buryCurrent}
            className="smallcaps underline"
            title="Skip this card for the rest of this session"
          >
            Bury
          </button>
          <button
            type="button"
            onClick={suspendCurrent}
            className="smallcaps underline"
            title="Exclude from all queues until you unsuspend it"
          >
            Suspend
          </button>
          <button
            type="button"
            onClick={() => {
              ignoreQuestion(currentCard.questionSlug);
              toast("Ignored", { description: "Excluded from all future sessions." });
            }}
            className="smallcaps underline"
            title="Exclude this question from all future sessions"
          >
            Ignore
          </button>
        </div>
      </div>

      {/* Screen-reader announcement for reveal + auto-grade result. */}
      <div aria-live="polite" className="sr-only">
        {revealed
          ? gradedCorrect === null
            ? "Answer revealed."
            : gradedCorrect
              ? "Correct."
              : "Incorrect."
          : ""}
      </div>

      <div className="border-y-2 border-[var(--ink-black)] h-1 mb-6 relative">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--ink-black)]"
          style={{
            width: `${(done / Math.max(initialTotal.current, 1)) * 100}%`,
            height: "2px",
          }}
        />
      </div>

      <article className="bg-[var(--aged-white)] border-[3px] border-[var(--ink-black)] grain p-8 md:p-12 min-h-[460px] flex flex-col">
        <p className="smallcaps text-[10px] text-[var(--slate)] mb-4">
          {currentCard.cardType} card · ease {currentCard.easeFactor.toFixed(2)} · ivl{" "}
          {currentCard.interval}d
        </p>

        <QuestionRenderer
          key={currentCard.questionSlug}
          question={currentQuestion}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onGraded={setGradedCorrect}
          onRetry={() => {
            setRevealed(false);
            setGradedCorrect(null);
            startTimeRef.current = Date.now();
          }}
        />

        {revealed && (
          <div className="mt-auto pt-8">
            {gradedCorrect === false && (
              <p className="smallcaps text-[10px] text-[var(--slate)] mb-2 text-center">
                Wrong answer - rate Again or Hard
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  [1, "Again"],
                  [2, "Hard"],
                  [3, "Good"],
                  [4, "Easy"],
                ] as [Rating, string][]
              ).map(([r, label]) => {
                const disabled = ratingDisabled(r);
                return (
                  <div key={r} className="text-center">
                    <Stamp
                      onClick={() => answer(r)}
                      disabled={disabled}
                      className="w-full"
                      variant={r === 3 ? "solid" : "ghost"}
                      title={
                        disabled
                          ? "Locked - you answered incorrectly, rate Again or Hard"
                          : RATING_HINTS[r]
                      }
                    >
                      {label}
                    </Stamp>
                    <p
                      className="smallcaps text-[10px] text-[var(--slate)] mt-1"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {disabled ? "-" : scheduler.previewInterval(currentCard, r, config)} · {r}
                    </p>
                  </div>
                );
              })}
            </div>
            <p
              className="smallcaps text-[10px] text-[var(--slate)] mt-3 text-center italic"
              title="Content is read-only - edit in the source content repo"
            >
              Read-only · content edited in source
            </p>
          </div>
        )}
      </article>
    </PageLayout>
  );
}

function NothingDue({
  counts,
  actions,
  onStudyAhead,
}: {
  counts: { newTotal: number; learningDue: number; reviewDue: number };
  actions: ReactNode;
  /** When provided, offers a "study ahead" button that ignores daily caps. */
  onStudyAhead?: () => void;
}) {
  const totalAvailable = counts.newTotal + counts.learningDue + counts.reviewDue;
  // If cards exist but none made the queue, the daily new/review cap is the cause.
  const cappedByLimit = totalAvailable > 0;

  return (
    <PageLayout>
      <div className="text-center mb-8">
        <p className="smallcaps text-sm text-[var(--slate)]">Nothing Queued</p>
        <h2 className="text-6xl font-black mt-2" style={{ fontFamily: "var(--font-display)" }}>
          All Clear
        </h2>
        <p className="italic mt-2 text-[var(--charcoal)]">
          {cappedByLimit
            ? "You've reached today's study limit for this scope. More cards unlock tomorrow, or raise the daily limits in Settings."
            : "No cards are due right now. Add more posts or come back when reviews are scheduled."}
        </p>
      </div>

      <div
        className="grid grid-cols-3 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {(
          [
            ["New (untapped)", counts.newTotal],
            ["Learning due", counts.learningDue],
            ["Reviews due", counts.reviewDue],
          ] as const
        ).map(([l, n]) => (
          <div key={l} className="p-4 text-center">
            <p className="smallcaps text-[10px] text-[var(--slate)]">{l}</p>
            <p className="text-3xl font-bold">{n}</p>
          </div>
        ))}
      </div>

      {cappedByLimit && onStudyAhead && (
        <div className="text-center mb-6">
          <Stamp
            onClick={onStudyAhead}
            variant="solid"
            title="Ignore today's daily limits and study upcoming cards now"
          >
            Study ahead ({totalAvailable})
          </Stamp>
          <p
            className="smallcaps text-[10px] text-[var(--slate)] mt-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Ignores today's limits for this session. Or raise the caps in Settings.
          </p>
        </div>
      )}

      <div className="text-center mt-4 flex justify-center gap-3">{actions}</div>
    </PageLayout>
  );
}

function SessionEnd({
  stats,
  subtitle,
  actions,
}: {
  stats: SessionStats;
  subtitle: string;
  actions: ReactNode;
}) {
  const total = stats.again + stats.hard + stats.good + stats.easy;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const mins = stats.totalTime / 60000;

  return (
    <PageLayout>
      <div className="text-center mb-8">
        <p className="smallcaps text-sm text-[var(--slate)]">Edition Complete</p>
        <h2 className="text-6xl font-black mt-2" style={{ fontFamily: "var(--font-display)" }}>
          Final Word
        </h2>
        <p className="italic mt-2 text-[var(--charcoal)]">{subtitle}</p>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 border-y-2 border-[var(--ink-black)] divide-x-2 divide-[var(--ink-black)] mb-8"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {(
          [
            ["Again", stats.again],
            ["Hard", stats.hard],
            ["Good", stats.good],
            ["Easy", stats.easy],
          ] as const
        ).map(([l, n]) => (
          <div key={l} className="p-4 text-center">
            <p className="smallcaps text-[10px] text-[var(--slate)]">{l}</p>
            <p className="text-3xl font-bold">{n}</p>
            <p className="text-sm">{pct(n)}%</p>
          </div>
        ))}
      </div>

      <p
        className="text-center smallcaps text-base text-[var(--slate)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {total} cards · {mins.toFixed(1)} min · {(total / Math.max(mins, 0.1)).toFixed(1)} cards/min
      </p>

      <div className="text-center mt-8 flex justify-center gap-3">{actions}</div>
    </PageLayout>
  );
}
