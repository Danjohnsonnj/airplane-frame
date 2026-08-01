# Progress log (append-only, newest last)

## 2026-07-31 - Session 1: Interview complete → plan-build init

- Happened: Ran `/start-interview` and locked product/architecture decisions for airplane-frame. Initialized plan-build tree at `docs/plans/airplane-frame/` (own-project). Repo remains greenfield (no app code).
- Verified: none (planning artifacts only).
- Learned: Pure Pages→API is likely infeasible for required destination field; Pages + free Worker is the chosen path. Actions snapshot (D) was considered for Pages-only hosting then rejected so location can live in the browser. Maintenance must include runbooks + a Cursor skill.
- Overwrote: Architecture preference moved from exploring A/D to locked B during the interview; reflected as current truth in tech-brief and product-brief (no prior plan briefs to correct).

## 2026-07-31 - Session 2: Phase 1 keyless spike + credential guide

- Happened: Added `spike/run_spike.py`, `spike/CREDENTIALS.md`, `spike/.env.example`, root `.gitignore`. Ran keyless JC spike (airplanes.live + hexdb). Documented OpenSky / AirLabs / Aviationstack signup steps for the user (no keys configured yet).
- Verified: `python3 spike/run_spike.py` → PASS (≥3 enriched flights); sample written to `spike/out/jc_sample.json` (gitignored).
- Learned: airplanes.live requires a User-Agent or it 403s from urllib. hexdb meets the count bar but destination quality is suspect; ownOp is a weak carrier label. Live enrichment APIs still needed before locking the production stack.
- Overwrote: HANDOFF phase → in progress; tech-brief verified findings updated with spike results.

## 2026-07-31 - Session 2b: Phase 1 locked; enter Phase 2

- Happened: User locked Phase 1 after AirLabs-enriched spike looked metro-plausible (brand carriers, EWR/LGA routes). OpenSky left optional/deferred. Updated HANDOFF, tech-brief, phases, CREDENTIALS emphasis.
- Verified: `python3 spike/run_spike.py` with AirLabs → PASS; top results tagged `[airlabs]`.
- Learned: Prefer AirLabs airline_name over airplanes.live ownOp; keep hexdb as fallback only.
- Overwrote: Phase 1 → DONE; current phase → Phase 2 Worker BFF; locked data stack table in tech-brief.

## 2026-07-31 - Session 3: Phase 2 Worker scaffold (awaiting Cloudflare account)

- Happened: Scaffolded `worker/` (auth, airplanes.live + AirLabs pipeline, 5‑min cache), unit tests (11 pass), runbooks (cloudflare-signup, secrets, deploy-worker), and `.cursor/skills/airplane-frame-ops`. User has no Cloudflare account yet — deploy/`wrangler dev` blocked on signup + login.
- Verified: `cd worker && npm test` → 11 pass.
- Learned: n/a new API gotchas this slice.
- Overwrote: HANDOFF → Phase 2 in progress; next action = Cloudflare signup then local wrangler verify.

## 2026-07-31 - Session 3b: Wrangler OAuth + local verify PASS; deploy blocked

- Happened: User completed Wrangler OAuth. Created `worker/.dev.vars`. `wrangler dev` on :8788. Curl verify: health 200, no/bad auth 401, auth JC query 200 with 9 AirLabs-enriched flights (PASS). Deploy failed: Cloudflare email not verified for Workers + workers.dev subdomain not registered.
- Verified: local 401/200 + ≥3 enriched flights with carrier/destination/planeType.
- Learned: Deploy needs email verify + workers.dev onboarding before secrets/deploy succeed.
- Overwrote: HANDOFF next action → verify email + register workers.dev subdomain, then redeploy.

## 2026-07-31 - Session 3c: Remote deploy + verify PASS; Phase 2 done

- Happened: User confirmed email verify + `danjohnsonnj.workers.dev` subdomain. Secrets bulk + deploy succeeded. Initial TLS handshake failures cleared after `workers_dev = true` redeploy / brief propagation. Remote curl: health 200, no auth 401, auth JC 200 with 11 enriched flights (incl. Dreamliner CPT).
- Verified: `https://airplane-frame.danjohnsonnj.workers.dev` PASS.
- Learned: Fresh workers.dev URL may briefly fail TLS until subdomain/workers_dev is fully enabled; retry after explicit `workers_dev = true` deploy.
- Overwrote: Phase 2 → DONE; HANDOFF next → Phase 3 Pages UI.

## 2026-07-31 - Session 3d: Docs/runbooks/spike/handoff sync

- Happened: Brought runbooks, spike README/CREDENTIALS, HANDOFF, tech-brief, process, and airplane-frame-ops skill up to date with deployed Worker URL, endpoints, secrets/bulk notes, email+subdomain checklist, and TLS gotcha.
- Verified: n/a (documentation only).
- Learned: n/a.
- Overwrote: HANDOFF current phase → Phase 3 not started; tech-brief architecture marked Worker live; runbooks reflect production URL `https://airplane-frame.danjohnsonnj.workers.dev`.

## 2026-07-31 - Session 4: Phase 3 Pages UI implemented

- Happened: Root static site (`index.html`, `css/app.css`, `js/{config,lib,app}.js`) calling production Worker; Leaflet map click; Open-Meteo place search; device geolocation; localStorage for secret/pin/radius/refresh/minAltitude (default 5000 ft client filter); shows all enriched candidates. Added `docs/runbooks/pages.md`, README, unit tests. Place search + geolocation pulled forward from Phase 5/Later.
- Verified: `node --test js/lib.test.js` 7 pass; local `http.server` page load; place search sets JC pin; wrong secret → unauthorized; live Worker + filter path → e.g. 11 raw / 3 ≥5000 ft with required fields. Pages enable + two-device UAT still user-side.
- Learned: Open-Meteo geocoding API is CORS-friendly for browser place search (no key).
- Overwrote: HANDOFF → Phase 4 next; Phase 3 IMPLEMENTED (Pages UAT open); Phase 5 narrowed; tech/product briefs updated.

## 2026-07-31 - Session 4b: Secret-field UX + docs (AirLabs vs APP_SHARED_SECRET)

- Happened: User pasted `AIRLABS_API_KEY` into the UI and got 401. Relabeled field to `APP_SHARED_SECRET`, hint + runbook table for which secret goes where; on 401 clear stored secret and pause auto-refresh; secret only persisted after successful 200 or explicit Save.
- Verified: `node --test js/lib.test.js` (includes unauthorizedStatusMessage).
- Learned: Two Worker secrets are easy to conflate; name the env var in the UI.
- Overwrote: secrets.md, pages.md, README, deploy-worker, skill, lessons, tech-brief, CREDENTIALS, `.dev.vars.example`.

## 2026-07-31 - Session 4c: Pages enable + two-device UAT PASS

- Happened: Enabled GitHub Pages via `gh` (`main` / root); repo homepage set. User confirmed app works on two devices at https://danjohnsonnj.github.io/airplane-frame/.
- Verified: Pages build `built`; site assets 200; Worker health 200; two-device UAT PASS (user).
- Learned: Default branch is `main` (docs had stale `master`).
- Overwrote: HANDOFF open decisions drop UAT; Phase 3 → DONE; pages/phases/tech-brief/phase-3.plan updated.

## 2026-07-31 - Session 5: Phase 4 pack + filters DONE (UAT PASS)

- Happened: Implemented Worker diversity pack (`PACK_SIZE` 5), candidate cache then filter/pack, query filters (carrier allow/deny, nyc dest group prefer/exclude, unique, minAltitudeFt); Pages UI persists filters; deployed Worker; commit `ad75ffe`. User completed Phase 4 UAT checklist.
- Verified: worker + front-end unit tests; local/prod pack ≤5; UAT PASS (user).
- Learned: Cache candidates separately from packed response so filter toggles reuse enrich within TTL.
- Overwrote: Phase 4 → DONE; HANDOFF → Phase 5; tech/product/phases/lessons/phase-4.plan/pages UAT checked.
