import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@/components/ui/Stamp";
import { StudySession } from "@/components/study/StudySession";
import { useStore } from "@/store";

export const Route = createFileRoute("/sets/$postSlug/study")({
  component: StudyPage,
});

function StudyPage() {
  const { postSlug } = Route.useParams();
  const addedPosts = useStore((s) => s.addedPosts);

  if (!addedPosts.includes(postSlug)) {
    return (
      <PageLayout>
        <p className="italic mb-4">This post is not in your study set.</p>
        <Link to="/" className={stampClasses("solid", "md")}>
          Browse Posts
        </Link>
      </PageLayout>
    );
  }

  return (
    <StudySession
      postSlugs={[postSlug]}
      completionSubtitle="You have reached the end of today's queue for this set."
      exitSlot={
        <Link to="/sets/$postSlug" params={{ postSlug }} className="smallcaps underline">
          ← End Session
        </Link>
      }
      completionActions={
        <>
          <Link to="/sets/$postSlug" params={{ postSlug }} className={stampClasses("solid", "lg")}>
            Back to Set
          </Link>
          <Link to="/sets" className={stampClasses("ghost", "lg")}>
            All Sets
          </Link>
        </>
      }
    />
  );
}
