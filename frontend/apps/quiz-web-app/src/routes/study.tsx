import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { StudySession } from "@/components/study/StudySession";
import { useStore } from "@/store";

export const Route = createFileRoute("/study")({
  component: StudyAllPage,
});

function StudyAllPage() {
  const addedPosts = useStore((s) => s.addedPosts);

  if (addedPosts.length === 0) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <p className="italic text-[var(--charcoal)] mb-4">
            No study sets yet. Add a post to start studying.
          </p>
          <Link to="/" className={stampClasses("solid", "lg")} title="Go to the posts catalogue">
            Browse Posts
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <StudySession
      postSlugs={addedPosts}
      completionSubtitle="You have cleared every due card across all your sets."
      exitSlot={
        <Link
          to="/sets"
          className="smallcaps underline"
          title="End this session and return to your sets"
        >
          ← End Session
        </Link>
      }
      completionActions={
        <>
          <Link to="/sets" className={stampClasses("solid", "lg")} title="Go to your study sets">
            My Sets
          </Link>
          <Link
            to="/stats"
            className={stampClasses("ghost", "lg")}
            title="View your progress stats"
          >
            Progress
          </Link>
        </>
      }
    />
  );
}
