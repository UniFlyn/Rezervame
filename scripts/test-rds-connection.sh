#!/usr/bin/env bash
# Test RDS / Postgres connectivity and print fixes for common errors.
#
# Option A — full URL (password must be URL-encoded: # → %23, * → %2A):
#   ./scripts/test-rds-connection.sh 'postgresql://rezervame:PASS@host:5432/rezervame?sslmode=require'
#
# Option B — separate vars (password can be raw):
#   PGHOST=rezervame-db.xxx.rds.amazonaws.com PGUSER=rezervame PGPASSWORD='iPhone5*#143' PGDATABASE=rezervame \
#     ./scripts/test-rds-connection.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URL="${1:-${DATABASE_URL:-}}"

if [[ -z "$URL" && -n "${PGHOST:-}" ]]; then
  URL="$(node scripts/lib/database-url.mjs)"
  echo "Built DATABASE_URL from PGHOST/PGUSER/PGPASSWORD (password encoded)."
fi

if [[ -z "$URL" ]]; then
  echo "Usage: $0 'postgresql://user:ENCODED_PASS@host:5432/db?sslmode=require'"
  echo "   or: PGHOST=... PGUSER=... PGPASSWORD=... PGDATABASE=... $0"
  exit 1
fi

HOST="$(node -e "console.log(new URL(process.argv[1]).hostname)" "$URL")"
echo "Host: $HOST"
echo "DNS:"
nslookup "$HOST" 2>/dev/null | grep -A2 'Name:' || true
IP="$(nslookup "$HOST" 2>/dev/null | awk '/^Address: / {print $2}' | tail -1)"
echo "Resolved IP: ${IP:-unknown}"

if [[ "$IP" == 172.* || "$IP" == 10.* || "$IP" == 192.168.* ]]; then
  echo ""
  echo "⚠️  PRIVATE IP ($IP) — RDS is NOT publicly reachable from your Mac."
  echo "   Fix in AWS Console:"
  echo "   1. RDS → rezervame-db → Modify → Connectivity → Public access: Yes"
  echo "   2. Apply immediately (or next maintenance)"
  echo "   3. Security group → Inbound → PostgreSQL 5432 → My IP"
  echo "   4. Wait until status Available; DNS should show a public IP"
  echo "   OR migrate from EC2 in the same VPC (no public RDS needed)."
fi

echo ""
echo "Testing port 5432 (5s timeout)..."
if nc -zv -w 5 "$HOST" 5432 2>&1; then
  echo "Port 5432 is open."
else
  echo "Port 5432 not reachable (timeout/refused)."
fi

echo ""
echo "Testing Prisma..."
if (cd Backend && DATABASE_URL="$URL" npx prisma db execute --stdin <<< 'SELECT 1 AS ok' 2>&1); then
  echo "✅ Database connection OK"
else
  CODE=$?
  echo ""
  echo "If you saw P1013: URL-encode password (# → %23, * → %2A)"
  echo "Example password iPhone5*#143gmail → iPhone5%2A%23143gmail"
  echo ""
  echo "If you saw P1001: enable RDS public access + security group (see above)"
  exit $CODE
fi
