# airplane-frame - Handoff

**Goal:** Personal web app showing up to **10** nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Plane silhouettes **DONE**. Silhouette scroll-motion **DONE** (2026-08-05). Enrich efficiency + pack size **DONE**. Phase 6.5 Pi Tunnel **DONE**. adsbdb first-pass **DONE**. **Exploration B callsign enrichment cache DONE** (2026-08-03). Paper texture on flight panels **DONE** (2026-08-05). Phase 6 poster polish **deferred**.

**Next action (cold-start executable):**

1. Read process.md (before any commit).
2. **Deferred (do not start unless asked):** Phase 6 poster UAT/polish; tune min-altitude default.
3. Production: https://danjohnsonnj.github.io/airplane-frame/ → `https://api.danjnj.com`. Pi ops: [pi-worker.md](../../runbooks/pi-worker.md).

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (idle / next ask):**

- process.md — before committing
- tech-brief.md — pipeline, adsbdb attribution, callsign cache
- docs/runbooks/pi-worker.md — ops / reboot / sync PATH
- lessons.md — adsbdb skip semantics + FileKv TTL + callsign cache

**Index (load on demand):**

- product-brief.md — background (may still say 3–5 historically)
- phases.md — phase status (exploration B DONE; poster deferred)
- progress-log.md — dated history
- docs/runbooks/local-dev.md / pages.md / deploy-worker.md / secrets.md
- phase-6.plan.md / carrier-brand-alias.plan.md / visual-direction.md — poster locks + deferred polish
- spike/README.md / spike/CREDENTIALS.md — data APIs
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks
- `~/.cursor/plans/adsbdb_first-pass_a6560b8c.plan.md` — adsbdb ship (DONE)
- `~/.cursor/plans/callsign_enrich_cache_d8dc61ab.plan.md` — callsign cache (DONE)

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
| Sync unit PATH | Must include `/usr/sbin:/sbin` so `runuser` works (`deploy/systemd/airplane-frame-sync.service`) |
| Secrets | `/etc/airplane-frame/worker.env` root:root mode 600 |
| Adapter | `worker/src/node/` — `npm run start:pi` |
| Env (live) | `MAX_ATTEMPT=36`, `MAX_AIRLABS=5`, `PACK_SIZE=10`, `MAX_RESULTS=20` |
| Callsign cache TTLs | positive `900s`; adsbdb 400/404 miss `600s`; AirLabs miss `1800s` (value-embedded in `FLIGHT_CACHE`) |
| Outbound fetch | `FETCH_TIMEOUT_MS=10000`; adsbdb hard-fail → request-scoped skip (`enrich.adsbdbSkipped`) |
| Enrich path | airplanes.live → **adsbdb** first → AirLabs gap-fill; callsign cache skips repeat upstream per key |
| File cache | `/var/lib/airplane-frame/cache.json` — ignores KV `expirationTtl`; clear manually if stuck stale |
| Cache policy | Short-TTL display fields only (`origin`/`destination`/`carrier`); no route DB mirror; risk accepted (exploration B) |
| Front-end refresh | Auto-refresh **off** by default (`af_autoRefresh`); boot fetch once; manual Refresh always |
| Last ship | paper texture on flight panels (`css/poster-paper.css`, `assets/textures/`); unit + manual UAT PASS (2026-08-05) |

**Verify before coding:**

```bash
git branch --show-current   # expect main
node --test js/lib.test.js js/plane-asset.test.js js/paper-texture.test.js
cd worker && npm test
```

**Open decisions:** optional user-selectable N deferred; tune min-altitude default; settings tag-chip chrome.

**Open items:** **Deferred:** Phase 6 poster polish/UAT. Rotate secrets exposed in chat when convenient. Settings/geocoder/livery deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).

**Potential next (backlog, not started):**
- Design spike: show airport names in addition to codes

**Last updated:** 2026-08-05 — silhouette scroll-motion shipped; Phase 6 poster polish still deferred unless asked
