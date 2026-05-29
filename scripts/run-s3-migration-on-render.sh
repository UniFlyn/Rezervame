#!/usr/bin/env bash
# Trigger S3 image migration on production Render (AWS keys live on the server).
#
# Usage:
#   CRON_SECRET=your-secret ./scripts/run-s3-migration-on-render.sh
#
# Or set CRON_SECRET in Backend/.env.local and run without args.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${CRON_SECRET:-}" && -f "$ROOT/Backend/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/Backend/.env.local"
  set +a
fi

API="${API_BASE:-https://rezervame.onrender.com}"
SECRET="${CRON_SECRET:-}"

if [[ -z "$SECRET" ]]; then
  echo "Set CRON_SECRET (Render → Environment) and re-run."
  exit 1
fi

echo "→ POST $API/api/cron/migrate-images-s3"
curl -sS -m 600 -X POST "$API/api/cron/migrate-images-s3?includeHttp=true" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "→ Health check"
curl -sS "$API/api/v1/health" | python3 -m json.tool 2>/dev/null || true
