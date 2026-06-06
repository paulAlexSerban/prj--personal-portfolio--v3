import type { Card, DeckConfig, Rating } from "../store/types";

export interface ReviewResult {
  card: Card;
  previousInterval: number;
  previousEaseFactor: number;
}

const todayISO = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Apply a rating to a card and return the updated card. Pure function. */
export function applyReview(
  card: Card,
  rating: Rating,
  config: DeckConfig,
  now = Date.now(),
): ReviewResult {
  const previousInterval = card.interval;
  const previousEaseFactor = card.easeFactor;
  const next: Card = { ...card, updatedAt: new Date(now).toISOString() };

  if (card.cardType === "new" || card.cardType === "learning") {
    handleLearning(next, rating, config, now, card.cardType === "new");
  } else if (card.cardType === "relearning") {
    handleRelearning(next, rating, config, now);
  } else {
    handleReview(next, rating, config, now);
  }
  return { card: next, previousInterval, previousEaseFactor };
}

function handleLearning(
  card: Card,
  rating: Rating,
  config: DeckConfig,
  now: number,
  isNew: boolean,
) {
  const steps = config.learningSteps;
  if (isNew) card.cardType = "learning";
  if (rating === 1) {
    card.learningStep = 0;
    scheduleLearning(card, steps[0] ?? 1, now);
    return;
  }
  if (rating === 4) {
    graduate(card, config, true);
    return;
  }
  if (rating === 2) {
    const cur = steps[card.learningStep] ?? 1;
    const nxt = steps[card.learningStep + 1] ?? cur * 1.5;
    scheduleLearning(card, (cur + nxt) / 2, now);
    return;
  }
  // Good
  if (card.learningStep + 1 >= steps.length) {
    graduate(card, config, false);
  } else {
    card.learningStep += 1;
    scheduleLearning(card, steps[card.learningStep], now);
  }
}

function handleRelearning(card: Card, rating: Rating, config: DeckConfig, now: number) {
  const steps = config.lapseSteps;
  if (rating === 1) {
    card.learningStep = 0;
    scheduleLearning(card, steps[0] ?? 10, now);
    return;
  }
  if (rating === 4 || card.learningStep + 1 >= steps.length || rating === 3) {
    if (rating === 3 && card.learningStep + 1 < steps.length) {
      card.learningStep += 1;
      scheduleLearning(card, steps[card.learningStep], now);
      return;
    }
    // graduate back to review
    card.cardType = "review";
    card.learningStep = 0;
    card.learningDueAt = undefined;
    const ivl = Math.max(config.minimumInterval, card.interval || config.minimumInterval);
    card.interval = Math.min(ivl, config.maximumInterval);
    card.dueDate = todayISO(card.interval);
    return;
  }
  // Hard — stay
  const cur = steps[card.learningStep] ?? 10;
  scheduleLearning(card, cur * 1.5, now);
}

function scheduleLearning(card: Card, minutes: number, now: number) {
  card.learningDueAt = now + Math.round(minutes * 60_000);
  card.dueDate = todayISO(0);
}

function graduate(card: Card, config: DeckConfig, easy: boolean) {
  card.cardType = "review";
  card.repetitions = Math.max(card.repetitions, 1);
  card.learningStep = 0;
  card.learningDueAt = undefined;
  card.interval = easy ? config.easyInterval : config.graduatingInterval;
  card.interval = Math.min(card.interval, config.maximumInterval);
  card.easeFactor = card.easeFactor || config.startingEaseFactor;
  card.dueDate = todayISO(card.interval);
}

function handleReview(card: Card, rating: Rating, config: DeckConfig, _now: number) {
  let newEF = card.easeFactor;
  if (rating === 1) newEF = Math.max(1.3, card.easeFactor - 0.2);
  else if (rating === 2) newEF = Math.max(1.3, card.easeFactor - 0.15);
  else if (rating === 4) newEF = card.easeFactor + 0.15;

  let newInterval: number;
  if (rating === 1) {
    card.lapses += 1;
    card.cardType = "relearning";
    card.learningStep = 0;
    scheduleLearning(card, config.lapseSteps[0] ?? 10, _now);
    newInterval = Math.max(
      config.minimumInterval,
      Math.floor(card.interval * config.lapseNewInterval),
    );
    card.interval = Math.min(newInterval, config.maximumInterval);
    card.easeFactor = newEF;
    return;
  }
  if (rating === 2)
    newInterval = Math.max(
      config.minimumInterval,
      Math.floor(card.interval * 1.2 * config.intervalModifier),
    );
  else if (rating === 3)
    newInterval = Math.max(
      config.minimumInterval,
      Math.floor(card.interval * newEF * config.intervalModifier),
    );
  else
    newInterval = Math.max(
      config.minimumInterval,
      Math.floor(card.interval * newEF * config.easyBonus * config.intervalModifier),
    );

  newInterval = clamp(newInterval, config.minimumInterval, config.maximumInterval);
  card.interval = newInterval;
  card.easeFactor = newEF;
  card.repetitions += 1;
  card.dueDate = todayISO(newInterval);
}
