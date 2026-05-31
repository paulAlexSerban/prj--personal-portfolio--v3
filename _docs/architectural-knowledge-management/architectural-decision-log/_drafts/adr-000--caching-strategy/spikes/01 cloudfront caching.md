
# 1. S3 Bucket Setup

* Bucket name: `my-site-bucket`
* Upload your static `/dist` output
* Enable **static website hosting** (optional if you only use CloudFront)
* Block public access **off**, but rely on CloudFront as the entry point

---

# 2. CloudFront Distribution

**Behaviors:**

| Path Pattern | Cache Policy | TTL    | Comment                              |
| ------------ | ------------ | ------ | ------------------------------------ |
| `/assets/*`  | Custom       | 1 year | JS, CSS, images (immutable)          |
| `/images/*`  | Custom       | 1 year | External pipeline images             |
| `/*.html`    | Custom       | 0-60s  | HTML pages (dynamic content refresh) |
| `/blog/*`    | Custom       | 0-60s  | Paginated or tag pages               |
| `/`          | Custom       | 0-60s  | Index page                           |

**Explanation:**

* **Immutable assets** get long TTL → never need invalidation
* **HTML** gets short TTL → CloudFront can fetch updated HTML after deploy
* **No ETag checks needed** → CloudFront serves cached content until TTL expires

---

# 3. Cache-Control Headers (S3)

Set headers on files at upload time.

### JS, CSS, images

```bash
aws s3 cp dist/assets s3://my-site-bucket/assets/ \
  --recursive \
  --cache-control "public, max-age=31536000, immutable"
```

### HTML (posts, index, tag pages)

```bash
aws s3 cp dist s3://my-site-bucket/ \
  --recursive \
  --exclude "assets/*" \
  --cache-control "public, max-age=0, must-revalidate"
```

---

# 4. Versioning / Hashing

Astro outputs hashed assets like:

```
app.abc123.js
main.ef456.css
```

* No runtime validation
* Cache busting is automatic
* You can deploy without touching CloudFront for assets

---

# 5. Deployment + Invalidation

1. **Sync new build to S3**:

```bash
aws s3 sync dist/ s3://my-site-bucket --delete
```

2. **Invalidate only HTML files** (assets don’t need invalidation):

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_CF_ID \
  --paths "/*.html" "/blog/*"
```

* Keeps invalidation cost and time low
* Assets stay cached → fast delivery

---

# 6. Optional: CloudFront Custom Cache Policy

* Enable **Forward Headers** → None
* Enable **Query String Forwarding** → None (unless you need search)
* Enable **Compress Objects Automatically** → Yes
* Use **Origin Shield** (optional, for global scaling)

---

# 7. Why This Is Optimal

* **Immutable assets** → 1-year cache, no ETag needed
* **HTML short TTL + invalidation** → ensures latest content is delivered
* **No unnecessary headers** → reduces overhead
* **Scales linearly** → 1200+ posts and thousands of assets

---

# 8. Extra Tips

1. **Tag pages**: paginate them, generate static HTML → same caching rules as posts
2. **Images**: external pipeline → use `Cache-Control: public, max-age=31536000, immutable`
3. **Builds**: 1–3 minutes → CloudFront serves everything instantly after deploy


