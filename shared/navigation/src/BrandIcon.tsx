import { socialIcons, type SocialIconName } from './socialIcons.ts';

interface Props {
    name: SocialIconName;
    className?: string;
}

export function BrandIcon({ name, className }: Props) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" role="img" aria-hidden="true" className={className}>
            <path d={socialIcons[name]} />
        </svg>
    );
}
