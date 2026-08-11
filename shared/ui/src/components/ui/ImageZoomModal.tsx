import { useEffect } from 'react';

export function ImageZoomModal({ open, onClose, children, label = 'Zoomed image' }: { open: boolean; onClose: () => void; children: React.ReactNode; label?: string }) {
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(13,13,13,0.9)' }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close zoomed image"
                className="absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-[var(--ink-black)] bg-[var(--aged-white)] text-2xl leading-none text-[var(--ink-black)] hover:bg-[var(--highlight)]"
            >
                ×
            </button>
            <div className="flex max-h-[90vh] max-w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
