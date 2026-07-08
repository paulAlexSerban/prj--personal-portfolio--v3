import type {
  AllQuestionsBundle,
  ExportedPostEntry,
  ExportedQuestion,
  ExportedTagEntry,
  PostQuestionsFile,
  PostsIndex,
  TagQuestionsFile,
  TagsIndex,
} from "@prj--personal-portfolio--v3/tools--quiz-export/contract";

/** Base path for the static JSON emitted by `shared--quiz-export`. */
const DATA_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/data`;

/**
 * True when `date` is missing, unparseable, or on/before the calendar day of `asOf`.
 * Mirrors the blog-site filter so future-dated content is hidden from listings,
 * browse, tags, and study across both surfaces.
 */
export function isPublishedOnOrBefore(date: string | null | undefined, asOf = new Date()): boolean {
  if (!date) return true;
  const published = new Date(date);
  if (Number.isNaN(published.getTime())) return true;
  const asOfDay = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const publishedDay = new Date(published.getFullYear(), published.getMonth(), published.getDate());
  return publishedDay.getTime() <= asOfDay.getTime();
}

function allowedPostSlugs(posts: ExportedPostEntry[]): Set<string> {
  return new Set(posts.filter((p) => isPublishedOnOrBefore(p.date)).map((p) => p.slug));
}

// Simple in-memory caches so repeated navigations don't re-fetch.
let postsIndexCache: ExportedPostEntry[] | null = null;
let tagsIndexCache: ExportedTagEntry[] | null = null;
let allQuestionsCache: ExportedQuestion[] | null = null;
const postQuestionsCache = new Map<string, ExportedQuestion[]>();
const tagQuestionsCache = new Map<string, ExportedQuestion[]>();

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function loadPostsIndex(): Promise<ExportedPostEntry[]> {
  if (postsIndexCache) return postsIndexCache;
  const data = await fetchJson<PostsIndex>(`${DATA_BASE}/posts.json`);
  postsIndexCache = data.posts.filter((p) => isPublishedOnOrBefore(p.date));
  return postsIndexCache;
}

export async function loadTagsIndex(): Promise<ExportedTagEntry[]> {
  if (tagsIndexCache) return tagsIndexCache;
  const data = await fetchJson<TagsIndex>(`${DATA_BASE}/tags.json`);
  tagsIndexCache = data.tags;
  return data.tags;
}

export async function loadPostQuestions(postSlug: string): Promise<ExportedQuestion[]> {
  const cached = postQuestionsCache.get(postSlug);
  if (cached) return cached;
  const data = await fetchJson<PostQuestionsFile>(`${DATA_BASE}/questions/${postSlug}.json`);
  postQuestionsCache.set(postSlug, data.questions);
  return data.questions;
}

export async function loadTagQuestions(tagSlug: string): Promise<ExportedQuestion[]> {
  const cached = tagQuestionsCache.get(tagSlug);
  if (cached) return cached;
  const [data, allowed] = await Promise.all([
    fetchJson<TagQuestionsFile>(`${DATA_BASE}/tags/${tagSlug}.json`),
    loadPostsIndex().then(allowedPostSlugs),
  ]);
  const questions = data.questions.filter((q) => allowed.has(q.postSlug));
  tagQuestionsCache.set(tagSlug, questions);
  return questions;
}

/** All questions across every post — used by the global browse screen. */
export async function loadAllQuestions(): Promise<ExportedQuestion[]> {
  if (allQuestionsCache) return allQuestionsCache;
  const data = await fetchJson<AllQuestionsBundle>(`${DATA_BASE}/_all.json`);
  const allowed = allowedPostSlugs(data.posts);
  allQuestionsCache = data.questions.filter((q) => allowed.has(q.postSlug));
  return allQuestionsCache;
}

/** Convenience: question slugs for a post (used by the store's additive `addPost`). */
export async function loadPostQuestionSlugs(postSlug: string): Promise<string[]> {
  const questions = await loadPostQuestions(postSlug);
  return questions.map((q) => q.slug);
}

/** Clear all in-memory caches (e.g. after a data refresh). */
export function clearQuizDataCache(): void {
  postsIndexCache = null;
  tagsIndexCache = null;
  allQuestionsCache = null;
  postQuestionsCache.clear();
  tagQuestionsCache.clear();
}
