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
  # Update existing package.json
  node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('${PACKAGE_JSON}', 'utf8'));
pkg.version = '${NEW}';
fs.writeFileSync('${PACKAGE_JSON}', JSON.stringify(pkg, null, 2) + '\n');
"
else
  # Create new package.json
  cat > "$PACKAGE_JSON" << EOF
{
  "name": "${PROJECT_NAME}",
  "version": "${NEW}",
  "private": true,
  "description": "Roadmap tracking for ${FEATURE} feature"
}
EOF
fi

# Create CHANGELOG.md if it doesn't exist (but don't auto-add entries)
if [[ ! -f "$CHANGELOG" ]]; then
  cat > "$CHANGELOG" << EOF
# Changelog

All notable changes to the ${FEATURE} feature will be documented in this file.
EOF
  echo -e "${GREEN}Created ${CHANGELOG}${NC}"
fi

# Show reminder to update changelog
echo -e "${YELLOW}Remember to update ${CHANGELOG} with:${NC}"
echo ""
echo "## [${NEW}] - ${DATE}"
echo ""
echo "### Changed"
echo ""
echo "- Your changes here"
echo ""

# Check if corresponding plan file exists
PLAN_FILE="${ROADMAP_DIR}/${FEATURE}-${NEW}.md"
if [[ ! -f "$PLAN_FILE" ]]; then
  echo -e "${YELLOW}Note: Plan file ${PLAN_FILE} does not exist${NC}"
  echo -e "Create it with the implementation details for this version"
fi

echo -e "${GREEN}Updated ${PACKAGE_JSON} to version ${NEW}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Update ${CHANGELOG} with actual changes"
echo "  2. Implement changes for ${FEATURE}-${NEW}"
echo "  3. Commit: git add ${ROADMAP_DIR} && git commit -m 'feat(${FEATURE}): v${NEW}'"
echo "  4. Tag: git tag ${FEATURE}-${NEW}"
