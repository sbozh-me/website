#!/bin/bash
set -e

RELEASE_TYPE=$1
FEATURE=$2

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Validate input
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Usage: $0 {patch|minor|major} <feature>${NC}"
  echo -e "Example: $0 patch mermaid"
  exit 1
fi

if [[ -z "$FEATURE" ]]; then
  echo -e "${RED}Feature name required${NC}"
  echo -e "Usage: $0 {patch|minor|major} <feature>"
  echo -e "Example: $0 patch mermaid"
  exit 1
fi

ROADMAP_DIR="roadmap/${FEATURE}"
PACKAGE_JSON="${ROADMAP_DIR}/package.json"
CHANGELOG="${ROADMAP_DIR}/CHANGELOG.md"
REPO_URL="https://github.com/sbozh-me/website"

# Create directory if it doesn't exist
if [[ ! -d "$ROADMAP_DIR" ]]; then
  echo -e "${YELLOW}Creating roadmap directory: ${ROADMAP_DIR}${NC}"
  mkdir -p "$ROADMAP_DIR"
fi

# Get current version and project name from package.json or start fresh
if [[ -f "$PACKAGE_JSON" ]]; then
  CURRENT=$(node -p "require('./${PACKAGE_JSON}').version")
  PROJECT_NAME=$(node -p "require('./${PACKAGE_JSON}').name")
  echo -e "${CYAN}Current version: ${PROJECT_NAME}@${CURRENT}${NC}"
else
  CURRENT="0.0.0"
  PROJECT_NAME="@sbozh/roadmap-${FEATURE}"
  echo -e "${CYAN}No package.json found, starting at 0.0.0${NC}"
fi

# Parse version
IFS='.' read -r major minor patch <<< "$CURRENT"

# Calculate new version
case $RELEASE_TYPE in
  major) NEW="$((major + 1)).0.0" ;;
  minor) NEW="${major}.$((minor + 1)).0" ;;
  patch) NEW="${major}.${minor}.$((patch + 1))" ;;
esac

DATE=$(date +%Y-%m-%d)

echo -e "${YELLOW}Bumping ${PROJECT_NAME} to ${NEW}...${NC}"

# Create or update package.json
if [[ -f "$PACKAGE_JSON" ]]; then
  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('${PACKAGE_JSON}', 'utf8'));
pkg.version = '${NEW}';
fs.writeFileSync('${PACKAGE_JSON}', JSON.stringify(pkg, null, 2) + '\n');
"
else
  cat > "$PACKAGE_JSON" << EOF
{
  "name": "${PROJECT_NAME}",
  "version": "${NEW}",
  "private": true,
  "description": "Roadmap tracking for ${FEATURE} feature"
}
EOF
fi

# Get commits since last feature tag
LAST_TAG=$(git tag -l "${FEATURE}-*" --sort=-v:refname | head -1 || echo "")

if [[ -z "$LAST_TAG" ]]; then
  COMMITS=$(git log --pretty=format:"%H|%s" --reverse 2>/dev/null || echo "")
else
  COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"%H|%s" --reverse 2>/dev/null || echo "")
fi

# Build changelog entry
ENTRY="## [${FEATURE}-${NEW}] - ${DATE}\n\n### Changes\n\n"
if [[ -n "$COMMITS" ]]; then
  while IFS='|' read -r hash msg; do
    if [[ -n "$hash" ]]; then
      short_hash=${hash:0:7}
      ENTRY+="- ${msg} ([${short_hash}](${REPO_URL}/commit/${hash}))\n"
    fi
  done <<< "$COMMITS"
else
  ENTRY+="- Version bump to ${NEW}\n"
fi

# Update or create CHANGELOG.md
echo -e "${YELLOW}Updating ${CHANGELOG}...${NC}"
if [[ -f "$CHANGELOG" ]]; then
  HEADER="# Changelog\n\nAll notable changes to the ${FEATURE} feature will be documented in this file.\n\n"
  EXISTING=$(tail -n +5 "$CHANGELOG")
  echo -e "${HEADER}${ENTRY}\n${EXISTING}" > "$CHANGELOG"
else
  HEADER="# Changelog\n\nAll notable changes to the ${FEATURE} feature will be documented in this file.\n\n"
  echo -e "${HEADER}${ENTRY}" > "$CHANGELOG"
fi

echo -e "${GREEN}Updated ${CHANGELOG}${NC}"

# Check if corresponding plan file exists
PLAN_FILE="${ROADMAP_DIR}/${FEATURE}-${NEW}.md"
if [[ ! -f "$PLAN_FILE" ]]; then
  echo -e "${YELLOW}Note: Plan file ${PLAN_FILE} does not exist${NC}"
fi

echo -e "${GREEN}Updated ${PACKAGE_JSON} to version ${NEW}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review ${CHANGELOG}"
echo "  2. Commit: git add ${ROADMAP_DIR} && git commit -m 'feat(${FEATURE}): v${NEW}'"
echo "  3. Tag: git tag ${FEATURE}-${NEW}"
