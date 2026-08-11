import { useEffect, useState } from 'react';

import { ImageZoomModal } from './ImageZoomModal';

type ZoomPayload = {
    src: string;
    srcSet?: string;
    sizes?: string;
    alt: string;
};

/**
 * Page-level island that opens ImageZoomModal for SSR'd `[data-image-zoom]` triggers
 * (e.g. MDX ImageResponsive), which cannot be hydrated as evaluate()'d Content islands.
 */
export function ImageZoomRoot() {
    const [open, setOpen] = useState(false);
    const [payload, setPayload] = useState<ZoomPayload | null>(null);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const trigger = target.closest<HTMLElement>('[data-image-zoom]');
            if (!trigger) return;

            const src = trigger.dataset.zoomSrc;
            if (!src) return;

            event.preventDefault();
            setPayload({
                src,
                srcSet: trigger.dataset.zoomSrcset,
                sizes: trigger.dataset.zoomSizes,
                alt: trigger.dataset.zoomAlt ?? '',
            });
            setOpen(true);
        };

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    return (
        <ImageZoomModal open={open && Boolean(payload)} onClose={() => setOpen(false)} label={payload?.alt || 'Zoomed image'}>
            {payload ? <img src={payload.src} srcSet={payload.srcSet} sizes={payload.sizes} alt={payload.alt} className="max-h-[90vh] max-w-full object-contain" /> : null}
        </ImageZoomModal>
    );
}
