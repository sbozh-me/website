.PHONY: patch minor major minor-ignore major-ignore deploy deploy-web deploy-infra deploy-monitoring push-web-image switch-web-version swv restart

VERSION := $(shell node -p "require('./apps/web/package.json').version")
IMAGE := ghcr.io/sbozh-me/website
SSH_HOST := sbozhme
APP_DIR := /opt/sbozh-me

patch:
	./scripts/release.sh patch

minor:
	./scripts/release.sh minor

minor-ignore:
	./scripts/release.sh minor --ignore

major:
	./scripts/release.sh major

major-ignore:
	./scripts/release.sh major --ignore

push-web-image:
	@echo "Building web image v$(VERSION) for linux/amd64..."
	docker buildx build --platform linux/amd64 -t $(IMAGE):$(VERSION) -t $(IMAGE):latest -f apps/web/Dockerfile --push .

switch-web-version swv:
	@echo "Switching server to web v$(VERSION)..."
	ssh $(SSH_HOST) "cd $(APP_DIR) && \
		sed -i 's/WEB_IMAGE_TAG=.*/WEB_IMAGE_TAG=$(VERSION)/' .env && \
		docker compose pull web && \
		docker compose up -d web"
	@echo "Switched to v$(VERSION)"

deploy-web: push-web-image switch-web-version
	@echo "Deployed web v$(VERSION)"

deploy-infra:
	@echo "Deploying website infrastructure..."
	./deploy/production/website/deploy.sh
	@echo "Website infrastructure deployed"

deploy-monitoring:
	@echo "Deploying monitoring infrastructure..."
	./deploy/production/monitoring/deploy.sh
	@echo "Monitoring infrastructure deployed"

deploy: deploy-web deploy-infra

restart:
	@echo "Restarting web v$(VERSION)..."
	ssh $(SSH_HOST) "cd $(APP_DIR) && \
		docker compose pull web && \
		docker compose up -d web"
	@echo "Restarted"
