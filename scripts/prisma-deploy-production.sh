#!/usr/bin/env bash
# Production Prisma sync for Render / RDS (non-empty DB restored via pg_dump).
# Does NOT exit early — root `npm run build` continues to `nest build` after this script.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/Backend"

npx prisma generate

LOG="$(mktemp)"
trap 'rm -f "$LOG"' EXIT

if npx prisma migrate deploy 2>&1 | tee "$LOG"; then
  echo "✅ prisma migrate deploy succeeded"
elif grep -q 'P3005' "$LOG"; then
  echo "→ P3005: database has schema but no migration history — baselining…"
  for d in prisma/migrations/*/; do
    name="$(basename "$d")"
    echo "  migrate resolve --applied $name"
    npx prisma migrate resolve --applied "$name" || true
  done
  if npx prisma migrate deploy; then
    echo "✅ migrate deploy OK after baseline"
  else
    echo "→ migrate deploy failed after baseline; running prisma db push…"
    npx prisma db push
    echo "✅ prisma db push succeeded"
  fi
else
  echo "→ migrate deploy failed; running prisma db push (no --accept-data-loss)…"
  npx prisma db push
  echo "✅ prisma db push succeeded"
fi
