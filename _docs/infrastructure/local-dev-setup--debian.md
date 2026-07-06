# Local development setup — Debian / Ubuntu

Run the portfolio site, blog site, and quiz web app behind Traefik on HTTPS with local domain names — no port numbers in the browser URL.

| Service           | URL                              |
| ----------------- | -------------------------------- |
| Portfolio         | https://local.paulserban.eu      |
| Blog              | https://local.blog.paulserban.eu |
| Quiz              | https://local.quiz.paulserban.eu |
| Traefik dashboard | http://localhost:8080            |

HTTP (port 80) redirects to HTTPS (port 443).

## Prerequisites

Install these once on your Debian or Ubuntu system.

### 1. Docker Engine + Compose plugin

Follow the [official Docker install guide](https://docs.docker.com/engine/install/debian/) for your distribution, then install the Compose plugin:

```bash
sudo apt-get update
```

Add your user to the `docker` group (log out and back in afterward):

```bash
sudo usermod -aG docker "$USER"
```

Verify:

```bash
docker --version
docker compose version
```

### 2. mkcert (trusted local HTTPS certificates)

Install build tools and download the latest mkcert release from [GitHub releases](https://github.com/FiloSottile/mkcert/releases):

```bash
sudo apt-get install -y libnss3-tools curl

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) MKCERT_ARCH="amd64" ;;
  aarch64) MKCERT_ARCH="arm64" ;;
  armv7l) MKCERT_ARCH="arm" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

curl -fsSL "https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-${MKCERT_ARCH}" \
  -o /tmp/mkcert
chmod +x /tmp/mkcert
sudo mv /tmp/mkcert /usr/local/bin/mkcert
```

Install the local CA (browser trust):

```bash
mkcert -install
```

On headless servers, `mkcert -install` still installs the CA for tools that use the system store; use a desktop browser on a machine where you have imported the CA, or copy the CA cert to your workstation.

### 3. Local DNS via `/etc/hosts`

Map the local domains to your machine. Traefik listens on ports 80 and 443; the hostnames must resolve to `127.0.0.1`.

```bash
sudo tee -a /etc/hosts <<'EOF'
127.0.0.1  local.paulserban.eu
127.0.0.1  local.blog.paulserban.eu
127.0.0.1  local.quiz.paulserban.eu
EOF
```

Verify:

```bash
getent hosts local.paulserban.eu
```

## One-time project setup

From the monorepo root:

### 1. Generate TLS certificates

```bash
mkcert -cert-file infrastructure/local/traefik/certs/local.pem \
       -key-file  infrastructure/local/traefik/certs/local-key.pem \
       local.paulserban.eu local.blog.paulserban.eu local.quiz.paulserban.eu
```

Certificate files are gitignored; regenerate if you delete `infrastructure/local/traefik/certs/`.

### 2. Ensure content database exists

Portfolio and blog read `database/output/content.db` at runtime (bind-mounted into containers).

```bash
# Sync content and ingest (requires root .env with GITHUB_TOKEN + CONTENT_REPO_GIT_URL)
pnpm --filter @prj--personal-portfolio--v3/tools--content-sync start
pnpm --filter @prj--personal-portfolio--v3/tools--mdx-ingest start
pnpm --filter @prj--personal-portfolio--v3/tools--json-ingest start
```

For quiz static JSON:

```bash
pnpm --filter @prj--personal-portfolio--v3/tools--quiz-export start
```

Rebuild the quiz container after regenerating `public/data/`.

## Start the stack

From the monorepo root:

```bash
docker compose -f infrastructure/local/docker-compose.local.yml up --build
```

Add `-d` to run in the background.

Stop:

```bash
docker compose -f infrastructure/local/docker-compose.local.yml down
```

Rebuild a single service after code changes:

```bash
docker compose -f infrastructure/local/docker-compose.local.yml up --build portfolio
```

## How it works

```
Browser ──► Traefik (:443, TLS) ──► portfolio (:4321)
              │                  ──► blog      (:4321)
              │                  ──► quiz      (:5180)
              └── HTTP :80 → HTTPS redirect
```

- **Traefik** is the reverse proxy and local DNS entry point (via `/etc/hosts`).
- **mkcert** provides browser-trusted certificates for `*.paulserban.eu` local subdomains.
- Each app has its own `local.Dockerfile`; build context is the monorepo root (pnpm workspace deps).
- Astro sites mount `database/output/` read-only so `content.db` is available inside containers.

## Troubleshooting

### `permission denied` on Docker socket

```bash
sudo usermod -aG docker "$USER"
# log out and back in, then:
docker ps
```

### `connection refused` on port 443

- Confirm the Docker daemon is running: `sudo systemctl status docker`
- Check Traefik: `docker compose -f infrastructure/local/docker-compose.local.yml ps`
- Ensure nothing else binds ports 80/443:

```bash
sudo ss -tlnp | grep -E ':80|:443'
```

### Certificate / HTTPS warnings

- Re-run `mkcert -install` and regenerate certs in `infrastructure/local/traefik/certs/`.
- Restart the stack after replacing cert files.

### `Blocked request. This host is not allowed` (Vite / Astro)

The dev servers allow custom hosts when run via Docker. Rebuild the affected container after pulling config changes.

### Portfolio or blog shows no content

- Confirm `database/output/content.db` exists on the host.
- Run the content ingest pipeline (see above).

### Hostname does not resolve

- Re-check `/etc/hosts` entries.
- On systemd-resolved systems, `getent hosts local.paulserban.eu` should return `127.0.0.1`.

## Related files

- Compose: [`infrastructure/local/docker-compose.local.yml`](../../infrastructure/local/docker-compose.local.yml)
- Traefik config: [`infrastructure/local/traefik/`](../../infrastructure/local/traefik/)
- Dockerfiles:
  - [`frontend/sites/portfolio-site/local.Dockerfile`](../../frontend/sites/portfolio-site/local.Dockerfile)
  - [`frontend/sites/blog-site/local.Dockerfile`](../../frontend/sites/blog-site/local.Dockerfile)
  - [`frontend/apps/quiz-web-app/local.Dockerfile`](../../frontend/apps/quiz-web-app/local.Dockerfile)

macOS setup: [local-dev-setup--macos.md](./local-dev-setup--macos.md)
