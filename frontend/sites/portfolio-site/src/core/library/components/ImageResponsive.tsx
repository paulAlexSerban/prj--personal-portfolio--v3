import SharedImageResponsive, { type ImageResponsiveProps } from '@prj--personal-portfolio--v3/shared--ui/image-responsive';

/** Portfolio MDX images are zoomable by default. */
export default function ImageResponsive(props: ImageResponsiveProps) {
    return <SharedImageResponsive {...props} zoomable={props.zoomable ?? true} />;
}
