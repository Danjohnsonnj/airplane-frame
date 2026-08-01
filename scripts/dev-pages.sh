#!/usr/bin/env bash
# Serve static Pages UI from repo root (port 8080).
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Pages UI: http://127.0.0.1:8080/ (also run scripts/dev-worker.sh in another terminal)"
exec python3 -m http.server 8080
