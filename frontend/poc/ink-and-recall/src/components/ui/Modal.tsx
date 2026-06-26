import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,13,0.7)" }}
      onClick={onClose}
    >
      <div
        className="bg-[var(--aged-white)] border-[3px] border-[var(--ink-black)] max-w-lg w-full p-6 grain"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h2>
            <div className="rule mt-2 mb-4" />
          </>
        )}
        {children}
      </div>
    </div>
  );
}
