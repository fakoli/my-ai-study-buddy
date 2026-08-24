#!/bin/bash
# Stop Study Buddy processes. Tailscale Serve config is left intact.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.run"
for file in "$RUN_DIR/backend.pid" "$RUN_DIR/host.pid"; do
  if [[ -f "$file" ]]; then
    kill "$(cat "$file")" 2>/dev/null || true
    rm -f "$file"
  fi
done
pkill -f "$ROOT/scripts/serve-tailnet.mjs" 2>/dev/null || true
pkill -f "vite preview.*4173" 2>/dev/null || true
pkill -f "uvicorn main:app.*--port 8010" 2>/dev/null || true
tailscale serve --https=4443 off >/dev/null 2>&1 || true
