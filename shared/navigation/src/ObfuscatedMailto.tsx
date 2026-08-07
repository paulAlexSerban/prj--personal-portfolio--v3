import type { MouseEvent, TouchEvent } from 'react';
import { CONTACT_EMAIL, CONTACT_MAILTO, decodeFromBase64, encodeToBase64 } from './contact.ts';

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
            className={className}
            onMouseEnter={handleReveal}
            onMouseLeave={handleConceal}
            onTouchStart={handleReveal}
            onTouchEnd={handleConceal}
        >
            {CONTACT_EMAIL}
        </a>
    );
}
