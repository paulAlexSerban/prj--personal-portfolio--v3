import { BrandIcon } from './BrandIcon.tsx';
import { GITHUB_URL, LINKEDIN_URL } from './contact.ts';
import { ObfuscatedMailto } from './ObfuscatedMailto.tsx';

interface Props {
    className?: string;
    linkClassName?: string;
}

export function SocialLinks({ className, linkClassName }: Props) {
    const linkClass = linkClassName ?? 'inline-flex items-center text-ink no-underline hover:opacity-70';

    return (
        <div className={['inline-flex shrink-0 flex-nowrap items-center gap-2', className].filter(Boolean).join(' ')}>
            <ObfuscatedMailto className={linkClass} />
            <a href={GITHUB_URL} aria-label="GitHub profile" title="GitHub" className={linkClass} rel="noopener noreferrer" target="_blank">
                <BrandIcon name="github" className="size-[1em]" />
            </a>
            <a href={LINKEDIN_URL} aria-label="LinkedIn profile" title="LinkedIn" className={linkClass} rel="noopener noreferrer" target="_blank">
                <BrandIcon name="linkedin" className="size-[1em]" />
            </a>
        </div>
    );
}
