import type { SiteId, SiteTab } from './types.ts';
import { externalLinkAttrs } from './urls.ts';

interface Props {
    activeSite: SiteId;
    tabs: SiteTab[];
}

export function SiteSwitcher({ activeSite, tabs }: Props) {
    return (
        <nav aria-label="Site switcher" className="inline-flex border border-ink text-[10px] smallcaps">
            {tabs.map((tab, index) => (
                <div key={tab.id} className={`flex ${index > 0 ? 'border-l border-ink' : ''}`}>
                    {tab.id === activeSite ? (
                        <span
                            aria-current="page"
                            className="bg-ink px-2 py-0.5 font-bold text-aged"
                        >
                            {tab.label}
                        </span>
                    ) : (
                        <a
                            href={tab.href}
                            className="px-2 py-0.5 text-slate-ink no-underline transition-colors hover:bg-newsprint hover:underline"
                            {...externalLinkAttrs(tab.href)}
                        >
                            {tab.label}
                        </a>
                    )}
                </div>
            ))}
        </nav>
    );
}
