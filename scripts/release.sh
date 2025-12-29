#!/bin/bash
set -e

RELEASE_TYPE=$1
IGNORE_COVERAGE=$2
REPO_URL="https://github.com/sbozh-me/website"
COVERAGE_THRESHOLD=90

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Validate input
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Usage: $0 {patch|minor|major}${NC}"
  exit 1
fi

# Get current version from root package.json
CURRENT=$(node -p "require('./package.json').version")
IFS='.' read -r major minor patch <<< "$CURRENT"

# Calculate new version
case $RELEASE_TYPE in
  major) NEW="$((major + 1)).0.0" ;;
  minor) NEW="${major}.$((minor + 1)).0" ;;
  patch) NEW="${major}.${minor}.$((patch + 1))" ;;
esac

echo -e "${YELLOW}Releasing v${NEW} (${RELEASE_TYPE})${NC}"

# Coverage check for minor/major only (skip with --ignore)
if [[ "$RELEASE_TYPE" != "patch" && "$IGNORE_COVERAGE" != "--ignore" ]]; then
  echo -e "${YELLOW}Running test coverage check...${NC}"
  pnpm --filter './apps/*' test:coverage

  # Check coverage in each app
  for summary in apps/*/coverage/coverage-summary.json; do
    if [[ -f "$summary" ]]; then
      avg=$(node -p "const c=require('./$summary').total; ((c.lines.pct + c.branches.pct + c.functions.pct + c.statements.pct) / 4).toFixed(2)")
      if (( $(echo "$avg < $COVERAGE_THRESHOLD" | bc -l) )); then
        echo -e "${RED}Average coverage ${avg}% is below ${COVERAGE_THRESHOLD}% threshold in ${summary}${NC}"
        exit 1
      fi
      echo -e "${GREEN}Average coverage: ${avg}% (threshold: ${COVERAGE_THRESHOLD}%)${NC}"
    fi
  done
elif [[ "$IGNORE_COVERAGE" == "--ignore" ]]; then
  echo -e "${YELLOW}Skipping coverage check (--ignore)${NC}"
fi

# Get commits for changelog
echo -e "${YELLOW}Updating CHANGELOG.md...${NC}"

LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
DATE=$(date +%Y-%m-%d)

if [[ -z "$LAST_TAG" ]]; then
  COMMITS=$(git log --pretty=format:"%H|%s" --reverse)
else
  COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"%H|%s" --reverse)
fi

# Build changelog entry
ENTRY="## [${NEW}] - ${DATE}\n\n### Changes\n\n"
while IFS='|' read -r hash msg; do
  if [[ -n "$hash" ]]; then
    short_hash=${hash:0:7}
    ENTRY+="- ${msg} ([${short_hash}](${REPO_URL}/commit/${hash}))\n"
  fi
done <<< "$COMMITS"

# Update or create CHANGELOG.md
if [[ -f "CHANGELOG.md" ]]; then
  # Insert after header
  HEADER="# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n"
  EXISTING=$(tail -n +4 CHANGELOG.md)
  echo -e "${HEADER}${ENTRY}\n${EXISTING}" > CHANGELOG.md
else
  HEADER="# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n"
  echo -e "${HEADER}${ENTRY}" > CHANGELOG.md
fi

# Bump versions in all package.json files
echo -e "${YELLOW}Bumping versions to ${NEW}...${NC}"

# Update root package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${NEW}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update all workspace package.json files
for pkg_file in apps/*/package.json packages/*/package.json; do
  if [[ -f "$pkg_file" ]]; then
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('${pkg_file}', 'utf8'));
pkg.version = '${NEW}';
fs.writeFileSync('${pkg_file}', JSON.stringify(pkg, null, 2) + '\n');
"
  fi
done

echo -e "${GREEN}Successfully prepared release v${NEW}${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git diff"
echo "  2. Commit: git add . && git commit -m 'chore(release): v${NEW}'"
echo "  3. Create PR to main"
