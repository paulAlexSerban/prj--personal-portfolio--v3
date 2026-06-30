import { useEffect, useRef, useState } from 'react';
import type { NavLink } from './types.ts';
import { externalLinkAttrs } from './urls.ts';

interface Props {
    label: string;
    links: NavLink[];
    /** Open above the trigger — use when the dropdown would overlap content below. */
    placement?: 'top' | 'bottom';
}

export function NavDropdown({ label, links, placement = 'bottom' }: Props) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const opensUp = placement === 'top';

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(event: PointerEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative z-30" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                className={`cursor-pointer border-0 bg-transparent p-0 text-[11px] smallcaps text-ink hover:underline ${open ? 'font-bold underline' : ''}`}
            >
                {label}
            </button>
            <div
                aria-hidden={!open}
                className={`absolute right-0 z-50 min-w-[9rem] transition-all duration-200 ease-out ${
                    opensUp ? 'bottom-full origin-bottom-right pb-1' : 'top-full origin-top-right pt-1'
                } ${
                    open
                        ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                        : opensUp
                          ? 'pointer-events-none translate-y-1 scale-95 opacity-0'
                          : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
                }`}
            >
                <ul className="overflow-hidden border-2 border-ink bg-[var(--aged-white)] py-1 shadow-[4px_4px_0_0_var(--color-ink)]">
                    {links.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                aria-current={link.active ? 'page' : undefined}
                                className="block px-3 py-2 text-[11px] smallcaps text-ink no-underline transition-colors hover:bg-newsprint hover:underline aria-[current=page]:bg-newsprint aria-[current=page]:font-bold"
                                {...externalLinkAttrs(link.href)}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
