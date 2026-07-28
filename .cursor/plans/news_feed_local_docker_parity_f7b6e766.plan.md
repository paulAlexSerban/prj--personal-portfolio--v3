---
name: News feed local Docker parity
overview: 'Give news-feed-site the same local Docker/Traefik dev experience as portfolio, blog, and quiz: a thin local.Dockerfile, a Compose service with Traefik labels on https://local.news-feed.paulserban.eu, cross-app URL env vars, mkcert SAN coverage, and matching doc/README updates.'
todos:
    - id: local-dockerfile
      content: Add frontend/sites/news-feed-site/local.Dockerfile (thin, port 4321)
      status: completed
    - id: compose-service
      content: Add news service to docker-compose.local.yml with Traefik labels + DB volume; add PUBLIC_NEWS_URL/VITE_NEWS_URL to portfolio/blog/quiz services
      status: completed
    - id: makefile-certs
      content: Add local.news-feed.paulserban.eu to makefile certs target and compose_build service list
      status: completed
    - id: docs-update
      content: Update local-dev-setup--macos.md, --debian.md, and root README.md with the news URL, /etc/hosts entry, and diagram line
      status: completed
    - id: verify
      content: Build news image, validate compose config, and smoke-test the full stack with make compose_up
      status: completed
isProject: false
---

## Context

The local dev stack (`infrastructure/local/docker-compose.local.yml` + Traefik + mkcert) currently only knows about portfolio, blog, and quiz:

- Each Astro/Vite app has a thin [`local.Dockerfile`](frontend/sites/blog-site/local.Dockerfile) that inherits from the shared [`local.base.Dockerfile`](local.base.Dockerfile) (which already `COPY frontend ./frontend` wholesale, so `news-feed-site` sources are already inside the base image — no base image change needed).
- [`infrastructure/local/docker-compose.local.yml`](infrastructure/local/docker-compose.local.yml) defines one service per app with Traefik labels routing `local.<subdomain>.paulserban.eu` to container port `4321` (Astro) or `5180` (Vite), and cross-app `PUBLIC_*`/`VITE_*` URL env vars so the sites link to each other's **local** URLs instead of falling back to production.
- `news-feed-site` has none of this: no `local.Dockerfile`, no Compose service, no Traefik route, and the other three apps don't pass a `PUBLIC_NEWS_URL`/`VITE_NEWS_URL` locally (they already accept it in code from the earlier session, they just don't get it set in Compose).
- mkcert's local CA cert (`make certs`) only lists `local.paulserban.eu local.blog.paulserban.eu local.quiz.paulserban.eu` as SANs, so a new local subdomain needs a regenerated cert.

Target local URL, following the `local.<prod-subdomain>` convention already used for blog/quiz: **`https://local.news-feed.paulserban.eu`** (mirrors production `news-feed.paulserban.eu`).

## Changes

### 1. `frontend/sites/news-feed-site/local.Dockerfile` (new)

Same thin pattern as [`frontend/sites/blog-site/local.Dockerfile`](frontend/sites/blog-site/local.Dockerfile), just swapping the package filter:

```dockerfile
ARG LOCAL_BASE_IMAGE=prj-personal-portfolio-v3-local-base:latest
FROM ${LOCAL_BASE_IMAGE}

EXPOSE 4321

CMD ["pnpm", "--filter", "@prj--personal-portfolio--v3/frontend--news-feed-site", "exec", "astro", "dev", "--host", "0.0.0.0", "--port", "4321"]
```

### 2. `infrastructure/local/docker-compose.local.yml` — add `news` service + wire cross-links

New service block (mirrors `blog`, since news-feed-site also reads `content.db`):

```yaml
news:
    build:
        context: ../..
        dockerfile: frontend/sites/news-feed-site/local.Dockerfile
        args:
            LOCAL_BASE_IMAGE: prj-personal-portfolio-v3-local-base:latest
    container_name: news-local
    restart: unless-stopped
    environment:
        ASTRO_SITE: https://local.news-feed.paulserban.eu
        ASTRO_HMR_HOST: local.news-feed.paulserban.eu
        ASTRO_HMR_CLIENT_PORT: '443'
        ASTRO_HMR_PROTOCOL: wss
        DATABASE_PATH: /app/database/output/content.db
        PUBLIC_PORTFOLIO_URL: https://local.paulserban.eu/
        PUBLIC_BLOG_URL: https://local.blog.paulserban.eu/
        PUBLIC_QUIZ_URL: https://local.quiz.paulserban.eu/
    volumes:
        - ../../database/output:/app/database/output
    networks:
        - local
    labels:
        - traefik.enable=true
        - traefik.docker.network=paulserban-local
        - traefik.http.routers.news.rule=Host(`local.news-feed.paulserban.eu`)
        - traefik.http.routers.news.entrypoints=websecure
        - traefik.http.routers.news.tls=true
        - traefik.http.services.news.loadbalancer.server.port=4321
```

Also add the reverse links so portfolio/blog/quiz point at the new local news site instead of falling back to the production URL (`urls.ts` in each already reads these env vars — added in the earlier session, just unused in Compose):

- `portfolio` service: add `PUBLIC_NEWS_URL: https://local.news-feed.paulserban.eu/`
- `blog` service: add `PUBLIC_NEWS_URL: https://local.news-feed.paulserban.eu/`
- `quiz` service: add `VITE_NEWS_URL: https://local.news-feed.paulserban.eu/`

### 3. `makefile` — extend mkcert SAN list

```make
certs:
	mkcert -install
	mkcert -cert-file infrastructure/local/traefik/certs/local.pem \
		-key-file  infrastructure/local/traefik/certs/local-key.pem \
		local.paulserban.eu local.blog.paulserban.eu local.quiz.paulserban.eu local.news-feed.paulserban.eu
```

Also extend `compose_build` to include `news` in the `$(COMPOSE) build portfolio blog quiz news` list.

### 4. Docs — `_docs/infrastructure/local-dev-setup--macos.md`, `--debian.md`, root `README.md`

For each: add a `News feed` row to the URL table, add `local.news-feed.paulserban.eu` to the `/etc/hosts` heredoc and the mkcert command, and add `── news (:4321)` to the "How it works" ASCII diagram. These are the same three places already touched when quiz was added, per the existing doc structure.

### 5. Verify

```bash
make certs                 # regenerate cert with the new SAN
make local_base_build
docker compose -f infrastructure/local/docker-compose.local.yml build news
docker compose -f infrastructure/local/docker-compose.local.yml config   # sanity-check merged config
make compose_up
```

Expected: `https://local.news-feed.paulserban.eu` serves the news-feed-site dev server behind Traefik with a trusted cert, alongside the other three; portfolio/blog/quiz's site-switcher "News" tab points at the local news URL instead of production; news-feed-site's footer/header links to local portfolio/blog/quiz.

## Out of scope

- Production/staging hosting for `news-feed.paulserban.eu` (still TBD, same as the other three subdomains).
- Any change to `local.base.Dockerfile` (it already copies all of `frontend/`, so `news-feed-site` sources are already present in the base layer).
