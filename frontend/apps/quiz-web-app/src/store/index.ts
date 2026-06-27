import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type {
  AppSettings,
  CardState,
  DailyCounts,
  PostConfigOverride,
  Rating,
  ReviewLog,
  StudyConfig,
  StudySession,
} from "./types";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createCardState, resetCardState } from "./types";
import { getScheduler } from "../algorithms/scheduler";
import { buildDueCounts } from "../algorithms/fuzz";
import { getPostDaily, resolvePostConfig } from "../lib/postConfig";
import { todayISO, uid } from "../utils/dates";

const STORAGE_KEY = "quiz-web-app:v1";

function freshDaily(today = todayISO(0)): DailyCounts {
  return { date: today, new: 0, reviews: 0 };
}

// In-memory fallback so the store works in non-browser environments (tests/SSR-less node).
function createMemoryStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => void map.set(name, value),
    removeItem: (name) => void map.delete(name),
  };
}

const storage = createJSONStorage(() =>
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : createMemoryStorage(),
);

/** Ephemeral snapshot enabling one-step undo of the last review. Not persisted. */
export interface LastReview {
  questionSlug: string;
  rating: Rating;
  logId: string;
  prevCard: CardState;
  prevDaily: DailyCounts;
  prevDailyByPost: Record<string, DailyCounts>;
  prevSuspended: Record<string, true>;
}

export interface QuizState {
  /** SM-2 state per question slug. */
  cardStates: Record<string, CardState>;
  /** Post slugs the user has added to their study set. */
  addedPosts: string[];
  /** Question slugs the user has chosen to ignore (excluded from all sessions). */
  ignored: Record<string, true>;
  /** Question slugs temporarily suspended (excluded from queues until unsuspended). */
  suspended: Record<string, true>;
  /** Per-post scheduling overrides (new/day, reviews/day, steps). */
  postConfigs: Record<string, PostConfigOverride>;
  /** Per-post daily new/review counts (keyed by post slug). */
  dailyByPost: Record<string, DailyCounts>;
  reviewLogs: ReviewLog[];
  studySessions: StudySession[];
  settings: AppSettings;
  config: StudyConfig;
  /** Global daily new/review counts (caps total across all sets). */
  daily: DailyCounts;
  /** Last review, for one-step undo. Ephemeral (not persisted). */
  lastReview: LastReview | null;
}

export interface QuizActions {
  /** Add a post and create fresh state for any of its questions not already tracked (additive — WEB-04). */
  addPost: (postSlug: string, questionSlugs: string[]) => void;
  /** Remove a post from the study set but keep all card progress (WEB-05). */
  removePost: (postSlug: string) => void;
  /** Apply an SM-2 rating to a question by slug (WEB-06). */
  reviewCard: (questionSlug: string, rating: Rating, timeTakenMs: number) => void;
  /** Revert the most recent reviewCard (restore card + daily, drop its log). */
  undoLastReview: () => LastReview | null;
  /** Mark a question ignored — excluded from all future sessions (WEB-08). */
  ignoreQuestion: (questionSlug: string) => void;
  unignoreQuestion: (questionSlug: string) => void;
  /** Temporarily suspend / unsuspend a question (excluded from queues). */
  suspendQuestion: (questionSlug: string) => void;
  unsuspendQuestion: (questionSlug: string) => void;
  /** Reset progress for one post's questions (WEB-12). */
  resetPost: (postSlug: string) => void;
  /** Reset progress for a single question back to "new". */
  resetQuestion: (questionSlug: string) => void;
  /** Reset all progress, logs and sessions (WEB-12). */
  resetAll: () => void;
  startSession: () => string;
  endSession: (id: string) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  setConfig: (c: Partial<StudyConfig>) => void;
  /** Set or clear per-post scheduling overrides. Pass null to remove. */
  setPostConfig: (postSlug: string, override: PostConfigOverride | null) => void;
  /** Wipe all state (progress, added sets, logs, sessions) back to defaults. */
  clearAll: () => void;
  /** Overwrite state from an exported backup (used by import feature). */
  importState: (snapshot: Partial<QuizState>) => void;
}

export type QuizStore = QuizState & QuizActions;

export const initialState: QuizState = {
  cardStates: {},
  addedPosts: [],
  ignored: {},
  suspended: {},
  postConfigs: {},
  dailyByPost: {},
  reviewLogs: [],
  studySessions: [],
  settings: DEFAULT_SETTINGS,
  config: DEFAULT_CONFIG,
  daily: freshDaily(),
  lastReview: null,
};

export const useStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addPost: (postSlug, questionSlugs) =>
        set((s) => {
          const cardStates = { ...s.cardStates };
          const now = Date.now();
          for (const slug of questionSlugs) {
            // Additive: never reset a question the user has already studied.
            if (!cardStates[slug]) {
              cardStates[slug] = createCardState(slug, postSlug, now);
            }
          }
          const addedPosts = s.addedPosts.includes(postSlug)
            ? s.addedPosts
            : [...s.addedPosts, postSlug];
          return { addedPosts, cardStates };
        }),

      removePost: (postSlug) =>
        set((s) => ({
          // Keep cardStates intact so progress survives re-adding (WEB-05).
          addedPosts: s.addedPosts.filter((p) => p !== postSlug),
        })),

      reviewCard: (questionSlug, rating, timeTakenMs) => {
        const s = get();
        const card = s.cardStates[questionSlug];
        if (!card) return;
        const wasType = card.cardType;
        const postConfig = resolvePostConfig(s.config, s.postConfigs[card.postSlug]);
        const dayStartHour = s.settings.dayStartHour;
        const today = todayISO(0, dayStartHour);
        const dueCounts = buildDueCounts(Object.values(s.cardStates));

        const scheduler = getScheduler(s.settings);
        const {
          card: updated,
          previousInterval,
          previousEaseFactor,
        } = scheduler.applyReview(card, rating, postConfig, {
          seed: questionSlug,
          dueCounts,
          dayStartHour,
          today,
        });

        const log: ReviewLog = {
          id: uid(),
          questionSlug,
          postSlug: card.postSlug,
          rating,
          timestamp: new Date().toISOString(),
          previousInterval,
          newInterval: updated.interval,
          previousEaseFactor,
          newEaseFactor: updated.easeFactor,
          timeTaken: timeTakenMs,
          scheduler: scheduler.name,
        };

        const daily = s.daily.date === today ? s.daily : freshDaily(today);
        const postDaily = getPostDaily(s.dailyByPost, card.postSlug, today);
        const nextDaily: DailyCounts = {
          date: today,
          new: daily.new + (wasType === "new" ? 1 : 0),
          reviews: daily.reviews + (wasType === "review" ? 1 : 0),
        };
        const nextPostDaily: DailyCounts = {
          date: today,
          new: postDaily.new + (wasType === "new" ? 1 : 0),
          reviews: postDaily.reviews + (wasType === "review" ? 1 : 0),
        };

        // Auto-leech: suspend when lapses cross the threshold.
        const suspended = { ...s.suspended };
        const threshold = s.settings.leechThreshold ?? 0;
        if (
          threshold > 0 &&
          updated.lapses >= threshold &&
          s.settings.leechAction === "suspend" &&
          !suspended[questionSlug]
        ) {
          suspended[questionSlug] = true;
        }

        set({
          cardStates: { ...s.cardStates, [questionSlug]: updated },
          reviewLogs: [...s.reviewLogs, log],
          daily: nextDaily,
          dailyByPost: { ...s.dailyByPost, [card.postSlug]: nextPostDaily },
          suspended,
          lastReview: {
            questionSlug,
            rating,
            logId: log.id,
            prevCard: card,
            prevDaily: daily,
            prevDailyByPost: s.dailyByPost,
            prevSuspended: s.suspended,
          },
        });
      },

      undoLastReview: () => {
        const s = get();
        const last = s.lastReview;
        if (!last) return null;
        set({
          cardStates: { ...s.cardStates, [last.questionSlug]: last.prevCard },
          reviewLogs: s.reviewLogs.filter((l) => l.id !== last.logId),
          daily: last.prevDaily,
          dailyByPost: last.prevDailyByPost,
          suspended: last.prevSuspended,
          lastReview: null,
        });
        return last;
      },

      ignoreQuestion: (questionSlug) =>
        set((s) => ({ ignored: { ...s.ignored, [questionSlug]: true } })),

      unignoreQuestion: (questionSlug) =>
        set((s) => {
          const ignored = { ...s.ignored };
          delete ignored[questionSlug];
          return { ignored };
        }),

      suspendQuestion: (questionSlug) =>
        set((s) => ({ suspended: { ...s.suspended, [questionSlug]: true } })),

      unsuspendQuestion: (questionSlug) =>
        set((s) => {
          const suspended = { ...s.suspended };
          delete suspended[questionSlug];
          return { suspended };
        }),

      resetPost: (postSlug) =>
        set((s) => {
          const cardStates = { ...s.cardStates };
          const now = Date.now();
          for (const [slug, card] of Object.entries(cardStates)) {
            if (card.postSlug === postSlug) {
              cardStates[slug] = resetCardState(card, now);
            }
          }
          return { cardStates };
        }),

      resetQuestion: (questionSlug) =>
        set((s) => {
          const card = s.cardStates[questionSlug];
          if (!card) return {};
          return {
            cardStates: {
              ...s.cardStates,
              [questionSlug]: resetCardState(card, Date.now()),
            },
          };
        }),

      resetAll: () =>
        set((s) => {
          const cardStates: Record<string, CardState> = {};
          const now = Date.now();
          for (const [slug, card] of Object.entries(s.cardStates)) {
            cardStates[slug] = resetCardState(card, now);
          }
          return {
            cardStates,
            reviewLogs: [],
            studySessions: [],
            daily: freshDaily(),
            dailyByPost: {},
          };
        }),

      startSession: () => {
        const id = uid();
        const session: StudySession = {
          id,
          startedAt: new Date().toISOString(),
          endedAt: null,
          cardsStudied: 0,
          cardsAgain: 0,
          cardsHard: 0,
          cardsGood: 0,
          cardsEasy: 0,
        };
        set((s) => ({ studySessions: [...s.studySessions, session] }));
        return id;
      },

      endSession: (id) =>
        set((s) => {
          const sessions = s.studySessions.map((ss) => {
            if (ss.id !== id || ss.endedAt) return ss;
            const logs = s.reviewLogs.filter(
              (l) => new Date(l.timestamp).getTime() >= new Date(ss.startedAt).getTime(),
            );
            return {
              ...ss,
              endedAt: new Date().toISOString(),
              cardsStudied: logs.length,
              cardsAgain: logs.filter((l) => l.rating === 1).length,
              cardsHard: logs.filter((l) => l.rating === 2).length,
              cardsGood: logs.filter((l) => l.rating === 3).length,
              cardsEasy: logs.filter((l) => l.rating === 4).length,
            };
          });
          return { studySessions: sessions };
        }),

      setSettings: (next) =>
        set((s) => {
          const merged = { ...s.settings, ...next };
          // Switching algorithm migrates every card to the new representation
          // (lossless: SM-2 keeps interval/ease; FSRS seeds stability/difficulty).
          if (next.scheduler && next.scheduler !== s.settings.scheduler) {
            const target = getScheduler(merged);
            const cardStates: Record<string, CardState> = {};
            for (const [slug, card] of Object.entries(s.cardStates)) {
              cardStates[slug] = target.migrate(card, s.config);
            }
            return { settings: merged, cardStates };
          }
          return { settings: merged };
        }),
      setConfig: (next) => set((s) => ({ config: { ...s.config, ...next } })),

      setPostConfig: (postSlug, override) =>
        set((s) => {
          const postConfigs = { ...s.postConfigs };
          if (override === null || Object.keys(override).length === 0) {
            delete postConfigs[postSlug];
          } else {
            postConfigs[postSlug] = { ...postConfigs[postSlug], ...override };
          }
          return { postConfigs };
        }),

      clearAll: () => set({ ...initialState, daily: freshDaily() }),

      importState: (snapshot) =>
        set((s) => ({
          cardStates: snapshot.cardStates ?? s.cardStates,
          addedPosts: snapshot.addedPosts ?? s.addedPosts,
          ignored: snapshot.ignored ?? s.ignored,
          suspended: snapshot.suspended ?? s.suspended,
          postConfigs: snapshot.postConfigs ?? s.postConfigs,
          dailyByPost: snapshot.dailyByPost ?? s.dailyByPost,
          reviewLogs: snapshot.reviewLogs ?? s.reviewLogs,
          studySessions: snapshot.studySessions ?? s.studySessions,
          settings: snapshot.settings ? { ...DEFAULT_SETTINGS, ...snapshot.settings } : s.settings,
          config: snapshot.config ? { ...DEFAULT_CONFIG, ...snapshot.config } : s.config,
          daily: snapshot.daily ?? s.daily,
          lastReview: null,
        })),
    }),
    {
      name: STORAGE_KEY,
      storage,
      // `lastReview` is a transient undo buffer — never persist it.
      partialize: ({ lastReview: _lastReview, ...rest }) => rest,
    },
  ),
);
