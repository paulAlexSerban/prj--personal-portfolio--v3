import { useCallback, useState } from "react";
import { toast } from "sonner";
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
        toast.success("Added to your study sets", { description: `${slugs.length} questions` });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load questions";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoadingSlug(null);
      }
    },
    [addPost],
  );

  const removeFromStudySet = useCallback(
    (postSlug: string) => {
      removePost(postSlug);
      toast("Removed from study sets", { description: "Progress is kept if you re-add it." });
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
