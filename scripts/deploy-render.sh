#!/bin/bash
# Trigger a Render deploy for rezervame-backend (requires RENDER_API_KEY + RENDER_SERVICE_ID).
set -euo pipefail

if [ -z "${RENDER_API_KEY:-}" ] || [ -z "${RENDER_SERVICE_ID:-}" ]; then
  echo "Set RENDER_API_KEY and RENDER_SERVICE_ID, then re-run."
  echo "  export RENDER_API_KEY=rnd_..."
  echo "  export RENDER_SERVICE_ID=srv_..."
  exit 1
fi

CLI="${RENDER_CLI:-/tmp/render-amd/cli_v1.1.0}"
if [ ! -x "$CLI" ]; then
  curl -sL "https://github.com/render-oss/cli/releases/download/v1.1.0/cli_1.1.0_darwin_amd64.zip" -o /tmp/render-amd.zip
  unzip -o /tmp/render-amd.zip -d /tmp/render-amd
  CLI="/tmp/render-amd/cli_v1.1.0"
fi

CI=true "$CLI" deploys create "$RENDER_SERVICE_ID" --confirm --wait
