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
