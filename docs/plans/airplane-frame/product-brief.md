# Product brief - airplane-frame

## Background

Greenfield personal project. The user watches commercial air traffic near Jersey City, NJ (dense airspace: EWR, LGA, JFK, and overflights). They want a small curated set of flights on a webpage, later presented in a 1950s airline-travel-advertising visual style with plane+livery illustrations. Interview completed 2026-07-31; no app code yet.

## Goal

Show **3–5** commercial flights near a user-defined, session-persisted location. Every card must include **carrier**, **destination**, and **plane type** (e.g. Boeing 787 Dreamliner). Also show flight id/callsign, altitude, distance from pin, and origin when available. Success for MVP: reliable JC results on a ~5-minute refresh, plain HTML/CSS/JS UI, free/trial data only.

## Rationale

Personal sky-watching tool first; eventual poster gallery second. Hybrid model (live positions in a radius, enriched and ranked as commercial flights) matches “what’s near me” while requiring named commercial identity for the later art direction.

## Non-goals

- Full live radar / map product (FlightRadar clone)
- Accounts, multi-tenant product, or public unauthenticated API burn
- 1950s poster art and airline livery illustrations in MVP
- Paid flight-data subscriptions (free/trial only)
- Pure browser→API architecture if it cannot guarantee required fields

## Boundaries

- Always: free/trial data sources; required fields on every displayed flight; secrets only in the Worker; personal shared-secret access gate; update cadence ~5 minutes (user-adjustable); document ops in runbooks + Cursor skill
- Ask first: switching off free/trial sources; changing architecture away from Pages + Worker; adding live geolocation; starting poster/livery art phase
- Never: put API client secrets in the GitHub Pages front end; ship flights missing carrier, destination, or plane type; expand into paid infra without explicit approval

## Locked decisions (interview)

| Topic | Lock |
|-------|------|
| Product model | Hybrid: radius candidates → airport-interest bias → diversity-first pack of 3–5 |
| Architecture | GitHub Pages (plain HTML/CSS/JS) + free Worker/BFF (e.g. Cloudflare Worker) |
| Access | Shared secret (owner + one tester device OK); ~5 min response cache |
| Location (dev) | Saved pin via map/coords; Jersey City default |
| Location (MVP) | Same + place-name search (free geocoder) |
| Radius | ~25 miles default, user-adjustable |
| Filters | After pipeline works: carrier allow/deny, destination group, uniqueness |
| Selection | Diversity-first pack; light interest score as tie-break only |
| UI | Functional MVP first; short visual-direction note for later poster phase |
| Maintenance | `docs/runbooks/` + Cursor skill pointing at them |
| Data vendors | Spike-driven; no brand lock until success criteria met |

## Success criteria

- For a Jersey City pin, the Worker returns enriched flights each with carrier, destination, and human-readable plane type on free/trial tiers at ≤5-minute polling (deployed: `https://airplane-frame.danjohnsonnj.workers.dev`; Phase 4 narrows to curated 3–5)
- Front end loads from GitHub Pages, sends shared secret + location/radius, renders the pack
- Location pin persists across sessions in that browser (localStorage); MVP includes place search
- Runbooks exist for deploy, secrets, and Cloudflare setup (`docs/runbooks/`); skill `.cursor/skills/airplane-frame-ops` routes agents to them
- UAT smoke: open Pages URL on two devices with the shared key; both see enriched flights within one refresh cycle
