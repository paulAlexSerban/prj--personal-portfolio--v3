import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@prj--personal-portfolio--v3/shared--ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@prj--personal-portfolio--v3/shared--ui/sheet';

export interface MobileNavLink {
    label: string;
    href: string;
    active?: boolean;
}

interface Props {
    links: MobileNavLink[];
}

export function MobileNav({ links }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Open navigation menu" className="rounded-none border-ink md:hidden">
                    <Menu className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-[3px] border-ink">
                <SheetHeader>
                    <SheetTitle className="kicker text-left text-sm smallcaps">Navigation</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col smallcaps" aria-label="Primary mobile">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            aria-current={link.active ? 'page' : undefined}
                            onClick={() => setOpen(false)}
                            {...(link.href.startsWith('http') ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
                            className="border-b border-rule py-3 text-base text-ink no-underline hover:underline aria-[current=page]:font-bold aria-[current=page]:underline"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
