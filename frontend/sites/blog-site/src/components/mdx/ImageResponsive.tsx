interface ImageResponsiveProps {
    ratiosStr?: string;
    widthsStr?: string;
    imageName: string;
    hash?: string;
    alt?: string;
}

const ImageResponsive = ({ imageName, hash, alt = '' }: ImageResponsiveProps) => {
    const base = `https://paulserban.eu/assets/diagrams/${imageName}.svg`;
    const src = hash ? `${base}?v=${hash}` : base;

    return (
        <figure className="mdx-figure">
            <img src={src} alt={alt} loading="lazy" />
        </figure>
    );
};

export default ImageResponsive;
