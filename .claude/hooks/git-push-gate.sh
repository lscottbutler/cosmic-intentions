#!/usr/bin/env bash
# Block `git push` to protect Netlify build credits (each push = a full deploy).
# Uses exit code 2 (hard hook veto) because permission decisions are ignored under
# bypassPermissions mode. Escape hatch for an intentional deploy: create the marker
# file .claude/ALLOW_PUSH, push, then remove it. Claude only creates that marker when
# Scott says "push it live". Commits, status, log, etc. are unaffected.
d=$(cat)
# Match only a real `git push` invocation (optionally `git -C <path> push`),
# NOT the word "push" inside a commit message or other text.
if printf '%s' "$d" | grep -qiE 'git( +-[cC] +[^ ]+)? +push([ ";&]|\\|$)'; then
  if [ -f "C:/WORK/ROOT/.claude/ALLOW_PUSH" ]; then
    exit 0   # intentional deploy — allow this push through
  fi
  echo "git push BLOCKED to protect Netlify credits (it deploys + burns a build). To deploy, tell Claude 'push it live' — it unlocks for exactly one push." >&2
  exit 2
fi
exit 0
