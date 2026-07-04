# Quiz → Blog crosslinks

## Intent

Question sets in the quiz web app are keyed by blog post slug (`questions.post_slug` / `ExportedQuestion.postSlug`). Users should be able to jump from quiz surfaces back to the source blog post where the content was authored.

## URL formula

Blog detail URLs are type-dependent:

| DB `posts.type` | Path segment | Example |
| --- | --- | --- |
| `post` | `post` | `https://blog.paulserban.eu/post/{slug}/` |
| `snippet` | `snippet` | `https://blog.paulserban.eu/snippet/{slug}/` |
| `book-note` | `booknote` | `https://blog.paulserban.eu/booknote/{slug}/` |

Helper in [`frontend/apps/quiz-web-app/src/lib/urls.ts`](../../frontend/apps/quiz-web-app/src/lib/urls.ts):

```ts
blogPostUrl(postType, slug)
```

Post type comes from `posts.json` (`ExportedPostEntry.type`). Question slug alone is not enough.

## Surfaces

| Surface | Link label | How URL is resolved |
| --- | --- | --- |
| Set detail (`/sets/$postSlug`) | Read post on blog ↗ | `meta.type` + `meta.slug` from loaded post index |
| Question preview drawer | Read source post ↗ | Route passes `blogPostHref` from post type lookup |
| Study session (`StudyCard`) | Read source post ↗ | `getPostBlogHref(question.postSlug)` via `posts.json` type map |

Routes that show question previews or study sessions load `posts.json` (or already have post meta) to build type-aware URLs.

## Shared UI props

Presentation blocks stay pure; the quiz app supplies URLs:

- **`QuestionPreview`**: optional `blogPostHref?: string` — ghost-stamp link in the actions row
- **`StudyCard`**: optional `blogPostHref?: string` — inline link in the read-only footer

Containers:

- **`QuestionPreviewDrawer`**: forwards `blogPostHref` to `QuestionPreview`
- **`StudySession`**: accepts `getPostBlogHref?: (postSlug) => string | undefined` and passes the resolved URL to `StudyCard` for the current question

## Related docs

- [`adr-000--cross-surface-foreign-key.md`](../architectural-knowledge-management/architectural-decision-log/_drafts/adr-000--cross-surface-foreign-key.md) — `post_slug` from question filename
- [`blog_site_implementation.md`](./blog_site_implementation.md) — blog routing and quiz widget slot on post pages
- [`quiz-web-app-refactor-plan.md`](./quiz-web-app-refactor-plan.md) — deck = post, card = question model
