---
name: Blog Grid Newspaper Layout
overview: "Two changes: remove the placeholder cover image fallback so cards with no cover show no image at all, and switch the post grid from a CSS auto-fill grid (same-height rows) to a CSS multi-column newspaper layout where cards stack independently per column."
todos:
  - id: no-cover-astro
    content: "PostCard.astro: conditionally render cover image only when cover_image is present, remove placeholder constant and import"
    status: completed
  - id: no-cover-react
    content: "PostCardReact.tsx: conditionally render cover image only when post.cover is present, remove placeholder constant and import"
    status: completed
  - id: grid-index
    content: "pages/index.astro: switch <ul> from CSS grid to CSS columns (columns-1 sm:columns-2 lg:columns-3), add break-inside-avoid mb-5 to <li>"
    status: completed
  - id: grid-tags
    content: "pages/tags/[tag].astro: same CSS columns change"
    status: completed
  - id: grid-island
    content: "PostListIsland.tsx: same CSS columns change on the <ul> and each <li>"
    status: completed
isProject: false
---

# Blog Grid: Newspaper Layout + No-Cover Fallback

## Goal

1. Cards with no `cover_image` render no image block at all (no placeholder).
2. Post lists use a newspaper column layout: cards stack vertically per column, independent of adjacent columns — matching the sketch.

## Layout: CSS multi-column (newspaper columns)

The sketch shows 3 independent vertical columns where cards flow top-to-bottom per column without being locked to shared row boundaries. This is exactly what CSS multi-column layout (`columns`) produces.

**Current grid pattern (all list pages):**
```html
<ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-5 p-0">
  <li>...</li>
```

**New pattern:**
```html
<ul class="m-0 list-none columns-1 sm:columns-2 lg:columns-3 gap-5 p-0">
  <li class="break-inside-avoid mb-5">...</li>
```

- `columns-1 sm:columns-2 lg:columns-3` — 1 col mobile, 2 col tablet, 3 col desktop
- `gap-5` — column gap
- `break-inside-avoid mb-5` on `<li>` — prevent card from splitting across columns; vertical spacing between cards

## Change 1: Remove placeholder cover

`HeroBanner.astro` already does this correctly with `{cover && (...)}`. Apply the same pattern to both PostCard variants.

### [`PostCard.astro`](frontend/sites/blog-site/src/core/library/modules/PostCard/PostCard.astro)

Replace the unconditional `CoverImage` block:
```astro
<!-- before -->
<a href={href} class="mb-3 block overflow-hidden">
    <CoverImage cover={post.cover_image} placeholder={PLACEHOLDER_COVER} ... />
</a>

<!-- after -->
{post.cover_image && (
    <a href={href} class="mb-3 block overflow-hidden">
        <CoverImage cover={post.cover_image} placeholder={PLACEHOLDER_COVER} ... />
    </a>
)}
```

Also remove the now-unused `PLACEHOLDER_COVER` constant and the `CoverImage` import.

### [`PostCardReact.tsx`](frontend/sites/blog-site/src/core/library/modules/PostCard/PostCardReact.tsx)

Same conditional:
```tsx
// before
<a href={href} className="mb-3 block overflow-hidden">
    <CoverImage cover={post.cover} placeholder={PLACEHOLDER_COVER} ... />
</a>

// after
{post.cover && (
    <a href={href} className="mb-3 block overflow-hidden">
        <CoverImage cover={post.cover} placeholder={PLACEHOLDER_COVER} ... />
    </a>
)}
```

Remove `PLACEHOLDER_COVER` constant and `CoverImage` import.

## Change 2: Switch to newspaper columns

### [`pages/index.astro`](frontend/sites/blog-site/src/pages/index.astro) (hub/pinned)

Change `<ul>` class from `grid grid-cols-[...]` to `columns-1 sm:columns-2 lg:columns-3 gap-5`, and add `break-inside-avoid mb-5` to each `<li>`.

### [`pages/tags/[tag].astro`](frontend/sites/blog-site/src/pages/tags/[tag].astro)

Same `<ul>` and `<li>` class change as above.

### [`PostListIsland.tsx`](frontend/sites/blog-site/src/core/library/widgets/PostListIsland.tsx)

Same `<ul>` class change. Each `<li>` wrapping `PostCardReact` gets `break-inside-avoid mb-5`.

## Files changed (5 total)

- `frontend/sites/blog-site/src/core/library/modules/PostCard/PostCard.astro`
- `frontend/sites/blog-site/src/core/library/modules/PostCard/PostCardReact.tsx`
- `frontend/sites/blog-site/src/pages/index.astro`
- `frontend/sites/blog-site/src/pages/tags/[tag].astro`
- `frontend/sites/blog-site/src/core/library/widgets/PostListIsland.tsx`
