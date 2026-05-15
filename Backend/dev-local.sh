#!/usr/bin/env bash
# Start Postgres (Docker), sync schema, seed, run API on 0.0.0.0:4000 for simulators/emulators.
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit DATABASE_URL if needed."
fi
if command -v docker >/dev/null 2>&1; then
  docker compose up -d
  echo "Waiting for PostgreSQL on port 5432..."
  for _ in {1..40}; do
    if command -v nc >/dev/null 2>&1 && nc -z localhost 5432 2>/dev/null; then
      break
    fi
    sleep 1
  done
else
  echo "Docker not found — ensure PostgreSQL is running and DATABASE_URL in .env is correct."
fi
npm run db:setup
exec npm run start:dev
