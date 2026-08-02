# Lessons (reusable toolkit; accreted across sessions)

## GitHub Pages cannot hold flight API secrets or fix CORS

- Context: Choosing static hosting vs BFF for flight data.
- Lesson: Pages only serves files. Browser calls to third-party flight APIs still need that API to allow CORS; OAuth client secrets must not ship in front-end JS. Prefer a Worker/BFF when destination/carrier/type are required.
- Evidence: Interview research — OpenSky lacks practical browser CORS and requires OAuth2 client credentials (as of 2026); closed opensky-api#34 discussion ended on proxying.
- Crystallize?: Yes — runbook section “Why we use a Worker” + skill pointer.

## Required fields drive architecture more than hosting preference

- Context: User preferred pure client-side (A) and liked GitHub Pages.
- Lesson: If destination + carrier + plane type are non-negotiable, lock the architecture that can enrich server-side first; revisit pure static only if a spike proves a CORS-safe free stack that includes destination.
- Evidence: Interview decision to abandon A as primary after declaring fields non-negotiable.
- Crystallize?: no

## Spike before brand-locking flight APIs

- Context: Phase 1 data selection.
- Lesson: Free/trial flight APIs churn (auth, credits, schema). Write success criteria (JC pin, required fields, 5-min cadence) and keep the first stack that passes; document in tech-brief + runbook.
- Evidence: Interview lock — spike-driven data stack.
- Crystallize?: Yes — Phase 1 verify checklist in phases.md / runbook.

## airplanes.live needs a User-Agent

- Context: Fetching `https://api.airplanes.live/v2/point/...` from Python urllib.
- Lesson: Send a descriptive User-Agent; bare urllib gets HTTP 403. curl often works without one.
- Evidence: Spike 2026-07-31 — 403 without UA, 200 with `airplane-frame-spike/0.1`.
- Crystallize?: Yes — shared HTTP helper in Worker/spike.

## Keyless count-pass ≠ production stack

- Context: airplanes.live + hexdb returned ≥3 JC flights with required fields.
- Lesson: Still validate destination freshness and carrier branding (callsign→airline or live flight API). Do not lock MVP on hexdb alone without a quality check against a live schedule/flight API.
- Evidence: Spike samples showed trustee ownOp names and dubious city pairs for NYC-area traffic.
- Crystallize?: no

## Locked stack: airplanes.live + AirLabs

- Context: Phase 1 close-out.
- Lesson: Production path is airplanes.live for positions/type, AirLabs for carrier+route, hexdb only as destination fallback. OpenSky not required for MVP.
- Evidence: AirLabs spike 2026-07-31 — brand names and EWR/LGA-plausible routes; user locked Phase 1.
- Crystallize?: Yes — Worker env: `AIRLABS_API_KEY`, `APP_SHARED_SECRET`.

## Fresh workers.dev may briefly fail TLS

- Context: Right after first deploy to `*.workers.dev`.
- Lesson: Handshake failures with no peer cert can clear after enabling `workers_dev = true` and redeploying / waiting briefly. Confirm subdomain enabled via API (`/workers/scripts/{name}/subdomain` → enabled).
- Evidence: airplane-frame deploy 2026-07-31; failed curl then 200 after redeploy.
- Crystallize?: Yes — note in deploy-worker runbook.

## Open-Meteo geocoder works from the browser

- Context: Phase 3 place search without a map API key or Worker proxy.
- Lesson: `https://geocoding-api.open-meteo.com/v1/search` is CORS-usable for personal low-volume place → lat/lon; prefer it over Nominatim-in-browser for MVP.
- Evidence: Local UI search “Jersey City” → pin set 2026-07-31.
- Crystallize?: Yes — pages runbook / front-end config.

## Front-end Bearer is APP_SHARED_SECRET, not AIRLABS_API_KEY

- Context: UI 401 when the AirLabs key was pasted into the shared-secret field.
- Lesson: Two Worker secrets. `APP_SHARED_SECRET` is the personal access gate for `Authorization: Bearer`. `AIRLABS_API_KEY` never leaves the Worker. Label the UI field with the env var name; on 401 clear stored secret and pause auto-refresh.
- Evidence: User report 2026-07-31; fixed copy in UI + secrets/pages runbooks.
- Crystallize?: Yes — secrets.md “which secret goes where” + pages.md auth section.

## Cache candidates, then pack per request

- Context: Phase 4 filters must change the pack without re-hitting AirLabs every toggle.
- Lesson: Cache enriched candidates by lat/lon/radius only; apply altitude/carrier/dest filters and diversity pack on every authenticated request. Cache key must not include filter params.
- Evidence: Local wrangler smoke 2026-07-31 — carrierDeny changed pack count without waiting for TTL.
- Crystallize?: Yes — deploy-worker runbook + Worker `cache.js`.

## airplanes.live 429 on Cloudflare shared egress

- Context: Production Worker gets HTTP 429 from airplanes.live; laptop curl succeeds. Empty `[]` upstream success can also poison the fresh KV window and surface GitHub Pages EMPTY.
- Lesson: Free airplanes.live limits ~1 req/s **per IP**. Workers egress from shared Cloudflare addresses — other tenants burn the budget. Mitigations (partial): KV cache (fresh 10 min for non-empty, 60s for empty), prefer last-good pack when upstream returns empty, stale serve on failure, local Wrangler / LAN for testing (own IP). Do not rapid-refresh production during dev. **Mitigations do not fix shared egress** — treated as production blocker 2026-08-02; next exploration is Pi-hosted Worker + Cloudflare Tunnel (keep Pages; move API to home IP). Plan: `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md`.
- Evidence: 2026-08-01 — prod 429/empty, local 200; KV + retry deployed Phase 4.5; empty-aware cache hotfix 2026-08-01; 2026-08-02 — still blocking Pages reliability → Pi Option 1 next.
- Crystallize?: Yes — local-dev runbook + lessons + HANDOFF.

## Local preview must run Wrangler for own IP

- Context: `python3 -m http.server` alone still called production Worker.
- Lesson: `resolveWorkerBase` routes `localhost`/`127.0.0.1` → `http://127.0.0.1:8788`. GitHub Pages → `https://api.danjnj.com`. `?worker=prod` forces the Pi API; `?worker=cloudflare` forces legacy `workers.dev` (no silent failover). Run `scripts/dev-worker.sh` alongside `scripts/dev-pages.sh` for local.
- Evidence: Phase 4.5 implementation 2026-08-01.
- Crystallize?: Yes — local-dev.md, README, pages runbook.

## Poster design: grill → visual-direction → mock probe → ask before ship

- Context: Post–Phase 5 visual path.
- Lesson: Lock IA in `visual-direction.md` via interview; refine hexes/type/status copy in `design-mock-probe` HTML under `docs/design-mocks/`. Mocks are reference only — never port DOM/CSS into Pages until user green-lights poster implementation. Pointer: `docs/agents/design-mock-probe-pointer.md`.
- Evidence: Design interview 2026-08-01; HANDOFF next = poster mock probe.
- Crystallize?: Yes — HANDOFF required reading + pointer.

## Phase 6 poster SPA: gen-carrier-css also writes shipped CSS/JS

- Context: Carrier brand colors must match mock and app without a Pages build step.
- Lesson: `node docs/design-mocks/gen-carrier-css.mjs` refreshes mock HTML, `css/carriers.css`, and `js/carrier-brands.js` from `airline-brand-colors.md`. Brand-book carriers always get `data-carrier` (duplicates share color); unknown carriers get unique sequential `ground-*` swatches.
- Evidence: Phase 6 implementation 2026-08-01.
- Crystallize?: Yes — design-mocks README + phase-6.plan.md.

## Carrier brand: ownOp INC strings need alias map before brand CSS applies

- Context: Live `/flights` rows from hexdb often carry legal `ownOp` strings (`UNITED AIRLINES INC`) while `css/carriers.css` keys exact book names (`United Airlines`).
- Lesson: Ship minimal alias map in both FE (`resolveCarrierBrand`) and Worker (`normalizeCarrierName`); keep maps in sync. Trustee/lessor and regionals not in brand book stay on `ground-*` swatches. `data-carrier` must be the resolved book string, never raw carrier.
- Evidence: Phase 6 code review + carrier-brand-alias implementation 2026-08-01.
- Crystallize?: Yes — carrier-brand-alias.plan.md, airlines-seen alias table.

## Cloudflare proxied + no Universal cert = HTTPS handshake failure

- Context: Moving `danjnj.com` NS to Cloudflare while Squarespace still hosts `www`.
- Lesson: Orange-cloud (Proxied) without an issued Universal SSL cert breaks HTTPS (`ssl/tls alert handshake failure`) even when HTTP redirects. Set apex/`www` to **DNS only** (grey cloud) so origin (Squarespace) TLS works immediately; re-enable Proxied only after Edge Certificates cover the hostnames. Tunnel `api.<zone>` still uses Proxied when ready.
- Evidence: 2026-08-02 cutover — `www` restored after DNS-only.
- Crystallize?: Yes — pi-worker / pages runbooks when written.

## Cursor (macOS) may be blocked from LAN without Local Network plist key

- Context: SSH/ping to Pi from Cursor terminal failed with `No route to host` while Terminal.app worked.
- Lesson: Cursor.app lacks `NSLocalNetworkUsageDescription`, so macOS silently blocks RFC1918 and never shows a Local Network toggle. Use Terminal.app for Pi SSH, or launch Cursor from Terminal as a temporary workaround. Do not misdiagnose as AP isolation if Safari/Terminal reach the LAN.
- Evidence: 2026-08-02 Pi bring-up; Cursor forum reports.
- Crystallize?: no (upstream Cursor bug).
