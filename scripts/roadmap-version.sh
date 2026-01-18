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

# Create directory if it doesn't exist
if [[ ! -d "$ROADMAP_DIR" ]]; then
  echo -e "${YELLOW}Creating roadmap directory: ${ROADMAP_DIR}${NC}"
  mkdir -p "$ROADMAP_DIR"
fi

# Get current version from package.json or start fresh
if [[ -f "$PACKAGE_JSON" ]]; then
  CURRENT=$(node -p "require('./${PACKAGE_JSON}').version")
  echo -e "${CYAN}Current version: ${FEATURE}@${CURRENT}${NC}"
else
  CURRENT="0.0.0"
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

echo -e "${YELLOW}Bumping ${FEATURE} to ${NEW}...${NC}"

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
  "name": "@sbozh/roadmap-${FEATURE}",
  "version": "${NEW}",
  "private": true,
  "description": "Roadmap tracking for ${FEATURE} feature"
}
EOF
fi

# Check if corresponding plan file exists
PLAN_FILE="${ROADMAP_DIR}/${FEATURE}-${NEW}.md"
if [[ ! -f "$PLAN_FILE" ]]; then
  echo -e "${YELLOW}Note: Plan file ${PLAN_FILE} does not exist${NC}"
  echo -e "Create it with the implementation details for this version"
fi

echo -e "${GREEN}Updated ${PACKAGE_JSON} to version ${NEW}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Implement changes for ${FEATURE}-${NEW}"
echo "  2. Commit: git add ${ROADMAP_DIR} && git commit -m 'feat(${FEATURE}): v${NEW}'"
echo "  3. Tag: git tag ${FEATURE}-${NEW}"
