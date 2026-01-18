.PHONY: patch minor major minor-ignore major-ignore deploy deploy-web deploy-infra deploy-monitoring push-web-image switch-web-version swv restart

VERSION := $(shell node -p "require('./apps/web/package.json').version")
IMAGE := ghcr.io/sbozh-me/website
SSH_HOST := sbozhme
APP_DIR := /opt/sbozh-me

# Release commands - use with optional feature name for roadmap versioning
# Examples:
#   make patch           - bump package version (v1.0.0 -> v1.0.1)
#   make patch mermaid   - create roadmap/mermaid/mermaid-0.0.1.md
#   make minor blog      - create roadmap/blog/blog-0.1.0.md
patch:
ifeq ($(word 2,$(MAKECMDGOALS)),)
	./scripts/release.sh patch
else
	./scripts/roadmap-version.sh patch $(word 2,$(MAKECMDGOALS))
endif

minor:
ifeq ($(word 2,$(MAKECMDGOALS)),)
	./scripts/release.sh minor
else
	./scripts/roadmap-version.sh minor $(word 2,$(MAKECMDGOALS))
endif

minor-ignore:
	./scripts/release.sh minor --ignore

major:
ifeq ($(word 2,$(MAKECMDGOALS)),)
	./scripts/release.sh major
else
	./scripts/roadmap-version.sh major $(word 2,$(MAKECMDGOALS))
endif

major-ignore:
	./scripts/release.sh major --ignore

# Allow any word as second argument (for feature names)
%:
	@:

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
