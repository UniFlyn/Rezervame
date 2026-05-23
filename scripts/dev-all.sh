#!/bin/bash
# Start Backend (4000), Web (3000), and Admin (3001) for local development.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:4000/api}"

echo "API base: $NEXT_PUBLIC_API_BASE_URL"
echo "Starting Backend on :4000, Web on :3000, Admin on :3001 …"

cd "$ROOT/Backend" && npm run start:dev &
BACK_PID=$!

cd "$ROOT/Web" && PORT=3000 npm run dev &
WEB_PID=$!

cd "$ROOT/Admin" && PORT=3001 npm run dev &
ADMIN_PID=$!

trap 'kill $BACK_PID $WEB_PID $ADMIN_PID 2>/dev/null' EXIT INT TERM

echo ""
echo "  Web:     http://localhost:3000"
echo "  Admin:   http://localhost:3001/admin"
echo "  API:     http://localhost:4000/api"
echo ""
echo "Press Ctrl+C to stop all."

wait
