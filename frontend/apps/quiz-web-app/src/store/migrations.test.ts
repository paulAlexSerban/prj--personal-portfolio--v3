import { describe, it, expect } from "vitest";
import { migratePersistedState, LEGACY_MAXIMUM_INTERVAL } from "./migrations";
import { runPersistMigration } from "./index";
import { DEFAULT_CONFIG, DEFAULT_SETTINGS, createCardState } from "./types";
import { addDaysISO, todayISO } from "../utils/dates";

const today = "2026-06-01";

describe("migratePersistedState", () => {
  it("bumps config.maximumInterval when still at the legacy default", () => {
    const state = {
      config: { ...DEFAULT_CONFIG, maximumInterval: LEGACY_MAXIMUM_INTERVAL },
    };
    const migrated = migratePersistedState(state, { today });
    expect(migrated.config?.maximumInterval).toBe(30);
  });

  it("leaves a custom config.maximumInterval untouched", () => {
    const state = {
      config: { ...DEFAULT_CONFIG, maximumInterval: 500 },
    };
    const migrated = migratePersistedState(state, { today });
    expect(migrated.config?.maximumInterval).toBe(500);
  });

  it("clamps card intervals to the effective maximum", () => {
    const card = {
      ...createCardState("post--q1", "post"),
      cardType: "review" as const,
      interval: 400,
      dueDate: "2026-07-01",
    };
    const migrated = migratePersistedState(
      {
        config: { ...DEFAULT_CONFIG, maximumInterval: LEGACY_MAXIMUM_INTERVAL },
        cardStates: { "post--q1": card },
      },
      { today },
    );
    expect(migrated.cardStates?.["post--q1"].interval).toBe(30);
  });

  it("pulls due dates farther than the cap back within the cap", () => {
    const card = {
      ...createCardState("post--q2", "post"),
      cardType: "review" as const,
      interval: 10,
      dueDate: "2026-12-01",
    };
    const migrated = migratePersistedState(
      {
        config: { ...DEFAULT_CONFIG, maximumInterval: LEGACY_MAXIMUM_INTERVAL },
        cardStates: { "post--q2": card },
      },
      { today },
    );
    expect(migrated.cardStates?.["post--q2"].dueDate).toBe("2026-07-01");
  });

  it("is idempotent on a second run", () => {
    const state = {
      config: { ...DEFAULT_CONFIG, maximumInterval: LEGACY_MAXIMUM_INTERVAL },
      cardStates: {
        "post--q3": {
          ...createCardState("post--q3", "post"),
          cardType: "review" as const,
          interval: 400,
          dueDate: "2026-12-01",
        },
      },
    };
    const once = migratePersistedState(state, { today });
    const twice = migratePersistedState(once, { today });
    expect(twice).toEqual(once);
  });

  it("runPersistMigration clamps a realistic legacy snapshot", () => {
    const studyToday = todayISO(0);
    const legacy = {
      config: { ...DEFAULT_CONFIG, maximumInterval: LEGACY_MAXIMUM_INTERVAL },
      settings: DEFAULT_SETTINGS,
      cardStates: {
        "post--q4": {
          ...createCardState("post--q4", "post"),
          cardType: "review" as const,
          interval: 180,
          dueDate: "2026-12-01",
        },
      },
    };
    const migrated = runPersistMigration(legacy);
    expect(migrated.config?.maximumInterval).toBe(30);
    expect(migrated.cardStates?.["post--q4"].interval).toBe(30);
    expect(migrated.cardStates?.["post--q4"].dueDate).toBe(addDaysISO(studyToday, 30));
  });
});
