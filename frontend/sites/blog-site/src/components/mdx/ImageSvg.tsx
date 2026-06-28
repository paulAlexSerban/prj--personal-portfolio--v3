interface ImageSvgProps {
    svgName: string;
    alt?: string;
}

const ImageSvg = ({ svgName, alt = '' }: ImageSvgProps) => {
    return (
        <figure className="mdx-figure">
            <img src={`https://paulserban.eu/assets/diagrams/${svgName}.svg`} alt={alt} loading="lazy" />
        </figure>
    );
};

export default ImageSvg;
