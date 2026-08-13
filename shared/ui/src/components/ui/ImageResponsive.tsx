const IMAGE_BASE_URL = 'https://assets.paulserban.eu/assets/images';

/** Formats the content pipeline actually emits today (gulp process:images). */
const ACCEPTED_FORMATS = ['avif'] as const;
const FALLBACK_FORMAT = 'avif';
const DEFAULT_QUALITY = 80;
const IMAGE_EXTENSION_REGEX = /\.(avif|webp|jpe?g|png|gif|svg)$/i;

/**
 * The ImageResponsive component generates responsive image URLs based on the provided image name,
 * content hash, aspect ratios, and widths.
 * It uses the <picture> element to serve AVIF renditions produced by the content pipeline.
 *
 * Matrix:
 * | Aspect Ratios           | 0 = 1x1          | 1 = 4x3          | 2 = 16x9          | 3 = 21x9           | 4 = 3x4            |
 * | Responsive Widths       | 0 = 480px        | 1 = 960px        | 2 = 1280px        | 3 = 1920px         | 4 = 2560px         |
 * | Responsive Breakpoints  | xs               | sm               | md                | lg                 | xl                 |
 * | Resulting Image Example | hero-480x480-1x1-q80.abcdef12.avif | hero-960x720-4x3-q80.abcdef12.avif | hero-1280x720-16x9-q80.abcdef12.avif | hero-1920x1080-16x9-q80.abcdef12.avif | hero-2560x1440-16x9-q80.abcdef12.avif |
 */
const ASPECT_RATIOS = ['1x1', '4x3', '16x9', '21x9', '3x4'] as const;
const RESPONSIVE_WIDTHS = [480, 960, 1280, 1920, 2560] as const;
const RESPONSIVE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

type AspectRatio = (typeof ASPECT_RATIOS)[number];
type ResponsiveWidth = (typeof RESPONSIVE_WIDTHS)[number];

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, Record<ResponsiveWidth, [number, number]>> = {
    '1x1': {
        480: [480, 480],
        960: [960, 960],
        1280: [1280, 1280],
        1920: [1920, 1920],
        2560: [2560, 2560],
    },
    '4x3': {
        480: [480, 360],
        960: [960, 720],
        1280: [1280, 960],
        1920: [1920, 1440],
        2560: [2560, 1920],
    },
    '16x9': {
        480: [480, 270],
        960: [960, 540],
        1280: [1280, 720],
        1920: [1920, 1080],
        2560: [2560, 1440],
    },
    '21x9': {
        480: [480, 228],
        960: [960, 456],
        1280: [1280, 608],
        1920: [1920, 912],
        2560: [2560, 1216],
    },
    '3x4': {
        480: [360, 480],
        960: [720, 960],
        1280: [960, 1280],
        1920: [1440, 1920],
        2560: [1920, 2560],
    },
};

const DEFAULT_RATIO_INDEXES = [2, 2, 2, 2, 2] as const;
const DEFAULT_WIDTH_INDEXES = [0, 1, 2, 3, 4] as const;
const DEFAULT_SIZES = '(max-width: 768px) 100vw, 66vw';
const ZOOM_WIDTHS = '[4,4,4,4,4]';
const ZOOM_SIZES = '95vw';

export interface ImageResponsiveProps {
    imageName: string;
    alt: string;
    hash: string;
    ratiosStr?: string;
    widthsStr?: string;
    sizes?: string;
    className?: string;
    imgClassName?: string;
    loading?: 'lazy' | 'eager';
    /** When true, clicking the image opens a full-screen zoom lightbox. */
    zoomable?: boolean;
}

const stripExtension = (value = '') => {
    const [pathWithoutQuery] = String(value).split(/[?#]/);

    return pathWithoutQuery.replace(IMAGE_EXTENSION_REGEX, '');
};

const normalizeImageName = (value = '') => {
    const slug = stripExtension(value)
        .replace(/^\/+/, '')
        .replace(/^images\//, '')
        .split('/')
        .filter(Boolean)
        .pop();

    return slug || '';
};

const normalizeHash = (value = '') => {
    return String(value)
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 8)
        .toLowerCase();
};

const normalizeIndexes = (value: string | number[] | undefined, fallback: readonly number[]) => {
    if (Array.isArray(value) && value.length === 5) {
        return value;
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value) as unknown;

            if (Array.isArray(parsed) && parsed.length === 5) {
                return parsed as number[];
            }
        } catch {
            return [...fallback];
        }
    }

    return [...fallback];
};

const toImageUrl = (imageName: string, hash: string, ratio: AspectRatio, width: ResponsiveWidth, format: string) => {
    const [fileWidth, fileHeight] = ASPECT_RATIO_DIMENSIONS[ratio][width];
    const filename = `${imageName}-${fileWidth}x${fileHeight}-${ratio}-q${DEFAULT_QUALITY}.${hash}.${format}`;

    return `${IMAGE_BASE_URL}/${filename}`;
};

const buildSrcSetEntries = (imageName: string, hash: string, ratioIndexes: number[], widthIndexes: number[], format: string) => {
    return RESPONSIVE_KEYS.map((sizeKey, index) => {
        const ratio = ASPECT_RATIOS[ratioIndexes[index]];
        const width = RESPONSIVE_WIDTHS[widthIndexes[index]];
        const src = toImageUrl(imageName, hash, ratio, width, format);

        return {
            sizeKey,
            width,
            src,
            srcset: `${src} ${width}w`,
        };
    });
};

const createSrcSet = (imageName: string, hash: string, ratioIndexes: number[], widthIndexes: number[], format: string) => {
    return buildSrcSetEntries(imageName, hash, ratioIndexes, widthIndexes, format)
        .map((entry) => entry.srcset)
        .join(', ');
};

type PictureProps = {
    imageName: string;
    hash: string;
    alt: string;
    ratiosStr?: string;
    widthsStr?: string;
    sizes?: string;
    className?: string;
    imgClassName?: string;
    loading?: 'lazy' | 'eager';
};

function ResponsivePicture({
    imageName,
    alt,
    ratiosStr = '[2,2,2,2,2]',
    widthsStr = '[0,1,2,3,4]',
    hash,
    sizes = DEFAULT_SIZES,
    className = '',
    imgClassName = '',
    loading = 'lazy',
}: PictureProps) {
    const normalizedImageName = normalizeImageName(imageName);
    const normalizedHash = normalizeHash(hash);
    const ratioIndexes = normalizeIndexes(ratiosStr, DEFAULT_RATIO_INDEXES);
    const widthIndexes = normalizeIndexes(widthsStr, DEFAULT_WIDTH_INDEXES);
    const fallbackEntry = buildSrcSetEntries(normalizedImageName, normalizedHash, ratioIndexes, widthIndexes, FALLBACK_FORMAT)[0];

    if (!normalizedImageName || !normalizedHash) {
        return null;
    }

    return (
        <div className={className}>
            <picture>
                {ACCEPTED_FORMATS.map((format) => (
                    <source key={format} type={`image/${format}`} srcSet={createSrcSet(normalizedImageName, normalizedHash, ratioIndexes, widthIndexes, format)} sizes={sizes} />
                ))}
                <img
                    src={fallbackEntry.src}
                    srcSet={createSrcSet(normalizedImageName, normalizedHash, ratioIndexes, widthIndexes, FALLBACK_FORMAT)}
                    sizes={sizes}
                    alt={alt}
                    loading={loading}
                    decoding="async"
                    className={imgClassName}
                />
            </picture>
        </div>
    );
}

/**
 * Usage example:
 * <ImageResponsive
 *   imageName="hero-banner"
 *   alt="Developer workspace"
 *   ratiosStr="[2,2,2,2,2]"
 *   widthsStr="[0,1,2,3,4]"
 *   hash="a3f91c2b"
 * />
 *
 * Both examples resolve to responsive files like:
 * hero-banner-480x270-16x9-q80.a3f91c2b.avif,
 * hero-banner-960x540-16x9-q80.a3f91c2b.avif,
 * hero-banner-1280x720-16x9-q80.a3f91c2b.avif
 */
const ImageResponsive = ({
    imageName,
    alt,
    ratiosStr = '[2,2,2,2,2]',
    widthsStr = '[0,1,2,3,4]',
    hash,
    sizes = DEFAULT_SIZES,
    className = '',
    imgClassName = '',
    loading = 'lazy',
    zoomable = false,
}: ImageResponsiveProps) => {
    const normalizedImageName = normalizeImageName(imageName);
    const normalizedHash = normalizeHash(hash);
    const ratioIndexes = normalizeIndexes(ratiosStr, DEFAULT_RATIO_INDEXES);
    const zoomWidthIndexes = normalizeIndexes(ZOOM_WIDTHS, DEFAULT_WIDTH_INDEXES);

    const inlineImage = (
        <ResponsivePicture
            imageName={imageName}
            hash={hash}
            alt={alt}
            ratiosStr={ratiosStr}
            widthsStr={widthsStr}
            sizes={sizes}
            className={className}
            imgClassName={imgClassName}
            loading={loading}
        />
    );

    if (!zoomable || !normalizedImageName || !normalizedHash) {
        return inlineImage;
    }

    // SSR-safe zoom trigger: ImageZoomRoot (page island) listens for [data-image-zoom].
    // Needed because evaluate()'d MDX Content cannot use client:* directives.
    const zoomEntries = buildSrcSetEntries(normalizedImageName, normalizedHash, ratioIndexes, zoomWidthIndexes, FALLBACK_FORMAT);
    const zoomSrc = zoomEntries[zoomEntries.length - 1]?.src ?? zoomEntries[0]?.src;
    const zoomSrcSet = zoomEntries.map((entry) => entry.srcset).join(', ');
    const zoomLabel = alt ? `Zoom image: ${alt}` : 'Zoom image';

    if (!zoomSrc) {
        return inlineImage;
    }

    return (
        <button
            type="button"
            data-image-zoom
            data-zoom-src={zoomSrc}
            data-zoom-srcset={zoomSrcSet}
            data-zoom-sizes={ZOOM_SIZES}
            data-zoom-alt={alt}
            aria-label={zoomLabel}
            className="block w-full cursor-zoom-in touch-manipulation border-0 bg-transparent p-0 text-left"
        >
            {inlineImage}
        </button>
    );
};

export default ImageResponsive;
