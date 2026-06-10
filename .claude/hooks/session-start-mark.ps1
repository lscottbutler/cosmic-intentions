# SessionStart hook — seed the baseline commit SHA once.
# Records HEAD only if no baseline exists, so resuming a session does not
# wipe out commits made earlier that haven't been logged yet.
$ErrorActionPreference = 'SilentlyContinue'
try {
  $root     = (Resolve-Path "$PSScriptRoot\..\..").Path
  $baseFile = Join-Path $PSScriptRoot '.session-base-sha'
  if (Test-Path $baseFile) { exit 0 }   # already seeded — leave it
  $sha = & git -C $root rev-parse HEAD
  if ($LASTEXITCODE -eq 0 -and $sha) {
    Set-Content -Path $baseFile -Value ($sha.Trim()) -Encoding ascii -NoNewline
  }
} catch {}
exit 0
