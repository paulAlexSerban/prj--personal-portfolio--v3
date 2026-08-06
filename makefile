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
		local.paulserban.eu local.blog.paulserban.eu local.quiz.paulserban.eu local.news-feed.paulserban.eu

# 3. cleanup db file - fetch fresh content - rebuild db
db_clean_and_rebuild:
	rm database/output/content.db
	pnpm start

sync_news:
	pnpm --filter @prj--personal-portfolio--v3/tools--news-sync sync

local_base_build:
	$(COMPOSE) build local-base

compose_build: local_base_build
	$(COMPOSE) build portfolio blog quiz news

# 3. Start stack
compose_up: local_base_build
	docker compose -f $(COMPOSE_FILE) up --build

compose_down:
	docker compose -f $(COMPOSE_FILE) down

compose_down_clean:
	docker compose -f $(COMPOSE_FILE) down -v

# Installs Terraform 1.9.8 to ~/.local/bin (add that dir to PATH if needed).
install_terraform:
	@mkdir -p "$(HOME)/.local/bin"
	@curl -fsSL -o /tmp/terraform.zip https://releases.hashicorp.com/terraform/1.9.8/terraform_1.9.8_linux_amd64.zip \
	&& cd /tmp && unzip -o terraform.zip \
	&& install -m 755 /tmp/terraform "$(HOME)/.local/bin/terraform" \
	&& "$(HOME)/.local/bin/terraform" version
	@case ":$$PATH:" in *":$(HOME)/.local/bin:"*) ;; *) \
		echo ""; \
		echo "Note: $(HOME)/.local/bin is not on your PATH. Add this to ~/.zshrc:"; \
		echo '  export PATH="$$HOME/.local/bin:$$PATH"'; \
		echo "Then run: source ~/.zshrc"; \
	esac

install_aws_cli:
	sudo curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
	sudo unzip awscliv2.zip
	sudo ./aws/install
	aws --version

tf_init_test:
	# init terraform from /infrastructure/aws/envs/test
	terraform -chdir=infrastructure/aws/envs/test init

tf_plan_test:
	# plan terraform from /infrastructure/aws/envs/test
	terraform -chdir=infrastructure/aws/envs/test plan

tf_apply_test:
	# apply terraform from /infrastructure/aws/envs/test
	terraform -chdir=infrastructure/aws/envs/test apply

tf_destroy_test:
	# destroy terraform from /infrastructure/aws/envs/test
	terraform -chdir=infrastructure/aws/envs/test destroy

tf_init_stage:
	# init terraform from /infrastructure/aws/envs/stage
	terraform -chdir=infrastructure/aws/envs/stage init

tf_plan_stage:
	# plan terraform from /infrastructure/aws/envs/stage
	terraform -chdir=infrastructure/aws/envs/stage plan

tf_apply_stage:
	# apply terraform from /infrastructure/aws/envs/stage
	terraform -chdir=infrastructure/aws/envs/stage apply

tf_destroy_stage:
	# destroy terraform from /infrastructure/aws/envs/stage
	terraform -chdir=infrastructure/aws/envs/stage destroy