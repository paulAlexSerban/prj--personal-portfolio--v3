import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ImageZoomModal({ open, onClose, children, label = 'Zoomed image' }: { open: boolean; onClose: () => void; children: React.ReactNode; label?: string }) {
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const previousOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 pt-14 sm:p-4 sm:pt-16"
            style={{ height: '100dvh', background: 'rgba(13,13,13,0.9)' }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close zoomed image"
                className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-[var(--ink-black)] bg-[var(--aged-white)] text-2xl leading-none text-[var(--ink-black)] hover:bg-[var(--highlight)]"
            >
                ×
            </button>
            <div
                className="flex max-h-[calc(100dvh-4rem)] max-w-full min-w-0 items-center justify-center [&_img]:max-h-[calc(100dvh-4rem)] [&_img]:max-w-full [&_img]:object-contain"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
