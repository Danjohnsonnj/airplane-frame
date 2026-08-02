#!/usr/bin/env bash
# Serve static Pages UI from repo root (port 8080).
set -euo pipefail
cd "$(dirname "$0")/.."

lan_ip=""
for iface in en0 en1; do
  if lan_ip=$(ipconfig getifaddr "$iface" 2>/dev/null); then
    break
  fi
done

echo "Pages UI: http://127.0.0.1:8080/"
if [[ -n "$lan_ip" ]]; then
  echo "         LAN: http://${lan_ip}:8080/ (same Wi-Fi devices)"
fi
echo "(also run scripts/dev-worker.sh in another terminal)"
exec python3 -m http.server 8080 --bind 0.0.0.0
