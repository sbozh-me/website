#!/bin/bash
# Count lines of code in every src folder of monorepo projects

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Lines of Code Counter${NC}"
echo "=========================="
echo ""

total_lines=0
total_files=0

# Find all src directories, excluding node_modules and .git
src_dirs=$(find "$ROOT_DIR" -type d -name "src" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/.turbo/*" \
    2>/dev/null | sort)

for src_dir in $src_dirs; do
    # Get relative path from root
    rel_path="${src_dir#$ROOT_DIR/}"
    project_name=$(echo "$rel_path" | sed 's|/src||')

    # Count lines in TypeScript/JavaScript files
    if [ -d "$src_dir" ]; then
        file_count=$(find "$src_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | wc -l | tr -d ' ')

        if [ "$file_count" -gt 0 ]; then
            lines=$(find "$src_dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')

            printf "${GREEN}%-40s${NC} %6s lines  (%s files)\n" "$project_name" "$lines" "$file_count"

            total_lines=$((total_lines + lines))
            total_files=$((total_files + file_count))
        fi
    fi
done

echo ""
echo "=========================="
printf "${YELLOW}%-40s${NC} %6s lines  (%s files)\n" "TOTAL" "$total_lines" "$total_files"