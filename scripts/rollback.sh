#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  COSMIC INTENTIONS — SAFE ROLLBACK
#  Restores the whole site to a known-good backup, as a NEW commit
#  (no history rewrite, fully reversible), then pushes to redeploy.
#
#  Usage:  bash scripts/rollback.sh <tag-or-commit>
#  No arg → shows you the available backups to pick from.
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."
REF="${1:-}"

if [ -z "$REF" ]; then
  echo "Usage: bash scripts/rollback.sh <tag-or-commit>"
  echo
  echo "Backup tags (safest to roll back to):"
  git tag -l "CI-*" | tail -6 | sed 's/^/  /'
  echo
  echo "Recent commits:"
  git log --oneline -8 | sed 's/^/  /'
  echo
  echo "FASTEST option (no command): Netlify dashboard → Deploys →"
  echo "  find a known-good deploy → 'Publish deploy'. Instant, no git."
  exit 0
fi

echo ">> Rolling the site back to: $REF"
git fetch --tags --quiet origin 2>/dev/null || true
git checkout "$REF" -- .
git commit -m "rollback: restore site to $REF" >/dev/null
git push origin main
echo ">> Pushed. In ~90s run:  bash scripts/health.sh   (confirm deploy = ready)"
