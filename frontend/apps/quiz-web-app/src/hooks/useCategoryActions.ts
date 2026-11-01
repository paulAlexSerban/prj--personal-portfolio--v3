import { useCallback } from "react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { FAVORITES_CATEGORY_ID, MAX_CATEGORY_NAME_LENGTH } from "@/store/types";

function validateName(raw: string, existingNames: string[], currentName?: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Name a category first.";
  if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
    return `Keep names under ${MAX_CATEGORY_NAME_LENGTH} characters.`;
  }
  const taken = existingNames.some(
    (n) =>
      n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== currentName?.toLowerCase(),
  );
  if (taken) return `“${trimmed}” already exists.`;
  return null;
}

export function useCategoryActions() {
  const categories = useStore((s) => s.categories);
  const createCategory = useStore((s) => s.createCategory);
  const renameCategory = useStore((s) => s.renameCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const addPostToCategory = useStore((s) => s.addPostToCategory);
  const removePostFromCategory = useStore((s) => s.removePostFromCategory);

  const names = categories.map((c) => c.name);

  const create = useCallback(
    (name: string): string | null => {
      const error = validateName(name, names);
      if (error) {
        toast.error(error);
        return null;
      }
      const id = createCategory(name);
      if (!id) {
        toast.error("Could not create that category.");
        return null;
      }
      toast.success(`Created “${name.trim()}”`);
      return id;
    },
    [createCategory, names],
  );

  const rename = useCallback(
    (id: string, name: string): boolean => {
      const cat = categories.find((c) => c.id === id);
      if (!cat) return false;
      if (cat.isDefault || cat.id === FAVORITES_CATEGORY_ID) {
        toast.error("Favorites cannot be renamed.");
        return false;
      }
      const error = validateName(name, names, cat.name);
      if (error) {
        toast.error(error);
        return false;
      }
      renameCategory(id, name);
      toast.success("Category renamed");
      return true;
    },
    [categories, names, renameCategory],
  );

  const remove = useCallback(
    (id: string): boolean => {
      const cat = categories.find((c) => c.id === id);
      if (!cat) return false;
      if (cat.isDefault || cat.id === FAVORITES_CATEGORY_ID) {
        toast.error("Favorites cannot be deleted.");
        return false;
      }
      deleteCategory(id);
      toast("Category removed", {
        description: "Sets in it are uncategorized, not deleted.",
      });
      return true;
    },
    [categories, deleteCategory],
  );

  const addTo = useCallback(
    (postSlug: string, categoryId: string) => {
      addPostToCategory(postSlug, categoryId);
    },
    [addPostToCategory],
  );

  const removeFrom = useCallback(
    (postSlug: string, categoryId: string) => {
      removePostFromCategory(postSlug, categoryId);
    },
    [removePostFromCategory],
  );

  return { create, rename, remove, addTo, removeFrom };
}
