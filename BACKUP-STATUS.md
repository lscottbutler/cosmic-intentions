# Cosmic Intentions backup — 2026-10-18

**STATUS: PARTIAL. Not a complete disaster-recovery backup.**

## Code snapshot

This dated branch preserves all 909 tracked files from production commit `06fd1af4be7b81d1d863f5cd8c52ca8e73a79661`. Open **Code → Download ZIP** to download tracked source. Commit history remains available through GitHub.

## Other recovery copies

A separate private recovery export was saved for Scott: 12 application tables / 103 rows (secret fields excluded), database catalog/policies/functions/triggers/grants, two account identity references, storage inventory, deployment configuration and Bible copy. It is not a full PostgreSQL/auth backup. Supabase reported three buckets and zero objects at inspection.

## Blocking gaps

- `db-backups` last updated September 20, 2026.
- Recent database and encrypted offsite workflows fail before steps start. Account/platform cause remains unknown.
- A full auth/roles dump, independent full repository/assets mirror, secure secret recovery and an isolated full restore test are not complete.
- Local-only source originals and browser drafts, plus separate Player Builder D1/R2 data, are outside this export.

Inspect the latest failed database run: https://github.com/lscottbutler/cosmic-intentions/actions/runs/39067599109 . Do not restore production while diagnosing backup failures.

No production code, database data, authentication or site privacy was changed for this backup task.
