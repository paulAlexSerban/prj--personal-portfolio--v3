import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import { PageLayout } from "@/components/layout/PageLayout";
import { Stamp } from "@/components/ui/Stamp";
import { QuestionRenderer } from "@/components/study/QuestionRenderer";
import { loadPostQuestions } from "@/data/loadQuizData";
import { useStore } from "@/store";
import { selectStudyQueue } from "@/store/selectors";
import { previewInterval } from "@/algorithms/intervals";
import type { Rating } from "@/store/types";

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
  exitSlot,
  completionActions,
  completionSubtitle = "You have reached the end of today's queue.",
}: StudySessionProps) {
  const scopeKey = postSlugs.join(",");

  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);
  const addedPosts = useStore((s) => s.addedPosts);
  const settings = useStore((s) => s.settings);
  const config = useStore((s) => s.config);
  const daily = useStore((s) => s.daily);
  const reviewCard = useStore((s) => s.reviewCard);
  const ignoreQuestion = useStore((s) => s.ignoreQuestion);
  const startSession = useStore((s) => s.startSession);
  const endSession = useStore((s) => s.endSession);

  const [questionMap, setQuestionMap] = useState<Map<string, ExportedQuestion>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [tick, setTick] = useState(0);
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
    Promise.all(postSlugs.map((slug) => loadPostQuestions(slug)))
      .then((lists) => {
        if (cancelled) return;
        const map = new Map<string, ExportedQuestion>();
        for (const list of lists) for (const q of list) map.set(q.slug, q);
        setQuestionMap(map);
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
    const state = { addedPosts, cardStates, ignored, daily, config, settings } as Parameters<
      typeof selectStudyQueue
    >[0];
    return selectStudyQueue(state, { postSlugs, now: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addedPosts, cardStates, ignored, daily, config, settings, scopeKey, tick]);

  // Only cards whose content is actually loaded are actionable. Cards whose
  // slugs aren't in the questionMap yet (still loading) are filtered out; once
  // loading finishes, any slug that is still missing means stale card state
  // for content that no longer exists — those are silently skipped.
  const actionableQueue = loading ? [] : queue.filter((c) => questionMap.has(c.questionSlug));

  const currentCard = actionableQueue[0];
  const currentQuestion = currentCard ? questionMap.get(currentCard.questionSlug) : undefined;

  const initialTotal = useRef(0);
  if (actionableQueue.length > initialTotal.current) initialTotal.current = actionableQueue.length;

  useEffect(() => {
    setRevealed(false);
    startTimeRef.current = Date.now();
  }, [currentCard?.questionSlug]);

  function answer(rating: Rating) {
    if (!currentCard) return;
    const elapsed = Date.now() - startTimeRef.current;
    reviewCard(currentCard.questionSlug, rating, elapsed);
    setStats((s) => ({
      again: s.again + (rating === 1 ? 1 : 0),
      hard: s.hard + (rating === 2 ? 1 : 0),
      good: s.good + (rating === 3 ? 1 : 0),
      easy: s.easy + (rating === 4 ? 1 : 0),
      totalTime: s.totalTime + elapsed,
    }));
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
        answer(3);
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
        <p className="text-sm border-2 border-[var(--ink-black)] p-4">{error}</p>
      </PageLayout>
    );
  }

  if (!currentCard || !currentQuestion) {
    return <SessionEnd stats={stats} subtitle={completionSubtitle} actions={completionActions} />;
  }

  const done = initialTotal.current - actionableQueue.length;

  return (
    <PageLayout>
      <div
        className="flex items-center justify-between mb-4 text-sm"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {exitSlot}
        <span>
          {done + 1} / {initialTotal.current}
        </span>
        <button
          type="button"
          onClick={() => ignoreQuestion(currentCard.questionSlug)}
          className="smallcaps underline"
          title="Exclude this question from all future sessions"
        >
          Ignore
        </button>
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
        />

        {revealed && (
          <div className="mt-auto pt-8">
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  [1, "Again"],
                  [2, "Hard"],
                  [3, "Good"],
                  [4, "Easy"],
                ] as [Rating, string][]
              ).map(([r, label]) => (
                <div key={r} className="text-center">
                  <Stamp
                    onClick={() => answer(r)}
                    className="w-full"
                    variant={r === 3 ? "solid" : "ghost"}
                  >
                    {label}
                  </Stamp>
                  <p
                    className="smallcaps text-[10px] text-[var(--slate)] mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {previewInterval(currentCard, r, config)} · {r}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
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
        <p className="smallcaps text-xs text-[var(--slate)]">Edition Complete</p>
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
            <p className="text-xs">{pct(n)}%</p>
          </div>
        ))}
      </div>

      <p
        className="text-center smallcaps text-sm text-[var(--slate)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {total} cards · {mins.toFixed(1)} min · {(total / Math.max(mins, 0.1)).toFixed(1)} cards/min
      </p>

      <div className="text-center mt-8 flex justify-center gap-3">{actions}</div>
    </PageLayout>
  );
}
