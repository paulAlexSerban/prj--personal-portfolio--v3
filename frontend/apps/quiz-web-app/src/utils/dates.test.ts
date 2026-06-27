import { describe, it, expect } from "vitest";
import { localDateISO, todayISO, addDaysISO, daysBetween } from "./dates";

describe("localDateISO", () => {
  it("formats using local calendar components", () => {
    const d = new Date(2026, 5, 15, 12, 0, 0);
    expect(localDateISO(d)).toBe("2026-06-15");
  });
});

describe("todayISO rollover", () => {
  it("before dayStartHour counts as the previous study day", () => {
    const twoAm = new Date(2026, 0, 2, 2, 0, 0);
    expect(todayISO(0, 4, twoAm.getTime())).toBe("2026-01-01");
  });

  it("at or after dayStartHour counts as the current calendar day", () => {
    const fiveAm = new Date(2026, 0, 2, 5, 0, 0);
    expect(todayISO(0, 4, fiveAm.getTime())).toBe("2026-01-02");
  });

  it("offset days apply after rollover adjustment", () => {
    const fiveAm = new Date(2026, 0, 2, 5, 0, 0);
    expect(todayISO(3, 4, fiveAm.getTime())).toBe("2026-01-05");
  });
});

describe("addDaysISO", () => {
  it("adds calendar days in local time", () => {
    expect(addDaysISO("2026-01-28", 3)).toBe("2026-01-31");
    expect(addDaysISO("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("daysBetween", () => {
  it("returns whole calendar days between ISO dates", () => {
    expect(daysBetween("2026-01-01", "2026-01-04")).toBe(3);
    expect(daysBetween("2026-01-04", "2026-01-01")).toBe(-3);
  });
});
