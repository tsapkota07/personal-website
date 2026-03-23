#!/usr/bin/env bash
# ============================================================
# run-local.sh — serve the personal website on localhost
# Replaces serve.sh. Kills any existing server on the port
# before starting fresh, so you can re-run without cleanup.
# ============================================================

set -euo pipefail

PORT="${1:-3000}"
DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill anything already on the port
if lsof -ti :"$PORT" &>/dev/null; then
  echo "→ Port $PORT in use — killing existing process..."
  kill "$(lsof -ti :"$PORT")" 2>/dev/null || true
  sleep 0.3
fi

echo "→ Serving at http://localhost:$PORT"
echo "→ Press Ctrl+C to stop."

# Open browser after a short delay so the server is up first
sleep 0.4 && open "http://localhost:$PORT" &

cd "$DIR" && python3 -m http.server "$PORT"
