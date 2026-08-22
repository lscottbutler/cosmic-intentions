#!/usr/bin/env bash
# Gate `git push` behind an explicit approval prompt so Claude can never auto-push
# and burn Netlify build credits. Commits, status, log, etc. are unaffected.
# Fires as a PreToolUse hook on Bash/PowerShell; reads the tool call JSON on stdin.
d=$(cat)
if printf '%s' "$d" | grep -qiE 'git.*push'; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"git push is gated to protect Netlify build credits — approve ONLY when you want to deploy. Say '\''push it live'\'' and approve this prompt."}}'
fi
exit 0
