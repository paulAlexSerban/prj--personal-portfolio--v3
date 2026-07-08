# Local dev image — build context: monorepo root (requires local base image)
#   make local_base_build
#   docker build -f frontend/apps/quiz-web-app/local.Dockerfile .

ARG LOCAL_BASE_IMAGE=prj-personal-portfolio-v3-local-base:latest
FROM ${LOCAL_BASE_IMAGE}


EXPOSE 5180

CMD ["pnpm", "--filter", "@prj--personal-portfolio--v3/frontend--quiz-web-app", "exec", "vite", "--host", "0.0.0.0", "--port", "5180"]
