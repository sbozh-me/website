#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SESSION_GAP_SECONDS=7200  # 2 hours in seconds
FIRST_COMMIT_MINUTES=30   # Assumed time for first commit in a session

# Arguments
FROM_DATE=""
TO_DATE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --from)
      FROM_DATE="$2"
      shift 2
      ;;
    --to)
      TO_DATE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--from DATE] [--to DATE]"
      echo ""
      echo "Calculate development hours per version from git history."
      echo ""
      echo "Options:"
      echo "  --from DATE   Start date (YYYY-MM-DD)"
      echo "  --to DATE     End date (YYYY-MM-DD)"
      echo "  -h, --help    Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                              # Full history"
      echo "  $0 --from 2025-12-01            # From date to now"
      echo "  $0 --from 2025-12-01 --to 2025-12-15"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Convert date to timestamp (macOS compatible)
date_to_timestamp() {
  local date_str="$1"
  if [[ -n "$date_str" ]]; then
    # macOS date command
    date -j -f "%Y-%m-%d" "$date_str" "+%s" 2>/dev/null || \
    # GNU date fallback
    date -d "$date_str" "+%s" 2>/dev/null || \
    echo ""
  fi
}

# Calculate session-based hours from commit timestamps (reads from stdin)
calculate_session_hours() {
  local total_seconds=0
  local session_count=0
  local prev_ts=0

  while read -r ts; do
    if [[ -z "$ts" ]]; then
      continue
    fi
    if [[ $prev_ts -eq 0 ]]; then
      # First commit of first session
      total_seconds=$((total_seconds + FIRST_COMMIT_MINUTES * 60))
      session_count=1
    else
      local gap=$((ts - prev_ts))
      if [[ $gap -gt $SESSION_GAP_SECONDS ]]; then
        # New session - add first commit time
        total_seconds=$((total_seconds + FIRST_COMMIT_MINUTES * 60))
        session_count=$((session_count + 1))
      else
        # Same session - add gap time
        total_seconds=$((total_seconds + gap))
      fi
    fi
    prev_ts=$ts
  done

  echo "$total_seconds $session_count"
}

# Get all tags sorted by creation date
get_sorted_tags() {
  git tag --sort=creatordate 2>/dev/null | grep -E '^v?[0-9]+\.[0-9]+' || true
}

# Get tag date
get_tag_date() {
  local tag="$1"
  git log -1 --format="%cs" "$tag" 2>/dev/null || echo ""
}

# Get commit count excluding release commits
get_commit_count() {
  local from_ref="$1"
  local to_ref="$2"
  local date_args=""

  if [[ -n "$FROM_DATE" ]]; then
    date_args="$date_args --since=$FROM_DATE"
  fi
  if [[ -n "$TO_DATE" ]]; then
    date_args="$date_args --until=$TO_DATE"
  fi

  if [[ -z "$from_ref" ]]; then
    git log "$to_ref" --oneline $date_args 2>/dev/null | \
      grep -v "chore(release):" | wc -l | tr -d ' '
  else
    git log "${from_ref}..${to_ref}" --oneline $date_args 2>/dev/null | \
      grep -v "chore(release):" | wc -l | tr -d ' '
  fi
}

# Get commits timestamps excluding release commits
get_commit_timestamps() {
  local from_ref="$1"
  local to_ref="$2"
  local date_args=""

  if [[ -n "$FROM_DATE" ]]; then
    date_args="$date_args --since=$FROM_DATE"
  fi
  if [[ -n "$TO_DATE" ]]; then
    date_args="$date_args --until=$TO_DATE"
  fi

  if [[ -z "$from_ref" ]]; then
    git log "$to_ref" --format="%at %s" --reverse $date_args 2>/dev/null | \
      grep -v "chore(release):" | awk '{print $1}' || true
  else
    git log "${from_ref}..${to_ref}" --format="%at %s" --reverse $date_args 2>/dev/null | \
      grep -v "chore(release):" | awk '{print $1}' || true
  fi
}

# Format seconds to hours with one decimal
format_hours() {
  local seconds="$1"
  if [[ $seconds -eq 0 ]]; then
    echo "0.0"
  else
    echo "scale=1; $seconds / 3600" | bc
  fi
}

# Main
echo -e "${BOLD}Development Time Estimate${NC}"
echo "========================="
echo ""

if [[ -n "$FROM_DATE" ]] || [[ -n "$TO_DATE" ]]; then
  echo -e "${CYAN}Date range:${NC} ${FROM_DATE:-beginning} to ${TO_DATE:-now}"
  echo ""
fi

# Print header
printf "${BOLD}%-12s %-12s %8s %10s %8s${NC}\n" "Version" "Date" "Commits" "Sessions" "Hours"
printf "%-12s %-12s %8s %10s %8s\n" "-------" "----" "-------" "--------" "-----"

# Track totals
TOTAL_COMMITS=0
TOTAL_SESSIONS=0
TOTAL_SECONDS=0

# Process each version
PREV_TAG=""
while read -r TAG; do
  if [[ -z "$TAG" ]]; then
    continue
  fi

  # Get tag date
  TAG_DATE=$(get_tag_date "$TAG")

  # Skip if outside date range
  if [[ -n "$FROM_DATE" ]]; then
    FROM_TS=$(date_to_timestamp "$FROM_DATE")
    TAG_TS=$(date_to_timestamp "$TAG_DATE")
    if [[ -n "$FROM_TS" ]] && [[ -n "$TAG_TS" ]] && [[ $TAG_TS -lt $FROM_TS ]]; then
      PREV_TAG="$TAG"
      continue
    fi
  fi

  if [[ -n "$TO_DATE" ]]; then
    TO_TS=$(date_to_timestamp "$TO_DATE")
    TAG_TS=$(date_to_timestamp "$TAG_DATE")
    if [[ -n "$TO_TS" ]] && [[ -n "$TAG_TS" ]] && [[ $TAG_TS -gt $TO_TS ]]; then
      continue
    fi
  fi

  # Get commit count
  COMMIT_COUNT=$(get_commit_count "$PREV_TAG" "$TAG")

  if [[ $COMMIT_COUNT -gt 0 ]]; then
    # Get timestamps and calculate hours
    RESULT=$(get_commit_timestamps "$PREV_TAG" "$TAG" | calculate_session_hours)
    SECONDS_VAL=$(echo "$RESULT" | awk '{print $1}')
    SESSIONS=$(echo "$RESULT" | awk '{print $2}')

    if [[ -n "$SECONDS_VAL" ]] && [[ "$SECONDS_VAL" -gt 0 ]]; then
      HOURS=$(format_hours "$SECONDS_VAL")

      # Update totals
      TOTAL_COMMITS=$((TOTAL_COMMITS + COMMIT_COUNT))
      TOTAL_SESSIONS=$((TOTAL_SESSIONS + SESSIONS))
      TOTAL_SECONDS=$((TOTAL_SECONDS + SECONDS_VAL))

      printf "%-12s %-12s %8d %10d %7sh\n" "$TAG" "$TAG_DATE" "$COMMIT_COUNT" "$SESSIONS" "$HOURS"
    fi
  fi

  PREV_TAG="$TAG"
done < <(get_sorted_tags)

# Check for commits after last tag
if [[ -n "$PREV_TAG" ]]; then
  UNRELEASED_COUNT=$(get_commit_count "$PREV_TAG" "HEAD")

  if [[ $UNRELEASED_COUNT -gt 0 ]]; then
    RESULT=$(get_commit_timestamps "$PREV_TAG" "HEAD" | calculate_session_hours)
    SECONDS_VAL=$(echo "$RESULT" | awk '{print $1}')
    SESSIONS=$(echo "$RESULT" | awk '{print $2}')

    if [[ -n "$SECONDS_VAL" ]] && [[ "$SECONDS_VAL" -gt 0 ]]; then
      HOURS=$(format_hours "$SECONDS_VAL")

      TOTAL_COMMITS=$((TOTAL_COMMITS + UNRELEASED_COUNT))
      TOTAL_SESSIONS=$((TOTAL_SESSIONS + SESSIONS))
      TOTAL_SECONDS=$((TOTAL_SECONDS + SECONDS_VAL))

      printf "${YELLOW}%-12s %-12s %8d %10d %7sh${NC}\n" "unreleased" "$(date +%Y-%m-%d)" "$UNRELEASED_COUNT" "$SESSIONS" "$HOURS"
    fi
  fi
fi

# Print totals
echo ""
printf "${BOLD}%-12s %-12s %8d %10d %7sh${NC}\n" "TOTAL" "" "$TOTAL_COMMITS" "$TOTAL_SESSIONS" "$(format_hours $TOTAL_SECONDS)"
echo ""
echo -e "${CYAN}Note:${NC} Times are estimates based on session analysis (${SESSION_GAP_SECONDS}s gap threshold)."
echo -e "      Release commits (chore(release):) are excluded from calculations."
