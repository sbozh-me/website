.PHONY: patch minor major minor-ignore major-ignore

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
