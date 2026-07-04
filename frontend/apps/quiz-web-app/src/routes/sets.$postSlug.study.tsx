import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { StudySession } from "@/containers/StudySession";
import { useStore } from "@/store";

type StudySearch = {
  cram?: string;
};

export const Route = createFileRoute("/sets/$postSlug/study")({
  validateSearch: (search: Record<string, unknown>): StudySearch => ({
    cram: typeof search.cram === "string" && search.cram.length > 0 ? search.cram : undefined,
  }),
  component: StudyPage,
});

function StudyPage() {
  const { postSlug } = Route.useParams();
  const { cram } = Route.useSearch();
  const addedPosts = useStore((s) => s.addedPosts);

  if (!addedPosts.includes(postSlug)) {
    return (
      <PageLayout>
        <p className="italic mb-4">This post is not in your study set.</p>
        <Link to="/" className={stampClasses("solid", "md")} title="Go to the posts catalogue">
          Browse Posts
        </Link>
      </PageLayout>
    );
  }

  const isCram = Boolean(cram);

  return (
    <StudySession
      postSlugs={[postSlug]}
      questionSlugs={cram ? [cram] : undefined}
      cram={isCram}
      completionSubtitle={
        isCram
          ? "You have finished this cram session."
          : "You have reached the end of today's queue for this set."
      }
      exitSlot={
        <Link
          to="/sets/$postSlug"
          params={{ postSlug }}
          className="smallcaps"
          title="End this session and return to the set"
        >
          ← End Session
        </Link>
      }
      completionActions={
        <>
          <Link
            to="/sets/$postSlug"
            params={{ postSlug }}
            className={stampClasses("solid", "lg")}
            title="Return to this set's detail page"
          >
            Back to Set
          </Link>
          <Link
            to="/sets"
            className={stampClasses("ghost", "lg")}
            title="Go to all your study sets"
          >
            All Sets
          </Link>
        </>
      }
    />
  );
}
