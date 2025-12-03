.PHONY: patch minor major

patch:
	./scripts/release.sh patch

minor:
	./scripts/release.sh minor

major:
	./scripts/release.sh major
