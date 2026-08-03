# airplane-frame - Handoff

**Goal:** Personal web app showing up to **10** nearby commercial flights (carrier, destination, plane type) around a saved location, starting with Jersey City, NJ.

**Current phase:** Plane silhouettes **DONE**. Enrich efficiency + pack size **DONE**. Phase 6.5 Pi Tunnel **DONE**. adsbdb first-pass **DONE** (2026-08-03, branch `feature/adsbdb-first-pass`). Phase 6 poster polish **deferred**.

**Next action (cold-start executable):**

1. Read process.md (before any commit).
2. **Merge `feature/adsbdb-first-pass` → `main`**, Pi sync/restart, production `/flights` UAT at `api.danjnj.com` (clear file cache if packs look stale).
3. **Exploration B remainder: short-TTL callsign enrichment cache** — after production UAT. Keyed by callsign → `{origin, destination, carrier}` with value-embedded TTL (FileKv-safe); short negative cache for 404; display fields only; no route DB mirror. Closes exploration B.
4. **Deferred (do not start unless asked):** Phase 6 poster UAT/polish; tune min-altitude default.
5. Production: https://danjohnsonnj.github.io/airplane-frame/ → `https://api.danjnj.com`. Pi ops: [pi-worker.md](../../runbooks/pi-worker.md).

**Hard invariants:** Free/trial data sources only; destination + carrier + plane type are non-negotiable on every displayed flight; no API secrets in the GitHub Pages front end; personal shared-secret gate on the Worker (or Pi API).

**Required reading (idle / next ask):**

- process.md — before committing
- tech-brief.md — pipeline, adsbdb attribution
- docs/runbooks/pi-worker.md — ops / reboot / sync PATH
- lessons.md — adsbdb skip semantics + FileKv TTL

**Index (load on demand):**

- product-brief.md — background (may still say 3–5 historically)
- phases.md — phase status (6.5 DONE; adsbdb shipped; callsign cache next)
- progress-log.md — dated history
- docs/runbooks/local-dev.md / pages.md / deploy-worker.md / secrets.md
- phase-6.plan.md / carrier-brand-alias.plan.md / visual-direction.md — poster locks + deferred polish
- spike/README.md / spike/CREDENTIALS.md — data APIs
- .cursor/skills/airplane-frame-ops/SKILL.md — agent entry to runbooks
- `~/.cursor/plans/adsbdb_first-pass_a6560b8c.plan.md` — adsbdb ship (this branch)
- `~/.cursor/plans/fetch_timeout_hexdb_skip_16e530b6.plan.md` — timeout + skip (superseded by adsbdb)

**Key facts (resume without re-discovery):**

| Fact | Value |
|------|--------|
| Branch | `feature/adsbdb-first-pass` (merge to `main` for Pi sync); Pi checkout: `/opt/airplane-frame` on `main` |
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
| Outbound fetch | `FETCH_TIMEOUT_MS=10000`; adsbdb hard-fail → request-scoped skip (`enrich.adsbdbSkipped`) |
| Enrich path | airplanes.live → **adsbdb** first → AirLabs gap-fill (hexdb removed) |
| File cache | `/var/lib/airplane-frame/cache.json` — ignores KV `expirationTtl`; clear manually if stuck stale |
| Last ship | adsbdb first-pass on `feature/adsbdb-first-pass`; local UAT PASS (UI + Worker, 2026-08-03) |

**Verify before coding:**

```bash
git branch --show-current   # expect feature/adsbdb-first-pass or main after merge
node --test js/lib.test.js js/plane-asset.test.js
cd worker && npm test
```

**Open decisions:** callsign cache TTLs (hit vs negative); optional user-selectable N deferred; tune min-altitude default; settings tag-chip chrome.

**Open items:** **Deferred:** Phase 6 poster polish/UAT. Rotate secrets exposed in chat when convenient. Settings/geocoder/livery deferred. Carrier inventory: [airlines-seen-2026-08-01.md](../../design-reference/airlines-seen-2026-08-01.md).

**Last updated:** 2026-08-03 — adsbdb first-pass local UAT PASS; next = merge + Pi UAT, then callsign cache
