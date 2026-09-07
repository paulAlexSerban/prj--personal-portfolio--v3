import { useState, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import { FolderPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  stampClasses,
} from "@prj--personal-portfolio--v3/shared--ui";
import { useCategoryActions } from "@/hooks/useCategoryActions";
import { useStore } from "@/store";
import { MAX_CATEGORY_NAME_LENGTH } from "@/store/types";

const menuSurface =
  "rounded-none border-2 border-[var(--ink-black)] bg-[var(--aged-white)] text-[var(--ink-black)] grain";

/** Stable fallback so Zustand's getSnapshot does not allocate a new array every render. */
const EMPTY_MEMBERSHIP: string[] = [];

export function CategoryPicker({
  postSlug,
  isAdded,
  loading = false,
  onEnsureAdded,
}: {
  postSlug: string;
  isAdded: boolean;
  loading?: boolean;
  /** Load and add the post before assigning a category (catalogue cards). */
  onEnsureAdded?: (categoryId: string) => Promise<void>;
}) {
  const categories = useStore((s) => s.categories);
  const membership = useStore((s) => s.postCategories[postSlug]) ?? EMPTY_MEMBERSHIP;
  const { create, addTo, removeFrom } = useCategoryActions();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const memberSet = new Set(membership);

  async function ensureThen(categoryId: string) {
    if (!isAdded && onEnsureAdded) {
      setBusy(true);
      try {
        await onEnsureAdded(categoryId);
      } finally {
        setBusy(false);
      }
      return;
    }
    addTo(postSlug, categoryId);
  }

  async function toggle(categoryId: string, next: boolean) {
    if (busy || loading) return;
    if (next) await ensureThen(categoryId);
    else removeFrom(postSlug, categoryId);
  }

  async function submitNew(e?: FormEvent) {
    e?.preventDefault();
    if (busy || loading) return;
    const id = create(draft);
    if (!id) return;
    setDraft("");
    await ensureThen(id);
  }

  function stopMenuClose(e: Event) {
    e.preventDefault();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={loading || busy}
          aria-label="Choose categories"
          title="Add this set to a category"
          className={stampClasses("ghost", "sm", "inline-flex items-center gap-1")}
        >
          <FolderPlus className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Categories</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={menuSurface}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="smallcaps text-[10px] text-[var(--slate)] font-normal">
          Add to
        </DropdownMenuLabel>
        {categories.map((cat) => (
          <DropdownMenuCheckboxItem
            key={cat.id}
            checked={memberSet.has(cat.id)}
            disabled={loading || busy}
            className="rounded-none text-base focus:bg-[var(--highlight)]"
            onSelect={stopMenuClose}
            onCheckedChange={(checked) => void toggle(cat.id, checked === true)}
          >
            {cat.name}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator className="bg-[var(--ink-black)]" />
        <form
          className="flex items-center gap-1 px-2 py-1"
          onSubmit={(e) => void submitNew(e)}
          onClick={(e: MouseEvent) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            placeholder="New category…"
            aria-label="New category name"
            className="min-w-0 flex-1 border-b-2 border-[var(--ink-black)] bg-transparent px-1 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim() || loading || busy}
            className="smallcaps text-[10px] underline-offset-2 hover:underline disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <DropdownMenuSeparator className="bg-[var(--ink-black)]" />
        <div className="px-2 py-1.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Close categories menu"
            className={stampClasses("solid", "sm", "w-full justify-center")}
          >
            Done
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CategoryChips({ postSlug }: { postSlug: string }) {
  const categories = useStore((s) => s.categories);
  const membership = useStore((s) => s.postCategories[postSlug]) ?? EMPTY_MEMBERSHIP;
  const { removeFrom } = useCategoryActions();
  if (membership.length === 0) return null;
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <p className="mt-2 flex flex-wrap gap-1.5">
      {membership.map((id) => {
        const cat = byId.get(id);
        if (!cat) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 border border-[var(--ink-black)] px-1.5 py-0.5 text-[10px] smallcaps"
          >
            {cat.name}
            <button
              type="button"
              aria-label={`Remove from ${cat.name}`}
              title={`Remove from ${cat.name}`}
              className="leading-none hover:opacity-60"
              onClick={() => removeFrom(postSlug, id)}
            >
              ×
            </button>
          </span>
        );
      })}
    </p>
  );
}
