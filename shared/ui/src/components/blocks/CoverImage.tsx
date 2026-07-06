import ImageResponsive from '../ui/ImageResponsive';
import { coverImageUrl } from '../../lib/coverImage';
import { parseResponsiveCover } from '../../lib/responsiveCover';

const DEFAULT_CARD_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
const DEFAULT_HERO_SIZES = '(max-width: 768px) 100vw, 66vw';

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
}: CoverImageProps) {
    const responsive = parseResponsiveCover(cover);

    if (responsive) {
        return (
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
        );
    }

    return <img src={coverImageUrl(cover, placeholder)} alt={alt} loading={loading} className={imgClassName} />;
}
