import type { ReactNode } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useStudySession } from "@/hooks/useStudySession";
import { StudyCard, SessionEndView, NothingDueView } from "@prj--personal-portfolio--v3/shared--ui";

export interface StudySessionProps {
  /** Posts whose due cards make up this session's queue. */
  postSlugs: string[];
  /** When set, only these question slugs are eligible (tag scope, single-card cram). */
  questionSlugs?: string[];
  /** Cram: include scoped cards regardless of due date. Implies ignoreLimits. */
  cram?: boolean;
  /** Top-left link/button to leave the session. */
  exitSlot: ReactNode;
  /** Actions rendered on the completion screen. */
  completionActions: ReactNode;
  /** Completion screen subtitle copy. */
  completionSubtitle?: string;
}

/**
 * Container for a spaced-repetition study session. Orchestrates store/data via
 * `useStudySession` and renders presentation components from shared--ui.
 */
export function StudySession({
  postSlugs,
  questionSlugs,
  cram = false,
  exitSlot,
  completionActions,
  completionSubtitle = "You have reached the end of today's queue.",
}: StudySessionProps) {
  const session = useStudySession({ postSlugs, questionSlugs, cram });

  if (session.status === "loading") {
    return (
      <PageLayout>
        <p className="italic text-[var(--slate)]">Loading study session…</p>
      </PageLayout>
    );
  }

  if (session.status === "error") {
    return (
      <PageLayout>
        <p className="text-base border-2 border-[var(--ink-black)] p-4">{session.error}</p>
      </PageLayout>
    );
  }

  if (session.status === "nothing-due") {
    return (
      <PageLayout>
        <NothingDueView
          counts={session.scopeCounts}
          actions={completionActions}
          onStudyAhead={session.onStudyAhead}
        />
      </PageLayout>
    );
  }

  if (session.status === "session-end") {
    return (
      <PageLayout>
        <SessionEndView
          stats={session.stats}
          subtitle={completionSubtitle}
          actions={completionActions}
        />
      </PageLayout>
    );
  }

  if (!session.currentQuestion || !session.cardView) return null;

  return (
    <PageLayout>
      <StudyCard
        card={session.cardView}
        question={session.currentQuestion}
        revealed={session.revealed}
        gradedCorrect={session.gradedCorrect}
        progress={session.progress}
        ratingPreview={session.ratingPreview}
        ratingDisabled={session.ratingDisabled}
        exitSlot={exitSlot}
        onReveal={session.onReveal}
        onGraded={session.onGraded}
        onRetry={session.onRetry}
        onRate={session.onRate}
        onBury={session.onBury}
        onSuspend={session.onSuspend}
        onIgnore={session.onIgnore}
      />
    </PageLayout>
  );
}
