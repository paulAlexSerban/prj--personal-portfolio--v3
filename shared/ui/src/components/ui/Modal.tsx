import { useEffect } from 'react';

export function Modal({
    open,
    onClose,
    title,
    children,
    wide = false,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Wider panel for question preview (scrollable). */
    wide?: boolean;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4" style={{ background: 'rgba(13,13,13,0.7)' }} onClick={onClose}>
            <div
                className={`bg-[var(--aged-white)] border-[3px] border-[var(--ink-black)] w-full p-3 md:p-6 grain ${wide ? 'max-w-3xl max-h-[90vh] overflow-y-auto' : 'max-w-lg'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <>
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
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
