# 1. Install mkcert + add /etc/hosts (see macOS doc)

# 2. Generate certs (once)
certs:
	mkcert -install
	mkcert -cert-file infrastructure/local/traefik/certs/local.pem \
		-key-file  infrastructure/local/traefik/certs/local-key.pem \
		local.paulserban.eu local.blog.paulserban.eu local.quiz.paulserban.eu

# 3. Start stack
compose_up:
	docker compose -f infrastructure/local/docker-compose.local.yml up --build

compose_down:
	docker compose -f infrastructure/local/docker-compose.local.yml down

compose_down_clean:
	docker compose -f infrastructure/local/docker-compose.local.yml down -v