#!/bin/bash
# Count lines of markdown in src folders + postmortem + roadmap

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Markdown Lines Counter${NC}"
echo "=========================="
echo ""

total_lines=0
total_files=0

count_md_in_dir() {
    local dir="$1"
    local name="$2"

    if [ -d "$dir" ]; then
        file_count=$(find "$dir" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

        if [ "$file_count" -gt 0 ]; then
            lines=$(find "$dir" -type f -name "*.md" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')

            printf "${GREEN}%-40s${NC} %6s lines  (%s files)\n" "$name" "$lines" "$file_count"

            total_lines=$((total_lines + lines))
            total_files=$((total_files + file_count))
        fi
    fi
}

# Find all src directories, excluding node_modules and .git
src_dirs=$(find "$ROOT_DIR" -type d -name "src" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/.turbo/*" \
    2>/dev/null | sort)

for src_dir in $src_dirs; do
    rel_path="${src_dir#$ROOT_DIR/}"
    project_name=$(echo "$rel_path" | sed 's|/src||')
    count_md_in_dir "$src_dir" "$project_name"
done

# Add postmortem and roadmap folders
count_md_in_dir "$ROOT_DIR/postmortem" "postmortem"
count_md_in_dir "$ROOT_DIR/roadmap" "roadmap"

echo ""
echo "=========================="
printf "${YELLOW}%-40s${NC} %6s lines  (%s files)\n" "TOTAL" "$total_lines" "$total_files"