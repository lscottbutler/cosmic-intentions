# SessionEnd hook — append this session's git commits to the master brief.
# Logs every commit made since the recorded baseline SHA, then advances the
# baseline to current HEAD so the next session starts clean. Deterministic:
# it harvests commit subjects only (no LLM summarizing).
$ErrorActionPreference = 'SilentlyContinue'
try {
  # Decode git's UTF-8 stdout correctly (em-dashes etc. in commit subjects).
  try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
  $root     = (Resolve-Path "$PSScriptRoot\..\..").Path
  $brief    = Join-Path $root 'docs\CLAUDE_MASTER_BRIEF.txt'
  $baseFile = Join-Path $PSScriptRoot '.session-base-sha'

  if (-not (Test-Path $brief))    { exit 0 }
  if (-not (Test-Path $baseFile)) { exit 0 }

  $base = (Get-Content $baseFile -Raw).Trim()
  if (-not $base) { exit 0 }

  $head = (& git -C $root rev-parse HEAD).Trim()
  if ($LASTEXITCODE -ne 0 -or -not $head) { exit 0 }
  if ($head -eq $base) { exit 0 }   # no new commits this session

  $log = & git -C $root log "$base..HEAD" --pretty=format:'%h %s'
  if ($LASTEXITCODE -ne 0 -or -not $log) { exit 0 }

  $date  = Get-Date -Format 'yyyy-MM-dd'
  $lines = @('', "[$date] auto-logged commits:")
  foreach ($l in ($log -split "`n")) {
    if ($l.Trim()) { $lines += "  $($l.Trim())" }
  }

  Add-Content -Path $brief -Value ($lines -join "`r`n") -Encoding utf8

  # Advance baseline so these commits aren't logged again next session.
  Set-Content -Path $baseFile -Value $head -Encoding ascii -NoNewline
} catch {}
exit 0
