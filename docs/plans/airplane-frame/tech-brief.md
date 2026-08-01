# Tech brief - current state and gaps

## Current architecture (verified)

- Empty git repo / greenfield workspace - no application code yet
- Plan artifacts only under `docs/plans/airplane-frame/`

## Verified findings / gaps

1. Pure static browser→API (option A) is a poor fit for required destination + carrier + type: common free ADS-B APIs lack CORS and/or require OAuth client secrets unsuitable for public Pages (confirm-in-spike; OpenSky historically needs proxy + now OAuth2 client credentials).
2. Architecture D (GitHub Actions → static `data.json`) was considered then rejected in favor of B so the browser can own the watch location and adjustable refresh.
3. Exact free/trial vendors for positions + route enrichment + aircraft type names are **unverified** — Phase 1 spike owns this.
4. Cloudflare Worker (or equivalent free serverless) is the intended BFF; not yet scaffolded.

## Proposed architecture

```
[Browser: plain HTML/CSS/JS on GitHub Pages]
   |  Authorization: shared secret
   |  Query: lat, lon, radiusMi, optional filter prefs
   v
[Worker/BFF - free tier]
   |  secrets: flight API keys / OAuth clients
   |  cache: ~5 min per location bucket
   |  pipeline: fetch positions in radius
   |            → filter commercial / enrich route + type
   |            → airport-bias + diversity pack → 3–5
   v
[JSON: flights[]] → render functional cards
```

### Front end

- Modern browsers (last ~1 year)
- `localStorage`: home pin, radius, refresh interval, shared secret, later filters
- Dev location UX: map click or lat/lon; JC default
- MVP location UX: add free geocoder place search
- No poster art in MVP; keep a short visual-direction note when UI lands

### Worker

- Hold all third-party secrets
- Enforce shared secret + rate limit / cache
- Implement ranking: radius candidates → airport-interest bias → diversity-first 3–5
- Return only flights that include carrier, destination, plane type

### Spike success criteria (Phase 1)

Against a Jersey City lat/lon, ~25 mi radius, free/trial only:

- Produce ≥3 flights in a single run with all three required fields
- Sustainable at ~5-minute polling without exhausting free tier in normal personal use
- Document chosen APIs, auth method, rate limits, and failure modes in tech-brief + eventual runbook

## Hard invariants

- No third-party API secrets in front-end source or Pages-deployed JS
- Never display a flight missing carrier, destination, or plane type
- Free/trial data sources only unless user explicitly approves otherwise
- Personal access gate on the Worker (shared secret)
