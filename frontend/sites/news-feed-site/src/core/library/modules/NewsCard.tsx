import { categoryLabel, formatNewsDate, isPublishedToday } from '@/lib/queries/news.ts';
import { siteUrls } from '@/lib/urls.ts';
import type { NewsItem } from '@/lib/loadNews.ts';

interface Props {
    item: NewsItem;
    showCategory?: boolean;
}

export function NewsCard({ item, showCategory = true }: Props) {
    const isToday = isPublishedToday(item.publishedAt);
    const dateLabel = formatNewsDate(item.publishedAt);

    return (
        <article className="card-ruled border-b border-rule pb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
                {isToday && (
                    <span className="stamp text-[10px] px-2 py-0.5" aria-label="Published today">
                        New today
                    </span>
                )}
                {showCategory && (
                    <a
                        href={siteUrls.category(item.category)}
                        className="kicker inline-block border border-ink px-2 py-0.5 text-[10px] text-ink no-underline hover:bg-ink hover:text-aged"
                    >
                        {categoryLabel(item.category)}
                    </a>
                )}
                <p className="kicker mb-0 text-[10px]">
                    {item.source} · {dateLabel}
                </p>
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight">
                <a href={item.link} className="text-ink no-underline hover:underline" rel="noopener noreferrer" target="_blank">
                    {item.title}
                </a>
            </h2>
            {item.summary && <p className="mt-2 text-base text-charcoal line-clamp-2">{item.summary}</p>}
            <div className="rule-thin my-4"></div>
            <a href={item.link} className="kicker mt-1 inline-flex items-center gap-1 text-sm hover:underline" rel="noopener noreferrer" target="_blank">
                Read original <span aria-hidden="true">↗</span>
            </a>
        </article>
    );
}
