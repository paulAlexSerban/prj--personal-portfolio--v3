import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { StudySession } from "@/containers/StudySession";
import { loadPostsIndex } from "@/data/loadQuizData";
import { blogPostUrl } from "@/lib/urls";
import { useStore } from "@/store";

export const Route = createFileRoute("/study")({
  component: StudyAllPage,
});

function StudyAllPage() {
  const addedPosts = useStore((s) => s.addedPosts);
  const [postTypes, setPostTypes] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    loadPostsIndex()
      .then((posts) => {
        if (cancelled) return;
        setPostTypes(new Map(posts.map((p) => [p.slug, p.type])));
      })
      .catch(() => {
        if (!cancelled) setPostTypes(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getPostBlogHref = useMemo(
    () => (slug: string) => {
      const postType = postTypes.get(slug);
      return postType ? blogPostUrl(postType, slug) : undefined;
    },
    [postTypes],
  );

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
      getPostBlogHref={getPostBlogHref}
      completionSubtitle="You have cleared every due card across all your sets."
      exitSlot={
        <Link to="/sets" className="smallcaps" title="End this session and return to your sets">
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
