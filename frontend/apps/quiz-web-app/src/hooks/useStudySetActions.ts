import { useCallback, useState } from "react";
import { toast } from "sonner";
import { loadPostQuestionSlugs } from "@/data/loadQuizData";
import { useStore } from "@/store";
import { FAVORITES_CATEGORY_ID } from "@/store/types";

export function useStudySetActions() {
  const addPost = useStore((s) => s.addPost);
  const removePost = useStore((s) => s.removePost);
  const addPostToCategory = useStore((s) => s.addPostToCategory);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addToStudySet = useCallback(
    async (postSlug: string, options?: { categoryId?: string }) => {
      setLoadingSlug(postSlug);
      setError(null);
      try {
        const slugs = await loadPostQuestionSlugs(postSlug);
        addPost(postSlug, slugs);
        addPostToCategory(postSlug, options?.categoryId ?? FAVORITES_CATEGORY_ID);
        const category = useStore
          .getState()
          .categories.find((c) => c.id === (options?.categoryId ?? FAVORITES_CATEGORY_ID));
        toast.success("Added to your study sets", {
          description: category
            ? `${slugs.length} questions · ${category.name}`
            : `${slugs.length} questions`,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load questions";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoadingSlug(null);
      }
    },
    [addPost, addPostToCategory],
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
