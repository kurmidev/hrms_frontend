#!/usr/bin/env bash
# HRMS frontend deploy script.
#
# Run this AFTER new code is already on the server (git pull / rsync / CI
# artifact — this script does not fetch code itself). It installs deps,
# builds the production bundle, and reloads the pm2-managed static server.
#
# Usage:
#   ./scripts/deploy.sh
#
# Env vars:
#   FRONTEND_PORT=4173   Port `serve` listens on (must match ecosystem.config.js / nginx upstream)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "❌ pm2 is not installed or not on PATH. Install with: npm install -g pm2" >&2
  exit 1
fi

echo "==> [frontend] Installing dependencies (npm ci)"
npm install

echo "==> [frontend] Building production bundle"
npm run build

echo "==> [frontend] Reloading pm2 process (zero-downtime if already running, starts fresh otherwise)"
mkdir -p logs
pm2 startOrReload ecosystem.config.js --env production
pm2 save

echo "==> [frontend] Deploy complete — served at http://localhost:${FRONTEND_PORT:-4173}"
echo "    NOTE: the frontend calls the API via relative /api/v1 and /socket.io paths."
echo "    A reverse proxy (nginx) must sit in front of both this port and the backend"
echo "    for those calls to resolve in production — see nginx/nginx.conf at the repo root."
