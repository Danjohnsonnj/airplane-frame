# airplane-frame - Handoff

**Goal:** Personal web app showing 3–5 nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Phase 6.5 — Pi-hosted Worker + Cloudflare Tunnel (egress)

**Next action (cold-start executable):**

1. Read required reading below.
2. **Pi API live:** systemd + Tunnel; `https://api.danjnj.com/health` → 200.
3. **Slice 8 in flight:** merge landed / landing on `main` — on Pi: checkout `main`, pull/sync, confirm `/health`. Then Pages UAT: `https://danjohnsonnj.github.io/airplane-frame/` → Network `/flights` to `api.danjnj.com`; rollback `?worker=cloudflare`.
4. Resume Phase 6 poster UAT once `/flights` pack is reliable via home egress.

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (this phase):**

- tech-brief.md — topology, egress blocker, target `api.danjnj.com`
- lessons.md — airplanes.live 429; Cloudflare grey-cloud SSL; Cursor LAN block
- docs/runbooks/local-dev.md — own-IP local/LAN preview
- docs/runbooks/pages.md — Pages URL selection + `?worker=cloudflare` / `?worker=prod`
- docs/runbooks/secrets.md — secret boundaries (Pi holds keys; Pages never does)
- docs/runbooks/pi-worker.md — Pi layout, systemd units, sync script, Tunnel
- process.md — how we work (read before committing)
- `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md` — full plan (Progress + slices 5–8 done/in progress)

**Index (load on demand):**

- product-brief.md — background, goals, rationale, non-goals, boundaries
- tech-brief.md — current vs proposed architecture, verified findings
- phases.md — phases + per-phase verify steps
- progress-log.md — dated history of decisions/learnings/overwrites
- lessons.md — curated, accreted toolkit
- phase-3.plan.md / phase-4.plan.md / phase-4.5.plan.md / phase-6.plan.md / carrier-brand-alias.plan.md — phase plans
- visual-direction.md / carrier-brand-alias.plan.md — resume Phase 6 UAT after egress is fixed
- docs/runbooks/README.md — ops runbook index
- spike/README.md — Phase 1 spike entry
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks

**Key facts (resume without re-discovery):**

| Fact | Value |
|------|--------|
| Branch | `main` @ `da96c2f` (Pi should checkout `main` next) |
| Target API | `https://api.danjnj.com` (`PROD_API_BASE` in `js/config.js`) |
| Rollback | `?worker=cloudflare` → `https://airplane-frame.danjohnsonnj.workers.dev` |
| Cloudflare zone | `danjnj.com` **Active** (Free); NS `amy`/`shane.ns.cloudflare.com`; Squarespace `www` = **DNS only** |
| Tunnel | `airplane-frame-pi` **Healthy**; published app `api.danjnj.com` → `http://127.0.0.1:8788`; CNAME → `3f42e0bf-6401-421d-8f4f-fc6d14201893.cfargotunnel.com` |
| Pi | `mypi` / `192.168.1.46` (Wi‑Fi); arm64; eth MAC `B8:27:EB:7C:EE:0F`; Wi‑Fi MAC `B8:27:EB:29:BB:5A` |
| Pi SSH | `ssh pi@192.168.1.46` from **Terminal.app** (Cursor LAN often blocked — missing Local Network plist) |
| Pi software | Node **v20.19.2**; git; cloudflared; `/opt/airplane-frame` on feature branch; `worker.env` 600; **systemd worker + sync timer enabled** |
| Adapter | `worker/src/node/` — `npm run start:pi`; tests: `cd worker && npm test` |

**Verify before coding:**

```bash
git branch --show-current   # expect feature/pi-node-adapter
node --test js/lib.test.js
cd worker && npm test
```

**Open decisions:** Optional user-selectable N (3–5) deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later.

**Open items:** Pages on `main` still points at `api.danjnj.com` but **adapter code not merged yet** — merge Slice 8 to cut Pages over cleanly; then verify `/flights` via home egress (clears shared-egress 429 blocker). Phase 6 poster UAT after that. Rotate secrets exposed in chat/screenshot when convenient. Settings period polish, geocoder polish, livery source deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).

**Last updated:** 2026-08-02 — systemd + public `/health` OK; next = Slice 8 merge/UAT
