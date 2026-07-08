# 1. Install mkcert + add /etc/hosts (see macOS doc)

COMPOSE_FILE := infrastructure/local/docker-compose.local.yml
LOCAL_BASE_IMAGE := prj-personal-portfolio-v3-local-base:latest
export DOCKER_BUILDKIT := 1
export COMPOSE_DOCKER_CLI_BUILD := 1
COMPOSE := docker compose -f $(COMPOSE_FILE) --profile build-only

# 2. Generate certs (once)
certs:
	mkcert -install
	mkcert -cert-file infrastructure/local/traefik/certs/local.pem \
		-key-file  infrastructure/local/traefik/certs/local-key.pem \
		local.paulserban.eu local.blog.paulserban.eu local.quiz.paulserban.eu

# 3. cleanup db file - fetch fresh content - rebuild db
db_clean_and_rebuild:
	rm database/output/content.db
	pnpm start

local_base_build:
	$(COMPOSE) build local-base

compose_build: local_base_build
	$(COMPOSE) build portfolio blog quiz

# 3. Start stack
compose_up: local_base_build
	docker compose -f $(COMPOSE_FILE) up --build

compose_down:
	docker compose -f $(COMPOSE_FILE) down

compose_down_clean:
	docker compose -f $(COMPOSE_FILE) down -v
