interface FigureProps {
    src: string;
    alt?: string;
    caption?: string;
}

const Figure = ({ src, alt = '', caption = '' }: FigureProps) => {
    return (
        <figure className="mdx-figure">
            <img src={src} alt={alt} />
            {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
    );
};

export default Figure;
