import type { BlogPostFilterItem } from "@prj--personal-portfolio--v3/shared--ui/post-filters";

const typeLabel: Record<BlogPostFilterItem["type"], string> = {
  post: "Post",
  snippet: "Snippet",
  "book-note": "Book Note",
};

function detailHref(type: BlogPostFilterItem["type"], slug: string): string {
  if (type === "book-note") {
    return `/booknote/${slug}/`;
  }
  return `/${type}/${slug}/`;
}

interface Props {
  post: BlogPostFilterItem;
}

/**
 * React mirror of PostCard.astro for use inside the interactive listing island.
 * Structure and classes intentionally match PostCard.astro + TagList.astro so the
 * static (hub) and interactive (listing) cards render identically.
 */
export function PostCardReact({ post }: Props) {
  const href = detailHref(post.type, post.slug);
  const meta = [typeLabel[post.type], post.date].filter(Boolean).join(" · ");
  const tags = post.tags.slice(0, 5);

  return (
    <article className="card-ruled border-b border-rule pb-4">
      <p className="kicker mb-1 text-[10px]">{meta}</p>
      <h2 className="font-display text-2xl font-bold leading-tight">
        <a href={href} className="text-ink no-underline hover:underline">
          {post.title}
        </a>
      </h2>
      {post.excerpt && (
        <p className="mt-2 text-base text-charcoal line-clamp-2">{post.excerpt}</p>
      )}
      <div className="rule-thin my-4" />
      {tags.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-[0.4rem] p-0">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <a
                href={`/tags/${tag.slug}/`}
                className="inline-block border border-rule bg-highlight px-2 py-[0.15rem] text-[0.8rem] text-ink no-underline hover:border-ink"
              >
                #{tag.name.toLowerCase()}
              </a>
            </li>
          ))}
        </ul>
      )}
      <a href={href} className="kicker mt-3 inline-block text-[10px] hover:underline">
        Read &rarr;
      </a>
    </article>
  );
}
