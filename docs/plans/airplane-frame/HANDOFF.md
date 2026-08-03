# airplane-frame - Handoff

**Goal:** Personal web app showing up to **10** nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Plane silhouettes **DONE** (user UAT approved). Enrich efficiency + pack size **DONE**. Phase 6.5 Pi Tunnel **DONE**. Phase 6 poster polish **deferred**.

**Next action (cold-start executable):**

1. Read process.md (before any commit).
2. **Deferred (do not start unless asked):** Phase 6 poster UAT/polish (carrier-brand-alias extras). Optional follow-ups: callsign enrichment cache; tune min-altitude default.
3. Production site: https://danjohnsonnj.github.io/airplane-frame/ → API `https://api.danjnj.com`.
4. Pi reboot/move checklist: [pi-worker.md](../../runbooks/pi-worker.md).

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (idle / next ask):**

- process.md — before committing
- tech-brief.md — hexdb-first pipeline + caps
- docs/runbooks/pi-worker.md — ops / reboot

**Index (load on demand):**

- lessons.md — cache-by-pin + hexdb-first + silhouette resolve
- product-brief.md — background (may still say 3–5 historically)
- phases.md — phase status (6.5 DONE; Phase 6 polish deferred)
- progress-log.md — dated history
- docs/runbooks/local-dev.md / pages.md / deploy-worker.md / secrets.md
- phase-6.plan.md / carrier-brand-alias.plan.md / visual-direction.md — poster locks + deferred polish
- spike/README.md — Phase 1 spike
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks
- `~/.cursor/plans/enrich_efficiency_pool_355002fc.plan.md` — shipped plan (reference)
- `~/.cursor/plans/plane_silhouette_ship_81841268.plan.md` — silhouette ship DONE (NEC corpus)

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
| Env (live) | `MAX_ATTEMPT=36`, `MAX_AIRLABS=5`, `PACK_SIZE=10`, `MAX_RESULTS=20` |
| Last ship | Plane silhouettes (`assets/planes/` + `js/plane-asset.js`); prior `114fb12` enrich efficiency |

**Verify before coding:**

```bash
git branch --show-current   # expect main
node --test js/lib.test.js js/plane-asset.test.js
cd worker && npm test
```

**Open decisions:** Optional user-selectable N deferred; tune min-altitude default after more real traffic; settings tag-chip chrome explore later; callsign enrichment cache follow-up.

**Open items:** **Deferred:** Phase 6 poster polish/UAT. Rotate secrets exposed in chat when convenient. Settings/geocoder/livery deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).

**Last updated:** 2026-08-02 — silhouette ship UAT approved; next = deferred Phase 6 polish
