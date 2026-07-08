# Local monorepo base image — build context: monorepo root
#   docker build -f local.base.Dockerfile -t prj-personal-portfolio-v3-local-base:latest .

FROM node:24-alpine

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./
COPY shared ./shared
COPY tools ./tools
COPY database ./database
COPY frontend ./frontend

RUN pnpm install --frozen-lockfile
