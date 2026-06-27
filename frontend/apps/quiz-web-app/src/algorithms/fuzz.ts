import { addDaysISO } from "../utils/dates";

/** Anki-style fuzz magnitude: grows with interval (±a few %). */
export function fuzzMagnitude(interval: number): number {
  if (interval < 2) return 0;
  if (interval < 7) return 1;
  if (interval < 30) return Math.max(1, Math.floor(interval * 0.05));
  return Math.max(2, Math.floor(interval * 0.1));
}

/** Deterministic integer in [−range, +range] from a string seed. */
export function seededOffset(seed: string, range: number): number {
  if (range === 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const span = range * 2 + 1;
  return (Math.abs(h) % span) - range;
}

/** Apply fuzz to an interval, keeping it ≥ minimumInterval. */
export function applyFuzz(
  interval: number,
  seed: string,
  minimumInterval: number,
): { interval: number; offset: number } {
  const mag = fuzzMagnitude(interval);
  const offset = seededOffset(seed, mag);
  const fuzzed = Math.max(minimumInterval, interval + offset);
  return { interval: fuzzed, offset };
}

export interface BalanceOpts {
  baseInterval: number;
  seed: string;
  today: string;
  minimumInterval: number;
  /** date → count of review cards already due that day */
  dueCounts: Map<string, number>;
  /** How many days forward to look when picking the lightest slot */
  lookaheadDays?: number;
}

/**
 * Pick a due date within the fuzz window that minimises load on the forecast.
 * Returns the final interval (days from today) and the due date ISO string.
 */
export function balanceDueDate(opts: BalanceOpts): { interval: number; dueDate: string } {
  const { interval: fuzzed, offset: fuzzOffset } = applyFuzz(
    opts.baseInterval,
    opts.seed,
    opts.minimumInterval,
  );
  const mag = fuzzMagnitude(opts.baseInterval);
  const lookahead = opts.lookaheadDays ?? 21;

  // Candidate intervals span the full fuzz window around the base interval.
  const minIvl = Math.max(opts.minimumInterval, opts.baseInterval - mag);
  const maxIvl = opts.baseInterval + mag;

  let bestIvl = fuzzed;
  let bestLoad = Infinity;

  for (let ivl = minIvl; ivl <= maxIvl; ivl++) {
    const dueDate = addDaysISO(opts.today, ivl);
    // Only look ahead within the balancing window.
    if (daysFromToday(opts.today, dueDate) > lookahead) continue;
    const load = opts.dueCounts.get(dueDate) ?? 0;
    // Tie-break with the seeded offset preference (keeps deterministic fuzz).
    const tieBreak = Math.abs(ivl - (opts.baseInterval + fuzzOffset));
    const score = load * 1000 + tieBreak;
    if (score < bestLoad) {
      bestLoad = score;
      bestIvl = ivl;
    }
  }

  return { interval: bestIvl, dueDate: addDaysISO(opts.today, bestIvl) };
}

function daysFromToday(today: string, date: string): number {
  const [ty, tm, td] = today.split("-").map(Number);
  const [dy, dm, dd] = date.split("-").map(Number);
  const t = Date.UTC(ty, tm - 1, td);
  const d = Date.UTC(dy, dm - 1, dd);
  return Math.round((d - t) / 86400000);
}

/** Build a due-date histogram from review cards (for load balancing). */
export function buildDueCounts(
  cards: { cardType: string; dueDate: string }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of cards) {
    if (c.cardType !== "review") continue;
    counts.set(c.dueDate, (counts.get(c.dueDate) ?? 0) + 1);
  }
  return counts;
}
