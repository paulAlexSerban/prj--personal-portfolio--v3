import { useMemo, useState } from 'react';
import type { ProjectRow, TagRow } from '@prj--personal-portfolio--v3/shared--db-schema';
import { assetUrl, siteUrls } from '../lib/urls.ts';

export interface ProjectWithTags {
    project: ProjectRow;
    tags: TagRow[];
}

interface Props {
    featured: ProjectWithTags[];
    archive: ProjectWithTags[];
}

export function TechFilter({ featured, archive }: Props) {
    const allTags = useMemo(() => {
        const set = new Set<string>();
        for (const { tags } of [...featured, ...archive]) {
            for (const t of tags) set.add(t.slug);
        }
        return [...set].sort();
    }, [featured, archive]);

    const tagNames = useMemo(() => {
        const map = new Map<string, string>();
        for (const { tags } of [...featured, ...archive]) {
            for (const t of tags) map.set(t.slug, t.name);
        }
        return map;
    }, [featured, archive]);

    const [active, setActive] = useState<string | null>(null);

    const filter = (items: ProjectWithTags[]) => {
        if (!active) return items;
        return items.filter(({ tags }) => tags.some((t) => t.slug === active));
    };

    const filteredFeatured = filter(featured);
    const filteredArchive = filter(archive);

    return (
        <div>
            {allTags.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by technology">
                    <button
                        type="button"
                        onClick={() => setActive(null)}
                        aria-pressed={active === null}
                        className={`cursor-pointer border border-ink px-3 py-1 text-[11px] smallcaps transition-colors ${active === null ? 'bg-ink text-aged' : 'bg-transparent text-ink hover:bg-highlight'}`}
                    >
                        All
                    </button>
                    {allTags.map((slug) => (
                        <button
                            key={slug}
                            type="button"
                            onClick={() => setActive(slug)}
                            aria-pressed={active === slug}
                            className={`cursor-pointer border border-ink px-3 py-1 text-[11px] smallcaps transition-colors ${active === slug ? 'bg-ink text-aged' : 'bg-transparent text-ink hover:bg-highlight'}`}
                        >
                            {tagNames.get(slug) ?? slug}
                        </button>
                    ))}
                </div>
            )}
            {filteredFeatured.length > 0 && (
                <section className="mb-12">
                    <h2 className="mb-6 font-display text-3xl font-bold">Featured</h2>
                    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-8 p-0">
                        {filteredFeatured.map(({ project, tags }) => (
                            <li key={project.slug}>
                                <ProjectCardInner project={project} tags={tags} featured />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {filteredArchive.length > 0 && (
                <section>
                    <h2 className="mb-6 font-display text-3xl font-bold">Archive</h2>
                    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-8 p-0">
                        {filteredArchive.map(({ project, tags }) => (
                            <li key={project.slug}>
                                <ProjectCardInner project={project} tags={tags} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {filteredFeatured.length === 0 && filteredArchive.length === 0 && <p className="italic text-slate-ink">No projects match this filter.</p>}
        </div>
    );
}

function ProjectCardInner({ project, tags, featured = false }: { project: ProjectRow; tags: TagRow[]; featured?: boolean }) {
    const href = siteUrls.portfolioProject(project.slug);
    const cover = project.cover_image ?? assetUrl('placeholder-cover.png');
    return (
        <article className="card-ruled flex flex-col">
            <a href={href} className="mb-3 block overflow-hidden border border-rule">
                <img src={cover} alt="" loading="lazy" className="aspect-video w-full object-cover" />
            </a>
            {featured && <p className="kicker mb-1 text-[10px]">Featured</p>}
            <h3 className="font-display text-xl font-bold leading-tight">
                <a href={href} className="text-ink no-underline hover:underline">
                    {project.title}
                </a>
            </h3>
            {project.problem && <p className="mt-2 text-sm text-charcoal line-clamp-2">{project.problem}</p>}
            <ul className="mt-3 flex list-none flex-wrap gap-[0.4rem] p-0">
                {tags.slice(0, 4).map((t) => (
                    <li key={t.slug}>
                        <span className="inline-block border border-rule bg-highlight px-2 py-[0.15rem] text-[0.75rem] text-ink">#{t.name.toLowerCase()}</span>
                    </li>
                ))}
            </ul>
            <a href={href} className="kicker mt-4 inline-block w-fit text-[10px] hover:underline">
                Case study &rarr;
            </a>
        </article>
    );
}
