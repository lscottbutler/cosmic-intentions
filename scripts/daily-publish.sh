#!/usr/bin/env bash
# DAILY PUBLISH — Merge staging → main (one deploy).
# Run at the start of each day's session before new work.
set -euo pipefail

echo "── DAILY PUBLISH: staging → main ──"

git fetch -q origin

MAIN_SHA=$(git rev-parse origin/main)
STAGING_SHA=$(git rev-parse origin/staging)

if [ "$MAIN_SHA" = "$STAGING_SHA" ]; then
  echo "  ✅ Nothing to publish — main and staging already in sync."
  exit 0
fi

AHEAD=$(git rev-list --count origin/main..origin/staging)
echo "  Publishing $AHEAD commit(s) from staging → main..."

# Merge staging into main
git checkout -q -B main origin/main
git -c user.name="Claude" -c user.email="noreply@anthropic.com" \
  merge --no-ff origin/staging -m "Publish: daily publish ($(date -u +%Y-%m-%d))"

# Push main, sync staging
git push -q origin main
git push -q origin HEAD:staging

# Return to staging
git fetch -q origin
git checkout -q staging
git reset -q --hard origin/staging

echo "  ✅ Pushed. Netlify deploying now."
echo "  Wait ~90s then run: bash scripts/deploy-status.sh"
