#!/bin/sh
set -eu
cd /workspace
PORT="${PORT:-8080}"
if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/"; then
  exit 0
fi
# Production containers (e.g. Cloud Run) ship a built .output/ and must run
# the built server via `npm start`, not the Vite dev server.
if [ -f .output/server/index.mjs ]; then
  npm start >>/tmp/app-startup.log 2>&1 &
else
  npm run dev >>/tmp/app-startup.log 2>&1 &
fi
