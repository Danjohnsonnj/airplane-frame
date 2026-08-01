# Phases

## Phase 1 - Data spike

- Time-box evaluation of free/trial ADS-B / flight APIs behind a minimal Worker (or local script that mirrors Worker constraints: secrets server-side, JSON out).
- Prove Jersey City ~25 mi can yield flights with carrier, destination, and plane type at ~5-minute cadence on free/trial limits.
- Record winners, auth, rate limits, and gaps in tech-brief.md; seed lessons.md.
- Verify: scripted or manual Worker/curl run returns ≥3 fully enriched flights for a JC pin; criteria checklist checked in progress-log.
- **Status: DONE 2026-07-31** — Locked stack: airplanes.live + AirLabs (hexdb fallback). OpenSky deferred.

## Phase 2 - Worker BFF + access gate

- Scaffold Cloudflare Worker (or chosen free BFF): shared-secret auth, ~5 min cache, radius query, enrichment pipeline stub using spike winners.
- Add `docs/runbooks/` for deploy + secrets; add Cursor skill that points at runbooks.
- Verify: unauthorized request rejected; authorized request returns schema-stable JSON; deploy runbook followed once successfully.
- **Status: DONE 2026-07-31** — Deployed `https://airplane-frame.danjohnsonnj.workers.dev`; local + remote 401/200 verify PASS (≥3 AirLabs-enriched flights).

## Phase 3 - Pages functional UI (dev location)

- Plain HTML/CSS/JS on GitHub Pages: saved pin (map/coords), JC default, adjustable radius + refresh interval, render 3–5 cards with MVP fields.
- Wire to Worker; store secret in localStorage.
- Verify: UAT smoke on primary device — set pin, see enriched cards, refresh respects interval; second device with same secret works.
- **Status: IMPLEMENTED 2026-07-31** — Root site + Open-Meteo search + geolocation + map; shows all Worker candidates after client min-altitude filter (diversity pack still Phase 4). **Remaining:** enable GitHub Pages + two-device UAT per `docs/runbooks/pages.md`.

## Phase 4 - Diversity pack + minimal filters

- Implement airport-bias + diversity-first selection (light interest score as tie-break).
- Add saved filters: carrier allow/deny, destination grouping, uniqueness aligned with pack.
- Verify: with noisy JC traffic, output is 3–5 varied flights; filters change the pack predictably.

## Phase 5 - MVP location polish + direction note

- Place-name search + device geolocation landed in Phase 3; this phase is mainly a short visual-direction note for future 1950s poster work (plus any geocoder UX polish).
- Verify: direction note exists in repo; full MVP success criteria in product-brief met (including Pages two-device UAT if still open).

## Later (out of current phase plan)

- 1950s poster UI + plane/livery illustration source decision
- Live browser geolocation
- Optional widen of sky-watcher filters (min altitude, widebody bias strength)
