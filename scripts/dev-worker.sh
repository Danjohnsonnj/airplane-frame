#!/usr/bin/env bash
# Local Wrangler Worker — airplanes.live sees your IP, not Cloudflare shared egress.
set -euo pipefail
cd "$(dirname "$0")/../worker"
if [[ ! -f .dev.vars ]]; then
  echo "Missing worker/.dev.vars — copy from .dev.vars.example and set APP_SHARED_SECRET + AIRLABS_API_KEY" >&2
  exit 1
fi

lan_ip=""
for iface in en0 en1; do
  if lan_ip=$(ipconfig getifaddr "$iface" 2>/dev/null); then
    break
  fi
done

echo "Worker: http://127.0.0.1:8788/health"
if [[ -n "$lan_ip" ]]; then
  echo "      LAN: http://${lan_ip}:8788/health"
fi
echo "(pair with scripts/dev-pages.sh on :8080)"
exec npx wrangler dev --ip 0.0.0.0 --port 8788
