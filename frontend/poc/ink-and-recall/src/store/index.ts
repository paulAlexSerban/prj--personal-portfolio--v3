import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Card, Deck, DeckStats, Rating, ReviewLog, StudySession } from "./types";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from "./types";
import { applyReview } from "../algorithms/sm2";
import { todayISO, uid } from "../utils/dates";
import { buildSeed } from "../utils/seed";

interface DailyCounts {
  date: string;
  new: number;
  reviews: number;
}

interface State {
  decks: Record<string, Deck>;
  cards: Record<string, Card>;
  reviewLogs: ReviewLog[];
  studySessions: StudySession[];
  settings: AppSettings;
  dailyByDeck: Record<string, DailyCounts>;
  seeded: boolean;
}

interface Actions {
  seedIfEmpty: () => void;
  createDeck: (data: {
    name: string;
    description: string;
    config?: Partial<Deck["config"]>;
  }) => Deck;
  updateDeck: (id: string, data: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  createCard: (data: { deckId: string; front: string; back: string; tags?: string[] }) => Card;
  updateCard: (id: string, data: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  deleteCards: (ids: string[]) => void;
  reviewCard: (cardId: string, rating: Rating, timeTakenMs: number) => void;
  suspendCard: (cardId: string, suspended?: boolean) => void;
  resetCardProgress: (cardId: string) => void;
  startSession: (deckId: string) => string;
  endSession: (id: string) => void;
  importData: (data: { decks: Deck[]; cards: Card[] }, mode: "merge" | "replace") => void;
  clearAll: () => void;
  setSettings: (s: Partial<AppSettings>) => void;
}

type Store = State & Actions;

const initialState: State = {
  decks: {},
  cards: {},
  reviewLogs: [],
  studySessions: [],
  settings: DEFAULT_SETTINGS,
  dailyByDeck: {},
  seeded: false,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,
      seedIfEmpty: () => {
        if (get().seeded || Object.keys(get().decks).length > 0) {
          if (!get().seeded) set({ seeded: true });
          return;
        }
        const { decks, cards } = buildSeed();
        const decksMap: Record<string, Deck> = {};
        const cardsMap: Record<string, Card> = {};
        decks.forEach((d) => (decksMap[d.id] = d));
        cards.forEach((c) => (cardsMap[c.id] = c));
        set({ decks: decksMap, cards: cardsMap, seeded: true });
      },
      createDeck: ({ name, description, config }) => {
        const id = uid();
        const ts = new Date().toISOString();
        const deck: Deck = {
          id,
          name,
          description,
          createdAt: ts,
          updatedAt: ts,
          config: { ...DEFAULT_CONFIG, ...(config ?? {}) },
        };
        set((s) => ({ decks: { ...s.decks, [id]: deck } }));
        return deck;
      },
      updateDeck: (id, data) =>
        set((s) => {
          const cur = s.decks[id];
          if (!cur) return s;
          return {
            decks: {
              ...s.decks,
              [id]: {
                ...cur,
                ...data,
                config: { ...cur.config, ...(data.config ?? {}) },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),
      deleteDeck: (id) =>
        set((s) => {
          const decks = { ...s.decks };
          delete decks[id];
          const cards: Record<string, Card> = {};
          Object.values(s.cards).forEach((c) => {
            if (c.deckId !== id) cards[c.id] = c;
          });
          return { decks, cards };
        }),
      createCard: ({ deckId, front, back, tags = [] }) => {
        const id = uid();
        const ts = new Date().toISOString();
        const card: Card = {
          id,
          deckId,
          front,
          back,
          tags,
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5,
          dueDate: todayISO(0),
          lapses: 0,
          cardType: "new",
          learningStep: 0,
          createdAt: ts,
          updatedAt: ts,
        };
        set((s) => ({ cards: { ...s.cards, [id]: card } }));
        return card;
      },
      updateCard: (id, data) =>
        set((s) => {
          const cur = s.cards[id];
          if (!cur) return s;
          return {
            cards: { ...s.cards, [id]: { ...cur, ...data, updatedAt: new Date().toISOString() } },
          };
        }),
      deleteCard: (id) =>
        set((s) => {
          const cards = { ...s.cards };
          delete cards[id];
          return { cards };
        }),
      deleteCards: (ids) =>
        set((s) => {
          const cards = { ...s.cards };
          ids.forEach((i) => delete cards[i]);
          return { cards };
        }),
      reviewCard: (cardId, rating, timeTakenMs) => {
        const s = get();
        const card = s.cards[cardId];
        if (!card) return;
        const deck = s.decks[card.deckId];
        if (!deck) return;
        const wasType = card.cardType;
        const {
          card: updated,
          previousInterval,
          previousEaseFactor,
        } = applyReview(card, rating, deck.config);
        const log: ReviewLog = {
          id: uid(),
          cardId,
          deckId: deck.id,
          rating,
          timestamp: new Date().toISOString(),
          previousInterval,
          newInterval: updated.interval,
          previousEaseFactor,
          newEaseFactor: updated.easeFactor,
          timeTaken: timeTakenMs,
        };
        const today = todayISO(0);
        const daily =
          s.dailyByDeck[deck.id]?.date === today
            ? s.dailyByDeck[deck.id]
            : { date: today, new: 0, reviews: 0 };
        const nextDaily: DailyCounts = {
          date: today,
          new: daily.new + (wasType === "new" ? 1 : 0),
          reviews: daily.reviews + (wasType === "review" ? 1 : 0),
        };
        set({
          cards: { ...s.cards, [cardId]: updated },
          reviewLogs: [...s.reviewLogs, log],
          dailyByDeck: { ...s.dailyByDeck, [deck.id]: nextDaily },
        });
      },
      suspendCard: (cardId, suspended = true) =>
        set((s) => {
          const c = s.cards[cardId];
          if (!c) return s;
          return {
            cards: {
              ...s.cards,
              [cardId]: { ...c, suspended, updatedAt: new Date().toISOString() },
            },
          };
        }),
      resetCardProgress: (cardId) =>
        set((s) => {
          const c = s.cards[cardId];
          if (!c) return s;
          return {
            cards: {
              ...s.cards,
              [cardId]: {
                ...c,
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                lapses: 0,
                cardType: "new",
                learningStep: 0,
                learningDueAt: undefined,
                dueDate: todayISO(0),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),
      startSession: (deckId) => {
        const id = uid();
        const session: StudySession = {
          id,
          deckId,
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
              (l) =>
                l.deckId === ss.deckId &&
                new Date(l.timestamp).getTime() >= new Date(ss.startedAt).getTime(),
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
      importData: (data, mode) =>
        set((s) => {
          if (mode === "replace") {
            const dm: Record<string, Deck> = {};
            const cm: Record<string, Card> = {};
            data.decks.forEach((d) => (dm[d.id] = d));
            data.cards.forEach((c) => (cm[c.id] = c));
            return { decks: dm, cards: cm };
          }
          const dm = { ...s.decks };
          const cm = { ...s.cards };
          data.decks.forEach((d) => (dm[d.id] = d));
          data.cards.forEach((c) => (cm[c.id] = c));
          return { decks: dm, cards: cm };
        }),
      clearAll: () => set({ ...initialState, seeded: true }),
      setSettings: (sx) => set((st) => ({ settings: { ...st.settings, ...sx } })),
    }),
    { name: "the-review-state" },
  ),
);

export function getDeckStats(deckId: string, cards: Record<string, Card>): DeckStats {
  const today = todayISO(0);
  const arr = Object.values(cards).filter((c) => c.deckId === deckId);
  return {
    total: arr.length,
    newCount: arr.filter((c) => c.cardType === "new" && !c.suspended).length,
    learningCount: arr.filter(
      (c) => (c.cardType === "learning" || c.cardType === "relearning") && !c.suspended,
    ).length,
    reviewDueCount: arr.filter((c) => c.cardType === "review" && !c.suspended && c.dueDate <= today)
      .length,
    suspendedCount: arr.filter((c) => c.suspended).length,
  };
}
