#!/usr/bin/env bash
set -euo pipefail
umask 077
TASK_DIR=$(mktemp -d)
trap 'rm -rf "$TASK_DIR"' EXIT
PAYLOAD="$TASK_DIR/payload"
OUT="$TASK_DIR/encrypted"
mkdir -p "$PAYLOAD" "$OUT"
export PGCONNECT_TIMEOUT=15
export PATH="/usr/lib/postgresql/17/bin:$PATH"
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  DB_ARGS=("$SUPABASE_DB_URL")
else
  DB_ARGS=(-h aws-0-ap-northeast-1.pooler.supabase.com -p 5432 -U postgres.wbqzwbubbeorcknevips -d postgres)
  if ! psql "${DB_ARGS[@]}" -XAtqc 'select 1' >/dev/null 2>&1; then
    DB_ARGS=(-h aws-1-ap-northeast-1.pooler.supabase.com -p 5432 -U postgres.wbqzwbubbeorcknevips -d postgres)
  fi
fi
# These are read-only exports. No production restoration or database mutation.
INVENTORY_SQL="select coalesce(json_agg(o order by o.bucket_id,o.name),'[]'::json) from (select bucket_id,name,metadata,updated_at from storage.objects) o"
psql "${DB_ARGS[@]}" -XAtqc "$INVENTORY_SQL" > "$PAYLOAD/storage-inventory.json"
psql "${DB_ARGS[@]}" -XAtqc "select coalesce(json_agg(b),'[]'::json) from storage.buckets b" > "$PAYLOAD/storage-buckets.json"
pg_dump "${DB_ARGS[@]}" --format=custom --file="$PAYLOAD/database.dump"
pg_restore --list "$PAYLOAD/database.dump" > "$PAYLOAD/database-contents.txt"
test -s "$PAYLOAD/database-contents.txt"
pg_dumpall "${DB_ARGS[@]}" --roles-only --no-role-passwords > "$PAYLOAD/roles.sql"
python3 scripts/backup-storage.py "$PAYLOAD/storage-inventory.json" "$PAYLOAD/storage"
psql "${DB_ARGS[@]}" -XAtqc "$INVENTORY_SQL" > "$TASK_DIR/storage-after.json"
cmp "$PAYLOAD/storage-inventory.json" "$TASK_DIR/storage-after.json"
git archive --format=zip --output="$PAYLOAD/source.zip" HEAD
git bundle create "$PAYLOAD/repository.bundle" --all
git bundle verify "$PAYLOAD/repository.bundle" >/dev/null 2>&1
git rev-parse HEAD > "$PAYLOAD/SOURCE-COMMIT.txt"
cp docs/BACKUP-RECOVERY.md "$PAYLOAD/READ-ME-FIRST.md"
python3 - "$PAYLOAD" <<'PY'
import hashlib,json,pathlib,sys,zipfile
p=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(p/'source.zip') as z:
    assert z.testzip() is None
manifest={str(f.relative_to(p)):hashlib.sha256(f.read_bytes()).hexdigest() for f in p.rglob('*') if f.is_file()}
(p/'SHA256-MANIFEST.json').write_text(json.dumps(manifest,indent=2))
PY
tar -czf "$TASK_DIR/payload.tar.gz" -C "$PAYLOAD" .
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
NAME="CI-backup-${STAMP}-${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}.tar.gz.gpg"
printf '%s' "$BACKUP_PASSPHRASE" > "$TASK_DIR/passphrase"
gpg --batch --pinentry-mode loopback --passphrase-file "$TASK_DIR/passphrase" --symmetric --cipher-algo AES256 -o "$OUT/$NAME" "$TASK_DIR/payload.tar.gz"
gpg --batch --pinentry-mode loopback --passphrase-file "$TASK_DIR/passphrase" --decrypt "$OUT/$NAME" 2>/dev/null | cmp "$TASK_DIR/payload.tar.gz" -
(cd "$OUT" && sha256sum "$NAME" > "$NAME.sha256")
mkdir -p "$TASK_DIR/rclone"
printf '%s' "$RCLONE_CONF" > "$TASK_DIR/rclone/config"
for REMOTE in gdrive onedrive; do
  # copy and check only: NEVER sync, delete, prune or overwrite old checkpoints.
  EXTRA=()
  DEST="$REMOTE:CI-Backups/"
  if [ "$REMOTE" = gdrive ]; then
    EXTRA=(--drive-root-folder-id 12OTW3LTrzHNFhKChvFooCUPxnFbP6HwD)
    DEST='gdrive:encrypted/'
  fi
  rclone --config "$TASK_DIR/rclone/config" "${EXTRA[@]}" copy "$OUT" "$DEST" --immutable
  rclone --config "$TASK_DIR/rclone/config" "${EXTRA[@]}" check "$OUT" "$DEST" --download --one-way
done
printf 'Verified encrypted backup: %s\n' "$NAME" >> "$GITHUB_STEP_SUMMARY"
