# Runbooks

Operational how-tos for airplane-frame. Agents: start at `.cursor/skills/airplane-frame-ops/SKILL.md`, then these files.

| Runbook | When |
|---------|------|
| [Cloudflare signup (free)](./cloudflare-signup.md) | One-time account, email verify, workers.dev subdomain, and wrangler login |
| [Worker secrets](./secrets.md) | Where APP_SHARED_SECRET and AIRLABS_API_KEY live locally, on the Pi, and in Cloudflare |
| [Deploy Worker](./deploy-worker.md) | Test, deploy, and curl-verify the legacy Cloudflare Worker |
| [Pi Worker (Node adapter + Cloudflare Tunnel)](./pi-worker.md) | Node API, systemd, git sync, and Cloudflare Tunnel at api.danjnj.com |
| [Local development (own IP)](./local-dev.md) | Run Pages plus Wrangler on your IP so airplanes.live is not shared-egress rate-limited |
| [GitHub Pages (front end)](./pages.md) | Enable, preview, and UAT the repo-root static front end |

**Production API:** `https://api.danjnj.com` — Cloudflare Tunnel → Pi ([pi-worker.md](./pi-worker.md); includes reboot checklist)  
**Legacy Worker (rollback):** `https://airplane-frame.danjohnsonnj.workers.dev` — `?worker=cloudflare`; shared egress often rate-limited  
**GitHub Pages:** `https://danjohnsonnj.github.io/airplane-frame/`  
**Account workers.dev subdomain:** `danjohnsonnj.workers.dev`  
**Phase 6.5:** cutover **done** — see `docs/plans/airplane-frame/HANDOFF.md`

Related: `spike/CREDENTIALS.md` (AirLabs / data APIs), `docs/plans/airplane-frame/HANDOFF.md` (current phase), root `README.md` (site entry).
