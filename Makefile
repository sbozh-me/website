.PHONY: patch minor major minor-ignore major-ignore deploy redeploy

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

deploy:
	@echo "Building web image v$(VERSION)..."
	docker build -t $(IMAGE):$(VERSION) -t $(IMAGE):latest -f apps/web/Dockerfile .
	@echo "Pushing to ghcr.io..."
	docker push $(IMAGE):$(VERSION)
	docker push $(IMAGE):latest
	@echo "Updating server..."
	ssh $(SSH_HOST) "cd $(APP_DIR) && \
		sed -i 's/WEB_IMAGE_TAG=.*/WEB_IMAGE_TAG=$(VERSION)/' .env && \
		docker compose pull web && \
		docker compose up -d web"
	@echo "Deployed v$(VERSION)"

redeploy:
	@echo "Redeploying web v$(VERSION)..."
	ssh $(SSH_HOST) "cd $(APP_DIR) && \
		docker compose pull web && \
		docker compose up -d web"
	@echo "Redeployed"
