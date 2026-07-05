# Local dev image — build context: monorepo root
#   docker build -f frontend/apps/quiz-web-app/local.Dockerfile .

FROM node:24-alpine

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./
COPY shared ./shared
COPY tools ./tools
COPY frontend/apps/quiz-web-app ./frontend/apps/quiz-web-app

RUN pnpm install --frozen-lockfile \
    --filter @prj--personal-portfolio--v3/frontend--quiz-web-app...

EXPOSE 5180

CMD ["pnpm", "--filter", "@prj--personal-portfolio--v3/frontend--quiz-web-app", "exec", "vite", "--host", "0.0.0.0", "--port", "5180"]
