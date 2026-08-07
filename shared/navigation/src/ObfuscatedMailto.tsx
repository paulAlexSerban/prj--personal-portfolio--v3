import type { MouseEvent, TouchEvent } from 'react';
import { Mail } from 'lucide-react';
import { CONTACT_MAILTO, decodeFromBase64, encodeToBase64 } from './contact.ts';

interface Props {
    className?: string;
}

function resolveAnchor(target: EventTarget | null): HTMLAnchorElement | null {
    if (!(target instanceof Element)) return null;
    return target instanceof HTMLAnchorElement ? target : target.closest('a');
}

export function ObfuscatedMailto({ className }: Props) {
    const encodedHref = encodeToBase64(CONTACT_MAILTO);

    const handleReveal = (ev: MouseEvent | TouchEvent) => {
        const link = resolveAnchor(ev.target);
        if (!link) return;
        link.href = decodeFromBase64(link.getAttribute('href') ?? '');
    };

    const handleConceal = (ev: MouseEvent | TouchEvent) => {
        const link = resolveAnchor(ev.target);
        if (!link) return;
        link.href = encodeToBase64(link.getAttribute('href') ?? '');
    };

    return (
        <a
            href={encodedHref}
            aria-label="Email Paul Serban"
            title="Email"
            className={className}
            onMouseEnter={handleReveal}
            onMouseLeave={handleConceal}
            onTouchStart={handleReveal}
            onTouchEnd={handleConceal}
        >
            <Mail aria-hidden="true" className="size-[1em]" strokeWidth={1.75} />
        </a>
    );
}
