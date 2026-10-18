# Cosmic Intentions backup and recovery

Status on 2026-10-18: automation repaired in source; NOT yet run successfully.
GitHub Actions is blocked by an account payment/spending-limit error. A green
source review does not establish that credentials, uploads or recovery work.

One six-hour schedule runs `.github/workflows/backup-offsite.yml`. The former
Supabase backup entry point is manual-only and invokes the same encrypted job.
This replaces hourly overlapping work. Existing backups and Git history stay intact.

Required GitHub Actions secret NAMES (never put values in this document):
SUPABASE_DB_PASSWORD or SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY,
BACKUP_PASSPHRASE, RCLONE_CONF. The last must configure `gdrive` and `onedrive`.
Store the encryption passphrase separately in the owner's password manager.
Loss of the passphrase makes encrypted backups unrecoverable.

Each encrypted archive includes tracked source at the recorded commit, fetched
Git history in a verified bundle, PostgreSQL custom-format dump including available
auth/storage schemas and grants, roles without role passwords, bucket/object
inventories, authenticated object downloads and SHA256 manifests. Object listing
comes from the complete SQL inventory, avoiding REST pagination truncation. Any
download failure or detected inventory change fails the run. Database and object
capture is not an atomic cross-service snapshot; quiesce writes for a migration.
Both remote copies are downloaded and compared before success. No automatic
deletion, retention purge or plaintext database commit is performed.

These exports do NOT capture provider control-plane configuration, Netlify secret
values, Auth provider settings, encryption keys, PC-only original media, browser-only
drafts, Google Docs or the separate Sites builder's D1/R2 runtime. Preserve those
independently. They are not proof of a complete service restore.

Recovery must be tested in an isolated private environment, NEVER production:
download an archive and checksum; verify SHA256; decrypt with the separately held
passphrase; inspect the tar before extraction; verify its internal manifest; verify
and clone repository.bundle or inspect source.zip. Use PostgreSQL 17 pg_restore
against a disposable compatible target, inspect role/grant requirements and restore
auth/storage schemas with Supabase-specific guidance. Recreate buckets and upload
objects using the inventory. Reapply provider configuration and secrets separately.
Check record counts, RLS permissions, authorized/unauthorized access, media and login.
Record the test date, target, exact backup filename and outcome. Until that succeeds,
label the backup captured/verified, not restoration-proven.

On every active day, inspect Actions for a success less than six hours old; no fresh
success is a backup incident. Job summaries record outcomes when a runner starts.
Account-wide billing blocks can prevent ALL workflow steps and notifications from
running, so this monitor is currently manual. Do not infer success from a schedule.

Immediate preservation copies are in the existing private `ci.com backups` Drive
folder. The 2026-10-18 code recovery ZIP has 908 of 909 hash-verified tracked files;
the missing coming-back-to-yourself-10m.ogg remains on GitHub. The separate partial
database recovery ZIP has sanitized public data and definitions, not a full dump.
