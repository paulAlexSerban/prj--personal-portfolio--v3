import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { StudySession } from "@/containers/StudySession";
import { loadPostsIndex } from "@/data/loadQuizData";
import { blogPostUrl } from "@/lib/urls";
import { useStore } from "@/store";
import { getCategoryPostSlugs } from "@/store/selectors";

export const Route = createFileRoute("/sets/categories/$categoryId/study")({
  component: CategoryStudyView,
});

function CategoryStudyView() {
  const { categoryId } = Route.useParams();
  const categories = useStore((s) => s.categories);
  const addedPosts = useStore((s) => s.addedPosts);
  const postCategories = useStore((s) => s.postCategories);
  const category = categories.find((c) => c.id === categoryId);
  const postSlugs = useMemo(
    () => getCategoryPostSlugs({ addedPosts, postCategories }, categoryId),
    [addedPosts, postCategories, categoryId],
  );
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

  if (!category) {
    return (
      <PageLayout>
        <p className="italic mb-4">That category is gone.</p>
        <Link to="/sets" className={stampClasses("solid", "md")} title="Go to your study sets">
          My Sets
        </Link>
      </PageLayout>
    );
  }

  if (postSlugs.length === 0) {
    return (
      <PageLayout>
        <p className="italic mb-4">No study sets in “{category.name}” yet.</p>
        <Link to="/sets" className={stampClasses("solid", "md")} title="Go to your study sets">
          My Sets
        </Link>
      </PageLayout>
    );
  }

  return (
    <StudySession
      postSlugs={postSlugs}
      getPostBlogHref={getPostBlogHref}
      completionSubtitle={`You have cleared every due card in “${category.name}”.`}
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
