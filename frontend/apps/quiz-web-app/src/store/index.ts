import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type {
  AppSettings,
  CardState,
  DailyCounts,
  Rating,
  ReviewLog,
  StudyConfig,
  StudySession,
} from "./types";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createCardState, resetCardState } from "./types";
import { applyReview } from "../algorithms/sm2";
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

export interface QuizState {
  /** SM-2 state per question slug. */
  cardStates: Record<string, CardState>;
  /** Post slugs the user has added to their study set. */
  addedPosts: string[];
  /** Question slugs the user has chosen to ignore (excluded from all sessions). */
  ignored: Record<string, true>;
  reviewLogs: ReviewLog[];
  studySessions: StudySession[];
  settings: AppSettings;
  config: StudyConfig;
  daily: DailyCounts;
}

export interface QuizActions {
  /** Add a post and create fresh state for any of its questions not already tracked (additive — WEB-04). */
  addPost: (postSlug: string, questionSlugs: string[]) => void;
  /** Remove a post from the study set but keep all card progress (WEB-05). */
  removePost: (postSlug: string) => void;
  /** Apply an SM-2 rating to a question by slug (WEB-06). */
  reviewCard: (questionSlug: string, rating: Rating, timeTakenMs: number) => void;
  /** Mark a question ignored — excluded from all future sessions (WEB-08). */
  ignoreQuestion: (questionSlug: string) => void;
  unignoreQuestion: (questionSlug: string) => void;
  /** Reset progress for one post's questions (WEB-12). */
  resetPost: (postSlug: string) => void;
  /** Reset all progress, logs and sessions (WEB-12). */
  resetAll: () => void;
  startSession: () => string;
  endSession: (id: string) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  setConfig: (c: Partial<StudyConfig>) => void;
}

export type QuizStore = QuizState & QuizActions;

export const initialState: QuizState = {
  cardStates: {},
  addedPosts: [],
  ignored: {},
  reviewLogs: [],
  studySessions: [],
  settings: DEFAULT_SETTINGS,
  config: DEFAULT_CONFIG,
  daily: freshDaily(),
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
        const {
          card: updated,
          previousInterval,
          previousEaseFactor,
        } = applyReview(card, rating, s.config);

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
        };

        const today = todayISO(0);
        const daily = s.daily.date === today ? s.daily : freshDaily(today);
        const nextDaily: DailyCounts = {
          date: today,
          new: daily.new + (wasType === "new" ? 1 : 0),
          reviews: daily.reviews + (wasType === "review" ? 1 : 0),
        };

        set({
          cardStates: { ...s.cardStates, [questionSlug]: updated },
          reviewLogs: [...s.reviewLogs, log],
          daily: nextDaily,
        });
      },

      ignoreQuestion: (questionSlug) =>
        set((s) => ({ ignored: { ...s.ignored, [questionSlug]: true } })),

      unignoreQuestion: (questionSlug) =>
        set((s) => {
          const ignored = { ...s.ignored };
          delete ignored[questionSlug];
          return { ignored };
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

      setSettings: (next) => set((s) => ({ settings: { ...s.settings, ...next } })),
      setConfig: (next) => set((s) => ({ config: { ...s.config, ...next } })),
    }),
    { name: STORAGE_KEY, storage },
  ),
);
