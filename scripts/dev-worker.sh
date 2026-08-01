#!/usr/bin/env bash
# Local Wrangler Worker — airplanes.live sees your IP, not Cloudflare shared egress.
set -euo pipefail
cd "$(dirname "$0")/../worker"
if [[ ! -f .dev.vars ]]; then
  echo "Missing worker/.dev.vars — copy from .dev.vars.example and set APP_SHARED_SECRET + AIRLABS_API_KEY" >&2
  exit 1
fi
echo "Worker: http://127.0.0.1:8788/ (pair with scripts/dev-pages.sh on :8080)"
exec npx wrangler dev --ip 127.0.0.1 --port 8788
