import { Link } from "@tanstack/react-router";
import type { ExportedQuestion } from "@prj--personal-portfolio--v3/tools--quiz-export/contract";
import { QuestionPreview, stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { useQuestionPreview } from "@/hooks/useQuestionPreview";

export interface QuestionPreviewDrawerProps {
  question: ExportedQuestion | null;
  open: boolean;
  onClose: () => void;
  /** Override study link (e.g. tag-scoped cram). Defaults to per-set study route. */
  studyTo?: { to: string; params?: Record<string, string>; search?: Record<string, string> };
}

/**
 * Container for read-only question preview. Wires store mutations via
 * `useQuestionPreview` and injects router Links into the presentation component.
 */
export function QuestionPreviewDrawer({
  question,
  open,
  onClose,
  studyTo,
}: QuestionPreviewDrawerProps) {
  const preview = useQuestionPreview(question);

  if (!question) return null;

  const defaultStudy = {
    to: "/sets/$postSlug/study" as const,
    params: { postSlug: question.postSlug },
    search: { cram: question.slug },
  };

  const studyLink = studyTo ?? defaultStudy;

  const studyAction = (
    <Link
      to={studyLink.to}
      params={studyLink.params}
      search={studyLink.search}
      className={stampClasses("solid", "md")}
      onClick={onClose}
      title="Study just this card in a cram session"
    >
      Study This Card
    </Link>
  );

  return (
    <QuestionPreview
      question={question}
      open={open}
      card={preview.card}
      stateLabel={preview.stateLabel}
      isIgnored={preview.isIgnored}
      isSuspended={preview.isSuspended}
      studyAction={studyAction}
      onIgnoreToggle={preview.onIgnoreToggle}
      onSuspendToggle={preview.onSuspendToggle}
      onReset={preview.onReset}
      onClose={onClose}
      renderTag={(tag) => (
        <Link
          key={tag}
          to="/tags/$tag"
          params={{ tag }}
          className="text-sm md:text-[14px] border border-[var(--ink-black)] px-2 py-0.5 hover:bg-[var(--highlight)]"
        >
          {tag.toLowerCase()}
        </Link>
      )}
    />
  );
}
