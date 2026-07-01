import { toast } from "sonner";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import type { CardPreviewData } from "@prj--personal-portfolio--v3/shared--ui";
import { getCardStateLabel } from "@/lib/questionFilters";
import { useStore } from "@/store";
import { todayISO } from "@/utils/dates";

export interface UseQuestionPreviewResult {
  card: CardPreviewData | undefined;
  stateLabel: string;
  isIgnored: boolean;
  isSuspended: boolean;
  onIgnoreToggle: () => void;
  onSuspendToggle: () => void;
  onReset: () => void;
}

export function useQuestionPreview(question: ExportedQuestion | null): UseQuestionPreviewResult {
  const cardStates = useStore((s) => s.cardStates);
  const ignored = useStore((s) => s.ignored);
  const suspended = useStore((s) => s.suspended);
  const ignoreQuestion = useStore((s) => s.ignoreQuestion);
  const unignoreQuestion = useStore((s) => s.unignoreQuestion);
  const suspendQuestion = useStore((s) => s.suspendQuestion);
  const unsuspendQuestion = useStore((s) => s.unsuspendQuestion);
  const resetQuestion = useStore((s) => s.resetQuestion);

  if (!question) {
    return {
      card: undefined,
      stateLabel: "",
      isIgnored: false,
      isSuspended: false,
      onIgnoreToggle: () => {},
      onSuspendToggle: () => {},
      onReset: () => {},
    };
  }

  const card = cardStates[question.slug];
  const isIgnored = Boolean(ignored[question.slug]);
  const isSuspended = Boolean(suspended[question.slug]);
  const today = todayISO(0);
  const stateLabel = getCardStateLabel(card, isIgnored, today);

  const cardPreview: CardPreviewData | undefined = card
    ? {
        interval: card.interval,
        easeFactor: card.easeFactor,
        dueDate: card.dueDate,
        lapses: card.lapses,
      }
    : undefined;

  return {
    card: cardPreview,
    stateLabel,
    isIgnored,
    isSuspended,
    onIgnoreToggle: () => {
      if (isIgnored) {
        unignoreQuestion(question.slug);
        toast("Unignored");
      } else {
        ignoreQuestion(question.slug);
        toast("Ignored", { description: "Excluded from all future sessions." });
      }
    },
    onSuspendToggle: () => {
      if (isSuspended) {
        unsuspendQuestion(question.slug);
        toast("Unsuspended");
      } else {
        suspendQuestion(question.slug);
        toast("Suspended", { description: "Excluded from queues until unsuspended." });
      }
    },
    onReset: () => {
      resetQuestion(question.slug);
      toast("Progress reset");
    },
  };
}
