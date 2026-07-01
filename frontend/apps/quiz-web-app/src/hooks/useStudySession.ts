import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import type { Rating, SessionStats, ScopeCounts } from "@prj--personal-portfolio--v3/shared--ui";
import { loadPostQuestions } from "@/data/loadQuizData";
import { useStore } from "@/store";
import { selectStudyQueue } from "@/store/selectors";
import { getScheduler } from "@/algorithms/scheduler";
import { todayISO } from "@/utils/dates";

const RATING_LABELS: Record<Rating, string> = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };

export interface StudySessionScope {
  postSlugs: string[];
  questionSlugs?: string[];
  cram?: boolean;
}

export type StudySessionStatus = "loading" | "error" | "nothing-due" | "session-end" | "active";

export interface UseStudySessionResult {
  status: StudySessionStatus;
  error: string | null;
  currentQuestion: ExportedQuestion | undefined;
  cardView: { cardType: string; easeFactor: number; interval: number } | undefined;
  revealed: boolean;
  gradedCorrect: boolean | null;
  progress: { done: number; total: number };
  scopeCounts: ScopeCounts;
  stats: SessionStats;
  ratingPreview: (rating: Rating) => string;
  ratingDisabled: (rating: Rating) => boolean;
  onReveal: () => void;
  onGraded: (correct: boolean | null) => void;
  onRetry: () => void;
  onRate: (rating: Rating) => void;
  onBury: () => void;
  onSuspend: () => void;
  onIgnore: () => void;
  onStudyAhead: (() => void) | undefined;
}

export function useStudySession(scope: StudySessionScope): UseStudySessionResult {
  const { postSlugs, questionSlugs, cram = false } = scope;
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
  const [ignoreLimits, setIgnoreLimits] = useState(false);
  const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);
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

  useEffect(() => {
    return () => endSession(sessionId);
  }, [sessionId, endSession]);

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

  const actionableQueue = loading
    ? []
    : queue.filter((c) => questionMap.has(c.questionSlug) && !buried.has(c.questionSlug));

  const currentCard = actionableQueue[0];
  const currentQuestion = currentCard ? questionMap.get(currentCard.questionSlug) : undefined;

  const initialTotal = useRef(0);
  if (actionableQueue.length > initialTotal.current) initialTotal.current = actionableQueue.length;

  const scopeCounts = useMemo((): ScopeCounts => {
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
          if (cram && questionSlugs?.length === 1) {
            setBuried((prev) => {
              const next = new Set(prev);
              next.delete(slug);
              return next;
            });
          }
        },
      },
    });
    // Single-card cram: one rating then end the session (practice, not a full queue).
    if (cram && questionSlugs?.length === 1) {
      setBuried((prev) => new Set(prev).add(slug));
    }
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

  function ignoreCurrent() {
    if (!currentCard) return;
    ignoreQuestion(currentCard.questionSlug);
    toast("Ignored", { description: "Excluded from all future sessions." });
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
        answer(ratingDisabled(3) ? 2 : 3);
      } else if (e.key === "4") answer(4);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, currentCard, settings.keyboardShortcuts]);

  const done = initialTotal.current - actionableQueue.length;
  const reviewedAny = stats.again + stats.hard + stats.good + stats.easy > 0;

  let status: StudySessionStatus;
  if (loading) status = "loading";
  else if (error) status = "error";
  else if (!currentCard || !currentQuestion) {
    status = !reviewedAny && initialTotal.current === 0 ? "nothing-due" : "session-end";
  } else status = "active";

  const ratingPreview = (rating: Rating): string => {
    if (!currentCard) return "-";
    return scheduler.previewInterval(currentCard, rating, config);
  };

  return {
    status,
    error,
    currentQuestion,
    cardView: currentCard
      ? {
          cardType: currentCard.cardType,
          easeFactor: currentCard.easeFactor,
          interval: currentCard.interval,
        }
      : undefined,
    revealed,
    gradedCorrect,
    progress: { done, total: initialTotal.current },
    scopeCounts,
    stats,
    ratingPreview,
    ratingDisabled,
    onReveal: () => setRevealed(true),
    onGraded: setGradedCorrect,
    onRetry: () => {
      setRevealed(false);
      setGradedCorrect(null);
      startTimeRef.current = Date.now();
    },
    onRate: answer,
    onBury: buryCurrent,
    onSuspend: suspendCurrent,
    onIgnore: ignoreCurrent,
    onStudyAhead: ignoreLimits ? undefined : () => setIgnoreLimits(true),
  };
}
