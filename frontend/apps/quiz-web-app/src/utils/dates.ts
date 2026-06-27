/** Default Anki-style rollover: study day starts at 4 AM local time. */
export const DEFAULT_DAY_START_HOUR = 4;

/** Format a Date as local YYYY-MM-DD (never UTC slice). */
export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Current study-day ISO date, respecting the Anki-style rollover hour.
 * Before `dayStartHour` local time, the study day is still "yesterday".
 */
export function studyDayISO(now = Date.now(), dayStartHour = DEFAULT_DAY_START_HOUR): string {
  const d = new Date(now);
  if (d.getHours() < dayStartHour) d.setDate(d.getDate() - 1);
  return localDateISO(d);
}

/**
 * Study-day ISO date offset by N days from `now`, with rollover applied first.
 */
export function todayISO(
  offsetDays = 0,
  dayStartHour: number = DEFAULT_DAY_START_HOUR,
  now = Date.now(),
): string {
  const d = new Date(now);
  if (d.getHours() < dayStartHour) d.setDate(d.getDate() - 1);
  d.setDate(d.getDate() + offsetDays);
  return localDateISO(d);
}

/** Add calendar days to an ISO date string (local calendar math). */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return localDateISO(dt);
}

/** Day of the year, 1–366 (Jan 1 = 1). */
export function dayOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

/** ISO-8601 week number, 1–53 (weeks start Monday; week 1 holds the first Thursday). */
export function isoWeek(d = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = date.getTime();
  date.setUTCMonth(0, 1);
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay() + 7) % 7));
  }
  return 1 + Math.round((firstThursday - date.getTime()) / (7 * 86400000));
}

export function formatDateline(d = new Date()): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Whole calendar days between two ISO dates (b − a). */
export function daysBetween(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split("-").map(Number);
  const [by, bm, bd] = bISO.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
