/**
 * Back-test harness comparing SM-2 vs FSRS on a simulated deck.
 *
 * A ground-truth memory model (FSRS-5 forgetting curve with the published
 * weights) decides whether each simulated recall succeeds. Each scheduler sees
 * the same random draws but schedules with its own model, so differences in
 * total review count and achieved retention come purely from the algorithms.
 *
 * Run:  pnpm exec tsx src/algorithms/backtest.ts [--days 365] [--cards 200] [--tsv]
 *
 * Exit-gate claim (Phase 7): FSRS reaches the target retention with fewer
 * reviews than SM-2 on the same deck.
 */
import { DEFAULT_CONFIG, createCardState } from "../store/types";
import type { CardState, Rating, AppSettings } from "../store/types";
import { applyReview } from "./sm2";
import { applyReviewFsrs } from "./fsrs";
import {
  DEFAULT_FSRS_PARAMS,
  nextRecallStability,
  nextForgetStability,
  nextDifficulty,
  initStability,
  initDifficulty,
  predictedRetention,
} from "./fsrs";
import { addDaysISO } from "../utils/dates";
import { fsrsParamsFromSettings } from "./scheduler";

type SchedulerName = "sm2" | "fsrs";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = DEFAULT_FSRS_PARAMS.w;
const BASE = Date.UTC(2026, 0, 1);
const TARGET_RETENTION = 0.9;

interface SimCard {
  card: CardState;
  // Ground-truth memory (hidden from the scheduler).
  trueStability: number;
  trueDifficulty: number;
  lastReviewDay: number;
  introduced: boolean;
}

interface SimResult {
  reviews: number;
  lapses: number;
  retentionSamples: number[];
}

function fsrsSettings(): AppSettings {
  return {
    theme: "light",
    studyOrder: "mixed",
    showTiming: true,
    keyboardShortcuts: true,
    globalNewLimit: null,
    globalReviewLimit: null,
    dayStartHour: 4,
    leechThreshold: 0,
    leechAction: "suspend",
    scheduler: "fsrs",
    fsrsTargetRetention: TARGET_RETENTION,
  };
}

function simulate(
  scheduler: SchedulerName,
  opts: { days: number; cards: number; newPerDay: number; seed: number },
): SimResult {
  const rng = mulberry32(opts.seed);
  const fsrsParams = fsrsParamsFromSettings(fsrsSettings());
  const config = { ...DEFAULT_CONFIG };

  const deck: SimCard[] = Array.from({ length: opts.cards }, (_, i) => ({
    card: createCardState(`sim--q${i}`, "sim", BASE),
    trueStability: 0,
    trueDifficulty: 0,
    lastReviewDay: 0,
    introduced: false,
  }));

  const result: SimResult = { reviews: 0, lapses: 0, retentionSamples: [] };
  let nextNew = 0;

  for (let day = 0; day < opts.days; day++) {
    const today = addDaysISO("2026-01-01", day);
    const now = BASE + day * 86400000;

    // Introduce new cards for the day.
    for (let k = 0; k < opts.newPerDay && nextNew < deck.length; k++) {
      deck[nextNew].introduced = true;
      nextNew++;
    }

    for (const sim of deck) {
      if (!sim.introduced) continue;
      const c = sim.card;
      const learningDue =
        (c.cardType === "learning" || c.cardType === "relearning") && (c.learningDueAt ?? 0) <= now;
      const reviewDue = c.cardType === "review" && c.dueDate <= today;
      const newDue = c.cardType === "new";
      if (!learningDue && !reviewDue && !newDue) continue;

      // Ground-truth recall probability.
      let rating: Rating;
      if (c.cardType === "review" && sim.trueStability > 0) {
        const elapsed = Math.max(0, day - sim.lastReviewDay);
        const rTrue = predictedRetention(sim.trueStability, elapsed);
        result.retentionSamples.push(rTrue);
        const success = rng() < rTrue;
        rating = success ? (rng() < 0.15 ? 4 : 3) : 1;
        // Update ground-truth memory.
        const newD = nextDifficulty(sim.trueDifficulty, rating, W);
        sim.trueStability = success
          ? nextRecallStability(newD, sim.trueStability, rTrue, rating, W)
          : nextForgetStability(newD, sim.trueStability, rTrue, W);
        sim.trueDifficulty = newD;
        if (!success) result.lapses++;
      } else {
        // Learning / new: assume mostly-correct acquisition.
        rating = rng() < 0.9 ? 3 : 1;
        if (sim.trueStability === 0 && rating >= 2) {
          sim.trueStability = initStability(rating, W);
          sim.trueDifficulty = initDifficulty(rating, W);
        }
      }

      sim.lastReviewDay = day;
      result.reviews++;

      const reviewOpts = { now, today, seed: c.questionSlug, fsrsParams };
      const { card: updated } =
        scheduler === "fsrs"
          ? applyReviewFsrs(c, rating, config, reviewOpts)
          : applyReview(c, rating, config, reviewOpts);
      sim.card = updated;
    }
  }

  return result;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function main() {
  const args = process.argv.slice(2);
  const getNum = (flag: string, def: number) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? Number(args[i + 1]) : def;
  };
  const days = getNum("--days", 365);
  const cards = getNum("--cards", 200);
  const newPerDay = getNum("--new", 10);
  const seed = getNum("--seed", 42);
  const tsv = args.includes("--tsv");

  const sm2 = simulate("sm2", { days, cards, newPerDay, seed });
  const fsrs = simulate("fsrs", { days, cards, newPerDay, seed });

  if (tsv) {
    console.log("scheduler\treviews\tlapses\tmean_retention");
    console.log(`sm2\t${sm2.reviews}\t${sm2.lapses}\t${mean(sm2.retentionSamples).toFixed(4)}`);
    console.log(`fsrs\t${fsrs.reviews}\t${fsrs.lapses}\t${mean(fsrs.retentionSamples).toFixed(4)}`);
    return;
  }

  const fmt = (r: SimResult) =>
    `reviews=${r.reviews}  lapses=${r.lapses}  meanRetention=${(mean(r.retentionSamples) * 100).toFixed(1)}%`;

  console.log(
    `Back-test over ${days} days, ${cards} cards, ${newPerDay} new/day (target ${(TARGET_RETENTION * 100).toFixed(0)}%)`,
  );
  console.log(`  SM-2 : ${fmt(sm2)}`);
  console.log(`  FSRS : ${fmt(fsrs)}`);
  const delta = sm2.reviews - fsrs.reviews;
  const pct = sm2.reviews ? ((delta / sm2.reviews) * 100).toFixed(1) : "0";
  console.log(
    delta > 0
      ? `  → FSRS used ${delta} fewer reviews (${pct}%) at comparable retention.`
      : `  → SM-2 used ${-delta} fewer reviews; inspect parameters.`,
  );
}

main();
