import type { SiteId, SiteTab } from './types.ts';
import { externalLinkAttrs } from './urls.ts';

interface Props {
    activeSite: SiteId;
    tabs: SiteTab[];
}

export function FooterSiteLinks({ activeSite, tabs }: Props) {
    const otherSites = tabs.filter((tab) => tab.id !== activeSite);

    return (
        <p className="text-xs text-slate-ink">
            Other projects:{' '}
            {otherSites.map((tab, index) => (
                <span key={tab.id}>
                    {index > 0 && ' · '}
                    <a href={tab.href} className="text-slate-ink no-underline hover:underline" {...externalLinkAttrs(tab.href)}>
                        {tab.label}
                    </a>
                </span>
            ))}
        </p>
    );
}
