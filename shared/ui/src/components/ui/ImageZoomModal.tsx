import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ViewportBox = {
    top: number;
    left: number;
    width: string;
    height: string;
};

const FALLBACK_VIEWPORT: ViewportBox = {
    top: 0,
    left: 0,
    width: '100%',
    height: '100dvh',
};

function readVisualViewport(): ViewportBox {
    const viewport = window.visualViewport;
    if (!viewport) return FALLBACK_VIEWPORT;

    return {
        top: viewport.offsetTop,
        left: viewport.offsetLeft,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
    };
}

/**
 * Pin the overlay to the visual viewport so pinch-zoom / mobile chrome
 * cannot leave a `position: fixed; inset: 0` lightbox off-screen.
 */
function useVisualViewportBox(active: boolean): ViewportBox {
    const [box, setBox] = useState<ViewportBox>(FALLBACK_VIEWPORT);

    useLayoutEffect(() => {
        if (!active) return;

        const update = () => setBox(readVisualViewport());
        update();

        const viewport = window.visualViewport;
        window.addEventListener('resize', update);
        viewport?.addEventListener('resize', update);
        viewport?.addEventListener('scroll', update);

        return () => {
            window.removeEventListener('resize', update);
            viewport?.removeEventListener('resize', update);
            viewport?.removeEventListener('scroll', update);
        };
    }, [active]);

    return box;
}

export function ImageZoomModal({ open, onClose, children, label = 'Zoomed image' }: { open: boolean; onClose: () => void; children: React.ReactNode; label?: string }) {
    const viewport = useVisualViewportBox(open);

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
            className="z-50 overflow-hidden overscroll-none p-3 pt-14 touch-manipulation sm:p-4 sm:pt-16"
            style={{
                position: 'fixed',
                top: viewport.top,
                left: viewport.left,
                width: viewport.width,
                height: viewport.height,
                background: 'rgba(13,13,13,0.9)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close zoomed image"
                className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-[var(--ink-black)] bg-[var(--aged-white)] text-2xl leading-none text-[var(--ink-black)] hover:bg-[var(--highlight)]"
            >
                ×
            </button>
            {/*
              Explicitly sized containing block so a 2560px intrinsic image cannot
              blow out flex min-width:auto, and so object-contain can fill the phone.
            */}
            <div
                className="relative h-full min-h-0 min-w-0 w-full [&_div]:h-full [&_div]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-contain [&_picture]:block [&_picture]:h-full [&_picture]:w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}
