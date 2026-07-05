# Local dev image — build context: monorepo root
#   docker build -f frontend/sites/portfolio-site/local.Dockerfile .

FROM node:24-alpine

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./
COPY shared ./shared
COPY tools ./tools
COPY frontend/sites/portfolio-site ./frontend/sites/portfolio-site

RUN pnpm install --frozen-lockfile \
    --filter @prj--personal-portfolio--v3/frontend--portfolio-site...

EXPOSE 4321

CMD ["pnpm", "--filter", "@prj--personal-portfolio--v3/frontend--portfolio-site", "exec", "astro", "dev", "--host", "0.0.0.0", "--port", "4321"]
