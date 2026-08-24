#!/bin/bash
# Build and start Study Buddy behind Tailscale Serve.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.run"
mkdir -p "$RUN_DIR"

stop_pid() {
  local file="$1"
  if [[ -f "$file" ]]; then
    kill "$(cat "$file")" 2>/dev/null || true
    rm -f "$file"
  fi
}

stop_pid "$RUN_DIR/backend.pid"
stop_pid "$RUN_DIR/host.pid"
pkill -f "$ROOT/scripts/serve-tailnet.mjs" 2>/dev/null || true
pkill -f "vite preview.*4173" 2>/dev/null || true
pkill -f "uvicorn main:app.*--port 8010" 2>/dev/null || true
sleep 1

# Build a same-origin browser bundle. Node proxies /api/* to FastAPI.
cd "$ROOT/frontend"
VITE_API_URL="/api/v1" npm run build > "$RUN_DIR/build.log" 2>&1

# Keep the backend private to this machine.
cd "$ROOT/backend"
nohup uv run python -m uvicorn main:app \
  --host 127.0.0.1 --port 8010 --http httptools \
  > "$RUN_DIR/backend.log" 2>&1 &
echo $! > "$RUN_DIR/backend.pid"

# Keep the combined host private; Tailscale Serve is the only ingress.
cd "$ROOT"
BACKEND_URL="http://127.0.0.1:8010" \
nohup node "$ROOT/scripts/serve-tailnet.mjs" 4173 \
  > "$RUN_DIR/host.log" 2>&1 &
echo $! > "$RUN_DIR/host.pid"

for _ in {1..30}; do
  if curl -fsS --max-time 2 http://127.0.0.1:4173/health >/dev/null 2>&1 \
    && curl -fsS --max-time 2 http://127.0.0.1:8010/health >/dev/null 2>&1; then
    tailscale serve --bg --yes --https=4443 http://127.0.0.1:4173 >/dev/null
    echo "Study Buddy is ready at https://fakoli-mini.tail4378d.ts.net:4443/"
    exit 0
  fi
  sleep 1
done

echo "Study Buddy did not become ready." >&2
exit 1
