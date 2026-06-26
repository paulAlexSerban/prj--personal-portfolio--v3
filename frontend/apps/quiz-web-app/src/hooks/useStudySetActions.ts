import { useCallback, useState } from "react";
import { loadPostQuestionSlugs } from "@/data/loadQuizData";
import { useStore } from "@/store";

export function useStudySetActions() {
  const addPost = useStore((s) => s.addPost);
  const removePost = useStore((s) => s.removePost);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addToStudySet = useCallback(
    async (postSlug: string) => {
      setLoadingSlug(postSlug);
      setError(null);
      try {
        const slugs = await loadPostQuestionSlugs(postSlug);
        addPost(postSlug, slugs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load questions");
      } finally {
        setLoadingSlug(null);
      }
    },
    [addPost],
  );

  const removeFromStudySet = useCallback(
    (postSlug: string) => {
      removePost(postSlug);
    },
    [removePost],
  );

  return {
    addToStudySet,
    removeFromStudySet,
    loadingSlug,
    error,
    clearError: () => setError(null),
  };
}
