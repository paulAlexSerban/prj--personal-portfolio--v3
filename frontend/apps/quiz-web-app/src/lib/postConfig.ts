import type { DailyCounts, PostConfigOverride, StudyConfig } from "@/store/types";

/** Merge global config with optional per-post overrides. */
export function resolvePostConfig(global: StudyConfig, override?: PostConfigOverride): StudyConfig {
  if (!override) return global;
  return { ...global, ...override };
}

/** Get today's daily counts for a post, resetting if the date rolled over. */
export function getPostDaily(
  dailyByPost: Record<string, DailyCounts>,
  postSlug: string,
  today: string,
): DailyCounts {
  const d = dailyByPost[postSlug];
  if (d?.date === today) return d;
  return { date: today, new: 0, reviews: 0 };
}
