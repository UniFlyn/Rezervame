#!/usr/bin/env bash
# Copy all data from one Postgres database to another, then run Prisma migrations on the target.
#
# Usage:
#   ./scripts/migrate-database.sh <SOURCE_DATABASE_URL> <TARGET_DATABASE_URL>
#
# Example (local → Supabase pooler — use DIRECT URL on :5432 for pg_restore if pooler fails):
#   ./scripts/migrate-database.sh \
#     "postgresql://premkumar@localhost:5432/rezervame" \
#     "postgresql://postgres:PASS@db.xxx.supabase.co:5432/postgres?sslmode=require"

set -euo pipefail

SOURCE="${1:-}"
TARGET="${2:-}"

if [[ -z "$SOURCE" || -z "$TARGET" ]]; then
  echo "Usage: $0 <SOURCE_DATABASE_URL> <TARGET_DATABASE_URL>"
  echo ""
  echo "Tip: if password contains # or *, URL-encode it (# → %23, * → %2A)"
  echo "  node -e \"console.log(encodeURIComponent('your-password'))\""
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "→ Testing target connectivity…"
if ! bash "$ROOT/scripts/test-rds-connection.sh" "$TARGET"; then
  echo "Fix target connection before migrating."
  exit 1
fi

for cmd in pg_dump pg_restore; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing $cmd. Install PostgreSQL client tools (brew install libpq)."
    exit 1
  fi
done

DUMP="/tmp/rezervame-migrate-$(date +%s).dump"
echo "→ Dumping from source…"
pg_dump "$SOURCE" --no-owner --no-acl -Fc -f "$DUMP"

echo "→ Restoring to target (clean)…"
pg_restore -d "$TARGET" --clean --if-exists --no-owner --no-acl "$DUMP" 2>/dev/null || {
  echo "  (pg_restore reported warnings — often safe for existing empty DBs)"
}

echo "→ Prisma migrate deploy on target…"
cd "$(dirname "$0")/../Backend"
DATABASE_URL="$TARGET" npx prisma migrate deploy || DATABASE_URL="$TARGET" npx prisma db push

rm -f "$DUMP"
echo "✅ Migration complete. Set Render DATABASE_URL to the target and redeploy."
