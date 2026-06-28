import type { ExportedQuestion } from "@prj--personal-portfolio--v3/shared--quiz-export/contract";
import type { CardState } from "@/store/types";
import { todayISO } from "@/utils/dates";

export type QuestionStateFilter = "all" | "new" | "learning" | "due" | "ignored";

export interface QuestionBrowseFilters {
  query: string;
  format: string;
  difficulty: string;
  tag: string;
  state: QuestionStateFilter;
}

export const EMPTY_BROWSE_FILTERS: QuestionBrowseFilters = {
  query: "",
  format: "",
  difficulty: "",
  tag: "",
  state: "all",
};

export function stripMarkdownPreview(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/[#*`_[\]()]/g, "");
}

/** Card scheduling label for browse tables and preview meta. */
export function getCardStateLabel(
  card: CardState | undefined,
  isIgnored: boolean,
  today = todayISO(0),
): string {
  if (isIgnored) return "ignored";
  if (!card) return "—";
  if (card.cardType === "review" && card.dueDate <= today) return "due";
  return card.cardType;
}

export function filterBrowseQuestions(
  questions: ExportedQuestion[],
  cardStates: Record<string, CardState>,
  ignored: Record<string, true>,
  filters: QuestionBrowseFilters,
  today = todayISO(0),
): ExportedQuestion[] {
  const q = filters.query.toLowerCase().trim();

  return questions.filter((question) => {
    const card = cardStates[question.slug];
    const isIgnored = Boolean(ignored[question.slug]);
    const label = getCardStateLabel(card, isIgnored, today);

    if (filters.format && question.answerFormat !== filters.format) return false;
    if (filters.difficulty && question.difficulty !== filters.difficulty) return false;
    if (filters.tag && !question.tags.includes(filters.tag)) return false;

    if (filters.state === "ignored") {
      if (!isIgnored) return false;
    } else if (filters.state === "new") {
      if (isIgnored || card?.cardType !== "new") return false;
    } else if (filters.state === "learning") {
      if (isIgnored || (card?.cardType !== "learning" && card?.cardType !== "relearning"))
        return false;
    } else if (filters.state === "due") {
      if (isIgnored || label !== "due") return false;
    } else if (filters.state !== "all" && isIgnored) {
      return false;
    }

    if (!q) return true;
    return (
      question.stem.toLowerCase().includes(q) ||
      question.slug.toLowerCase().includes(q) ||
      question.explanation.toLowerCase().includes(q) ||
      question.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Unique sorted values for browse filter dropdowns. */
export function collectBrowseFilterOptions(questions: ExportedQuestion[]) {
  const formats = new Set<string>();
  const difficulties = new Set<string>();
  const tags = new Set<string>();
  for (const q of questions) {
    formats.add(q.answerFormat);
    difficulties.add(q.difficulty);
    for (const t of q.tags) tags.add(t);
  }
  return {
    formats: [...formats].sort(),
    difficulties: [...difficulties].sort(),
    tags: [...tags].sort(),
  };
}
