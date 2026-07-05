import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { stampClasses } from "@prj--personal-portfolio--v3/shared--ui";
import { StudySession } from "@/containers/StudySession";
import { loadPostsIndex } from "@/data/loadQuizData";
import { blogPostUrl } from "@/lib/urls";
import { useStore } from "@/store";

type StudySearch = {
  cram?: string;
};

export const Route = createFileRoute("/sets/$postSlug/study")({
  validateSearch: (search: Record<string, unknown>): StudySearch => ({
    cram: typeof search.cram === "string" && search.cram.length > 0 ? search.cram : undefined,
  }),
  component: StudyView,
});

function StudyView() {
  const { postSlug } = Route.useParams();
  const { cram } = Route.useSearch();
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
      getPostBlogHref={getPostBlogHref}
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
