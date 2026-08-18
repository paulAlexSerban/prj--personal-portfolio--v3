import { useMemo, useState } from 'react';
import type { ProjectRow, TagRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import { CoverImage } from '@prj--personal-portfolio--v3/shared--ui/cover-image-ui';

import { projectAxisBadge } from '@/lib/project-axis.ts';
import { assetUrl, siteUrls } from '@/lib/urls.ts';

export interface ProjectWithTags {
    project: ProjectRow;
    tags: TagRow[];
}

type MaturityFilter = 'all' | 'shipped' | 'early';

interface Props {
    shipped: ProjectWithTags[];
    early: ProjectWithTags[];
}

const MATURITY_FILTERS: { id: MaturityFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'early', label: 'Early-stage' },
];

export function TechFilter({ shipped, early }: Props) {
    const allTags = useMemo(() => {
        const set = new Set<string>();
        for (const { tags } of [...shipped, ...early]) {
            for (const t of tags) set.add(t.slug);
        }
        return [...set].sort();
    }, [shipped, early]);

    const tagNames = useMemo(() => {
        const map = new Map<string, string>();
        for (const { tags } of [...shipped, ...early]) {
            for (const t of tags) map.set(t.slug, t.name);
        }
        return map;
    }, [shipped, early]);

    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [maturity, setMaturity] = useState<MaturityFilter>('all');

    const filterByTag = (items: ProjectWithTags[]) => {
        if (!activeTag) return items;
        return items.filter(({ tags }) => tags.some((t) => t.slug === activeTag));
    };

    const filteredShipped = maturity === 'early' ? [] : filterByTag(shipped);
    const filteredEarly = maturity === 'shipped' ? [] : filterByTag(early);

    return (
        <div>
            <div className="mb-8 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by maturity">
                    {MATURITY_FILTERS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setMaturity(id)}
                            aria-pressed={maturity === id}
                            className={`cursor-pointer border border-ink px-3 py-1 text-[11px] smallcaps transition-colors ${maturity === id ? 'bg-ink text-aged' : 'bg-transparent text-ink hover:bg-highlight'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by technology">
                        <button
                            type="button"
                            onClick={() => setActiveTag(null)}
                            aria-pressed={activeTag === null}
                            className={`cursor-pointer border border-ink px-3 py-1 text-[11px] smallcaps transition-colors ${activeTag === null ? 'bg-ink text-aged' : 'bg-transparent text-ink hover:bg-highlight'}`}
                        >
                            All tech
                        </button>
                        {allTags.slice(0, 100).map((slug) => (
                            <button
                                key={slug}
                                type="button"
                                onClick={() => setActiveTag(slug)}
                                aria-pressed={activeTag === slug}
                                className={`cursor-pointer border border-ink px-3 py-1 text-[11px] smallcaps transition-colors ${activeTag === slug ? 'bg-ink text-aged' : 'bg-transparent text-ink hover:bg-highlight'}`}
                            >
                                {tagNames.get(slug) ?? slug}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {filteredShipped.length > 0 && (
                <section className="mb-12">
                    <h2 className="mb-6 font-display text-3xl font-bold">Shipped</h2>
                    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-8 p-0">
                        {filteredShipped.map(({ project, tags }) => (
                            <li key={project.slug}>
                                <ProjectCardInner project={project} tags={tags} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {filteredEarly.length > 0 && (
                <section>
                    <h2 className="mb-6 font-display text-3xl font-bold">Early-stage & concepts</h2>
                    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-8 p-0">
                        {filteredEarly.map(({ project, tags }) => (
                            <li key={project.slug}>
                                <ProjectCardInner project={project} tags={tags} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {filteredShipped.length === 0 && filteredEarly.length === 0 && (
                <p className="italic text-slate-ink">No projects match this filter.</p>
            )}
        </div>
    );
}

function ProjectCardInner({ project, tags }: { project: ProjectRow; tags: TagRow[] }) {
    const href = siteUrls.portfolioProject(project.slug);
    return (
        <article className="card-ruled flex flex-col">
            <a href={href} className="group mb-3 block overflow-hidden">
                <CoverImage
                    cover={project.cover}
                    placeholder={assetUrl('placeholder-cover.png')}
                    alt={project.title}
                    sizes="card"
                    imgClassName="post-card-cover-img aspect-video w-full object-cover"
                />
            </a>
            <h3 className="font-display text-xl font-bold leading-tight">
                <a href={href} className="text-ink no-underline hover:underline">
                    {project.title}
                </a>
            </h3>
            <p className="kicker mt-1 text-[12px]">{projectAxisBadge(project)}</p>
            {project.problem && <p className="mt-2 text-sm text-charcoal line-clamp-2">{project.problem}</p>}
            <ul className="mt-3 flex list-none flex-wrap gap-[0.4rem] p-0">
                {tags.slice(0, 4).map((t) => (
                    <li key={t.slug}>
                        <span className="inline-block bg-highlight px-2 py-[0.15rem] text-[0.75rem] text-ink">#{t.name.toLowerCase()}</span>
                    </li>
                ))}
            </ul>
            <a href={href} className="kicker mt-4 inline-block w-fit text-sm hover:underline">
                Case study &rarr;
            </a>
        </article>
    );
}
