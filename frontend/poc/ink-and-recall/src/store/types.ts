export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string;
  lapses: number;
  cardType: "new" | "learning" | "review" | "relearning";
  learningStep: number;
  suspended?: boolean;
  learningDueAt?: number; // ms epoch for in-session learning queue
  createdAt: string;
  updatedAt: string;
}

export interface DeckConfig {
  newCardsPerDay: number;
  maxReviewsPerDay: number;
  learningSteps: number[];
  graduatingInterval: number;
  easyInterval: number;
  lapseSteps: number[];
  lapseNewInterval: number;
  minimumInterval: number;
  easyBonus: number;
  intervalModifier: number;
  maximumInterval: number;
  startingEaseFactor: number;
  buryRelatedNewCards: boolean;
  buryRelatedReviewCards: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  config: DeckConfig;
}

export type Rating = 1 | 2 | 3 | 4;

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  timestamp: string;
  previousInterval: number;
  newInterval: number;
  previousEaseFactor: number;
  newEaseFactor: number;
  timeTaken: number;
}

export interface StudySession {
  id: string;
  deckId: string;
  startedAt: string;
  endedAt: string | null;
  cardsStudied: number;
  cardsAgain: number;
  cardsHard: number;
  cardsGood: number;
  cardsEasy: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  studyOrder: "new-first" | "reviews-first" | "mixed";
  showTiming: boolean;
  keyboardShortcuts: boolean;
  globalNewLimit: number | null;
  globalReviewLimit: number | null;
}

export interface DeckStats {
  total: number;
  newCount: number;
  learningCount: number;
  reviewDueCount: number;
  suspendedCount: number;
}

export const DEFAULT_CONFIG: DeckConfig = {
  newCardsPerDay: 20,
  maxReviewsPerDay: 200,
  learningSteps: [1, 10],
  graduatingInterval: 1,
  easyInterval: 4,
  lapseSteps: [10],
  lapseNewInterval: 0,
  minimumInterval: 1,
  easyBonus: 1.3,
  intervalModifier: 1.0,
  maximumInterval: 36500,
  startingEaseFactor: 2.5,
  buryRelatedNewCards: false,
  buryRelatedReviewCards: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  studyOrder: "mixed",
  showTiming: true,
  keyboardShortcuts: true,
  globalNewLimit: null,
  globalReviewLimit: null,
};
