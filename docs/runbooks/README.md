# Runbooks

Operational how-tos for airplane-frame. Agents: start at `.cursor/skills/airplane-frame-ops/SKILL.md`, then these files.

| Runbook | When |
|---------|------|
| [cloudflare-signup.md](./cloudflare-signup.md) | New machine / new Cloudflare account; Wrangler login |
| [secrets.md](./secrets.md) | Local `.dev.vars`, production secrets, rotation |
| [deploy-worker.md](./deploy-worker.md) | Test, deploy, and curl-verify the Worker |
| [local-dev.md](./local-dev.md) | Local Pages + Wrangler (own IP); **agents start the stack** for the user |
| [pages.md](./pages.md) | GitHub Pages enable, local preview, front-end UAT |

**Production Worker (legacy / rollback):** `https://airplane-frame.danjohnsonnj.workers.dev` — shared egress often rate-limited by airplanes.live  
**Target production API:** `https://api.danjnj.com` (Cloudflare Tunnel → Pi; not live until Tunnel + Slice 3)  
**GitHub Pages (Phase 3):** `https://danjohnsonnj.github.io/airplane-frame/`  
**Account workers.dev subdomain:** `danjohnsonnj.workers.dev`  
**Phase 6.5:** Pi-hosted Worker + Tunnel — see `docs/plans/airplane-frame/HANDOFF.md` and `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md`

Related: `spike/CREDENTIALS.md` (AirLabs / data APIs), `docs/plans/airplane-frame/HANDOFF.md` (current phase), root `README.md` (site entry).
