#!/usr/bin/env bash
# PREFLIGHT CHECK — Run at the start of every session.
# If staging is ahead of main, blocks until the daily publish happens.
set -euo pipefail

echo "── PREFLIGHT: Daily Publish Check ──"

git fetch -q origin

MAIN_SHA=$(git rev-parse origin/main)
STAGING_SHA=$(git rev-parse origin/staging)

if [ "$MAIN_SHA" = "$STAGING_SHA" ]; then
  echo "  ✅ main and staging are in sync. No publish needed."
  exit 0
fi

AHEAD=$(git rev-list --count origin/main..origin/staging)

if [ "$AHEAD" -gt 0 ]; then
  echo "  ❌ staging is $AHEAD commit(s) ahead of main."
  echo "  >> DAILY PUBLISH REQUIRED before any new work."
  echo ""
  echo "  Unpublished commits:"
  git log --oneline origin/main..origin/staging
  echo ""
  echo "  Run: bash scripts/daily-publish.sh"
  exit 1
else
  echo "  ✅ main is up to date with staging."
  exit 0
fi
