# Phase 1 data spike — credentials

**Locked stack (2026-07-31):** airplanes.live (positions, no key) + **AirLabs** (carrier + origin/destination) + hexdb fallback (no key).  
OpenSky and Aviationstack are **optional** — not required for MVP.

**Production:** the same AirLabs key is stored as a Cloudflare Worker secret (`AIRLABS_API_KEY`). See `docs/runbooks/secrets.md`. Do not put keys in chat or in `*.example` files.

Put spike-only secrets in `spike/.env` (gitignored):

```bash
cp spike/.env.example spike/.env
# edit spike/.env
python3 spike/run_spike.py
```

---

## Required: AirLabs free key

Live flight lookup by callsign; used for airline name + origin/destination.

1. Sign up (free package): https://airlabs.co/signup?cycle=monthly&package=free  
   - Website/App URL: `http://localhost` or `https://YOURUSER.github.io/airplane-frame` is fine.  
   - Activity: Personal (or Other).  
2. Copy API key from the dashboard → `AIRLABS_API_KEY` in:
   - `spike/.env` (spike script)
   - `worker/.dev.vars` (local Wrangler)
   - Cloudflare via `wrangler secret put AIRLABS_API_KEY` (production)

Docs: https://airlabs.co/docs/

---

## No key needed: airplanes.live

Positions + plane type (`desc`) + callsign. Spike/Worker must send a `User-Agent`.  
Guide: https://airplanes.live/api-guide/

---

## Fallback (no key): hexdb.io

Used only when AirLabs does not return a destination. Routes can be stale — not the primary production path.

---

## Optional: OpenSky Network

Not in the locked MVP stack. Useful later for higher rate limits / flight history.

1. Register: https://opensky-network.org/  
2. Account → API Client: https://opensky-network.org/my-opensky/account  
3. Download `credentials.json` → `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET` in `spike/.env`, or save as `spike/credentials.json`.

Docs: https://openskynetwork.github.io/opensky-api/rest.html

---

## Optional: Aviationstack

Alternate to AirLabs if needed. Free plan is often ~100 req/month — tight for continuous polling.

1. https://aviationstack.com/signup/free  
2. `AVIATIONSTACK_ACCESS_KEY` in `spike/.env` (Worker does not use this unless we add it later)

---

## After keys are set

Do not paste secrets into chat. Tell the agent which providers are configured.
