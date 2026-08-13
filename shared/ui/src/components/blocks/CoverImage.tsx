import { useState } from 'react';

import ImageResponsive from '../ui/ImageResponsive';
import { ImageZoomModal } from '../ui/ImageZoomModal';
import { coverImageUrl } from '../../lib/coverImage';
import { parseResponsiveCover } from '../../lib/responsiveCover';

const DEFAULT_CARD_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
const DEFAULT_HERO_SIZES = '(max-width: 768px) 100vw, 66vw';
const ZOOM_WIDTHS = '[4,4,4,4,4]';
const ZOOM_SIZES = '95vw';

export interface CoverImageProps {
    cover: string | null | undefined;
    placeholder: string;
    alt?: string;
    className?: string;
    imgClassName?: string;
    loading?: 'lazy' | 'eager';
    sizes?: 'card' | 'hero' | string;
    ratiosStr?: string;
    widthsStr?: string;
    /** When true, clicking the image opens a full-screen zoom lightbox. */
    zoomable?: boolean;
    /** Optional alt override used only inside the zoom lightbox. */
    zoomAlt?: string;
}

function resolveSizes(sizes: CoverImageProps['sizes']) {
    if (sizes === 'card') return DEFAULT_CARD_SIZES;
    if (sizes === 'hero') return DEFAULT_HERO_SIZES;
    return sizes;
}

export function CoverImage({
    cover,
    placeholder,
    alt = '',
    className = '',
    imgClassName = 'aspect-video w-full object-cover',
    loading = 'lazy',
    sizes = 'card',
    ratiosStr,
    widthsStr,
    zoomable = false,
    zoomAlt,
}: CoverImageProps) {
    const [zoomOpen, setZoomOpen] = useState(false);
    const responsive = parseResponsiveCover(cover);
    const lightboxAlt = zoomAlt ?? alt;
    const zoomLabel = lightboxAlt ? `Zoom image: ${lightboxAlt}` : 'Zoom image';

    const inlineImage = responsive ? (
        <ImageResponsive
            imageName={responsive.imageName}
            hash={responsive.hash}
            alt={alt}
            className={className}
            imgClassName={imgClassName}
            loading={loading}
            sizes={resolveSizes(sizes)}
            ratiosStr={ratiosStr}
            widthsStr={widthsStr}
        />
    ) : (
        <img src={coverImageUrl(cover, placeholder)} alt={alt} loading={loading} className={imgClassName} />
    );

    if (!zoomable) {
        return inlineImage;
    }

    const zoomedImage = responsive ? (
        <ImageResponsive
            imageName={responsive.imageName}
            hash={responsive.hash}
            alt={lightboxAlt}
            sizes={ZOOM_SIZES}
            widthsStr={ZOOM_WIDTHS}
            ratiosStr={ratiosStr}
            loading="eager"
            imgClassName="max-h-[calc(100dvh-4rem)] max-w-full object-contain"
        />
    ) : (
        <img src={coverImageUrl(cover, placeholder)} alt={lightboxAlt} loading="eager" draggable={false} className="max-h-[calc(100dvh-4rem)] max-w-full object-contain" />
    );

    return (
        <>
            <button
                type="button"
                onClick={() => setZoomOpen(true)}
                aria-label={zoomLabel}
                className="block w-full cursor-zoom-in touch-manipulation border-0 bg-transparent p-0 text-left"
            >
                {inlineImage}
            </button>
            <ImageZoomModal open={zoomOpen} onClose={() => setZoomOpen(false)} label={lightboxAlt || 'Zoomed image'}>
                {zoomedImage}
            </ImageZoomModal>
        </>
    );
}
