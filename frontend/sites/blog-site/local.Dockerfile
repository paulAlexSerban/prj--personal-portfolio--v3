# Local dev image — build context: monorepo root (requires local base image)
#   make local_base_build
#   docker build -f frontend/sites/blog-site/local.Dockerfile .

ARG LOCAL_BASE_IMAGE=prj-personal-portfolio-v3-local-base:latest
FROM ${LOCAL_BASE_IMAGE}

EXPOSE 4321

CMD ["pnpm", "--filter", "@prj--personal-portfolio--v3/frontend--blog-site", "exec", "astro", "dev", "--host", "0.0.0.0", "--port", "4321"]
