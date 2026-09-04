import { useState } from "react";
import { Modal, Stamp } from "@prj--personal-portfolio--v3/shared--ui";
import { useCategoryActions } from "@/hooks/useCategoryActions";
import { useStore } from "@/store";
import { FAVORITES_CATEGORY_ID, MAX_CATEGORY_NAME_LENGTH } from "@/store/types";

export function ManageCategoriesModal({
  open,
  onClose,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}) {
  const categories = useStore((s) => s.categories);
  const postCategories = useStore((s) => s.postCategories);
  const { create, rename, remove } = useCategoryActions();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function setCount(id: string): number {
    return Object.values(postCategories).filter((ids) => ids.includes(id)).length;
  }

  function handleCreate() {
    const id = create(draft);
    if (id) setDraft("");
  }

  function startRename(id: string, name: string) {
    setConfirmId(null);
    setEditingId(id);
    setEditName(name);
  }

  function commitRename() {
    if (!editingId) return;
    if (rename(editingId, editName)) {
      setEditingId(null);
      setEditName("");
    }
  }

  function handleDelete(id: string) {
    if (remove(id)) {
      onDeleted?.(id);
      setConfirmId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Categories">
      <p className="text-base text-[var(--charcoal)] italic mb-4">
        Categories group whole study sets. Deleting a category does not remove sets or progress.
      </p>
      <ul className="flex flex-col gap-3">
        {categories.map((cat) => {
          const locked = Boolean(cat.isDefault || cat.id === FAVORITES_CATEGORY_ID);
          const confirming = confirmId === cat.id;
          const editing = editingId === cat.id;
          return (
            <li
              key={cat.id}
              className="border-t border-[var(--column-rule)] pt-3 flex flex-wrap items-center gap-2"
            >
              <div className="flex-1 min-w-[12rem]">
                {editing ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={MAX_CATEGORY_NAME_LENGTH}
                    aria-label="Rename category"
                    className="w-full border-b-2 border-[var(--ink-black)] bg-transparent py-1 text-base"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {cat.name}
                    {locked && (
                      <span className="ml-2 smallcaps text-[10px] font-normal text-[var(--slate)]">
                        Default
                      </span>
                    )}
                  </p>
                )}
                <p className="text-[10px] smallcaps text-[var(--slate)]">
                  {setCount(cat.id)} set{setCount(cat.id) === 1 ? "" : "s"}
                </p>
              </div>
              {locked ? null : confirming ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm italic text-[var(--charcoal)]">
                    Sets become uncategorized.
                  </p>
                  <Stamp
                    size="sm"
                    onClick={() => handleDelete(cat.id)}
                    title={`Delete ${cat.name}`}
                  >
                    Delete
                  </Stamp>
                  <Stamp
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmId(null)}
                    title="Cancel delete"
                  >
                    Cancel
                  </Stamp>
                </div>
              ) : editing ? (
                <div className="flex gap-2">
                  <Stamp size="sm" onClick={commitRename} title="Save new name">
                    Save
                  </Stamp>
                  <Stamp
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                    title="Cancel rename"
                  >
                    Cancel
                  </Stamp>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Stamp
                    variant="ghost"
                    size="sm"
                    onClick={() => startRename(cat.id, cat.name)}
                    title={`Rename ${cat.name}`}
                  >
                    Rename
                  </Stamp>
                  <Stamp
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmId(cat.id)}
                    title={`Delete ${cat.name}`}
                  >
                    Delete
                  </Stamp>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="rule-thin my-4" />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[12rem]">
          <span className="smallcaps text-[10px] text-[var(--slate)]">New category</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            placeholder="e.g. AI Engineering"
            className="mt-1 w-full border-b-2 border-[var(--ink-black)] bg-transparent py-1 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </label>
        <Stamp size="sm" onClick={handleCreate} disabled={!draft.trim()} title="Create category">
          Add
        </Stamp>
      </div>
      <div className="mt-6">
        <Stamp variant="ghost" size="sm" onClick={onClose} title="Close">
          Done
        </Stamp>
      </div>
    </Modal>
  );
}
