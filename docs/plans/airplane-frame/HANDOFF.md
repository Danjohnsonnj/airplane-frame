# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 6.5 **DONE** (Pi Tunnel cutover). Phase 6 poster polish **deferred**.

**Next action (cold-start executable):**

1. Read [docs/runbooks/pi-worker.md](../../runbooks/pi-worker.md) — especially **Reboot / power-loss**.
2. **Before moving the Pi:** on the Pi, confirm boot-enabled services (commands in that runbook). Then `sudo reboot` or power-cycle; after Wi‑Fi returns, verify local + public `/health`.
3. **Deferred (do not start unless asked):** Phase 6 poster UAT/polish ([visual-direction.md](./visual-direction.md), carrier-brand-alias). Rotate secrets exposed in earlier chat when convenient.
4. Production site: https://danjohnsonnj.github.io/airplane-frame/ → API `https://api.danjnj.com`.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (ops / resume):**

- docs/runbooks/pi-worker.md — Pi layout, systemd, Tunnel, **reboot**
- docs/runbooks/secrets.md — Pi `worker.env` vs Pages Bearer
- docs/runbooks/pages.md — `?worker=cloudflare` rollback
- tech-brief.md — topology
- process.md — before committing

**Index (load on demand):**

- product-brief.md — background, goals, rationale, non-goals, boundaries
- phases.md — phase status (6.5 DONE; Phase 6 polish deferred)
- progress-log.md — dated history
- lessons.md — curated toolkit
- phase-6.plan.md / carrier-brand-alias.plan.md / visual-direction.md — deferred poster polish
- docs/runbooks/README.md — ops index
- spike/README.md — Phase 1 spike
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks
- `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md` — Phase 6.5 plan (complete)

**Key facts (resume without re-discovery):**

| Fact | Value |
|------|--------|
| Branch | `main` (Pi checkout: `/opt/airplane-frame` on `main`) |
| Target API | `https://api.danjnj.com` |
| Rollback | `?worker=cloudflare` → `workers.dev` (often EMPTY/429 — expected) |
| Cloudflare zone | `danjnj.com` **Active**; Squarespace `www` = **DNS only** |
| Tunnel | `airplane-frame-pi`; `api.danjnj.com` → `http://127.0.0.1:8788`; CNAME → `3f42e0bf-6401-421d-8f4f-fc6d14201893.cfargotunnel.com` |
| Pi | `mypi` / `192.168.1.46` (Wi‑Fi); **arm64**; eth MAC `B8:27:EB:7C:EE:0F`; Wi‑Fi MAC `B8:27:EB:29:BB:5A` |
| Pi SSH | `ssh pi@192.168.1.46` from **Terminal.app** (Cursor LAN often blocked) |
| Boot services | `airplane-frame-worker.service`, `airplane-frame-sync.timer`, `cloudflared` — must be **enabled** |
| Secrets | `/etc/airplane-frame/worker.env` root:root mode 600 |
| Adapter | `worker/src/node/` — `npm run start:pi` |

**Verify before coding:**

```bash
git branch --show-current   # expect main for prod ops
node --test js/lib.test.js
cd worker && npm test
```

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later.

**Open items:** **Deferred:** Phase 6 poster polish/UAT. Rotate secrets exposed in chat/screenshot when convenient. Settings period polish, geocoder polish, livery source deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md). After Pi move: confirm DHCP/Wi‑Fi and public `/health`.

**Last updated:** 2026-08-02 — cutover done; poster polish deferred; reboot/power-move checklist in pi-worker.md
