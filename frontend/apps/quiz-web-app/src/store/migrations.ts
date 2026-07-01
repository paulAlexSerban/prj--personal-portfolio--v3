import type { CardState, StudyConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { addDaysISO, daysBetween, todayISO } from "../utils/dates";

/** Previous default interval ceiling before the 30-day cap migration. */
export const LEGACY_MAXIMUM_INTERVAL = 36500;

export const PERSIST_BACKUP_KEY_SUFFIX = ":backup-v0";

export type MigratablePersistedState = {
  cardStates?: Record<string, CardState>;
  config?: StudyConfig;
};

export interface MigratePersistedStateOpts {
  today?: string;
  legacyMaximumInterval?: number;
  newMaximumInterval?: number;
}

/**
 * One-shot migration for persisted quiz state: bump a legacy default
 * `config.maximumInterval`, clamp card intervals, and pull far-future due
 * dates within the effective cap. Idempotent — safe to run more than once.
 */
export function migratePersistedState<T extends MigratablePersistedState>(
  state: T,
  opts: MigratePersistedStateOpts = {},
): T {
  const today = opts.today ?? todayISO(0);
  const legacyMax = opts.legacyMaximumInterval ?? LEGACY_MAXIMUM_INTERVAL;
  const newMax = opts.newMaximumInterval ?? DEFAULT_CONFIG.maximumInterval;

  if (!state.config && !state.cardStates) return state;

  const config = state.config ? { ...state.config } : undefined;
  const effectiveMax =
    config?.maximumInterval === legacyMax ? newMax : (config?.maximumInterval ?? newMax);

  if (config && config.maximumInterval === legacyMax) {
    config.maximumInterval = newMax;
  }

  const cardStates = state.cardStates
    ? Object.fromEntries(
        Object.entries(state.cardStates).map(([slug, card]) => [
          slug,
          clampCardSchedule(card, today, effectiveMax),
        ]),
      )
    : undefined;

  return {
    ...state,
    ...(config ? { config } : {}),
    ...(cardStates ? { cardStates } : {}),
  };
}

function clampCardSchedule(card: CardState, today: string, maximumInterval: number): CardState {
  const interval = Math.min(card.interval, maximumInterval);
  const daysUntilDue = daysBetween(today, card.dueDate);
  const dueDate =
    daysUntilDue > maximumInterval ? addDaysISO(today, maximumInterval) : card.dueDate;
  if (interval === card.interval && dueDate === card.dueDate) return card;
  return { ...card, interval, dueDate };
}
