# Spike (Phase 1)

Local scripts to prove free/trial flight data for a Jersey City pin. **Stack is locked** — prefer the Worker for day-to-day use; keep the spike for debugging enrichment without Wrangler.

## Locked stack

| Role | Source |
|------|--------|
| Positions + plane type | adsb.fi opendata (no key; Worker path — spike script still uses airplanes.live) |
| Carrier + origin/destination | AirLabs (`AIRLABS_API_KEY`) |
| Destination + carrier (first-pass) | adsbdb.com callsign API (keyless; Worker production path) |

OpenSky / Aviationstack are optional and **not** required for MVP. Details: [CREDENTIALS.md](./CREDENTIALS.md).

## Run

```bash
cp spike/.env.example spike/.env
# set AIRLABS_API_KEY — never commit .env
python3 spike/run_spike.py
```

Writes `spike/out/jc_sample.json` (gitignored). Exit 0 = PASS (≥3 flights with carrier, destination, plane type).

## Relation to Worker

Production API: `worker/` on the Pi at https://api.danjnj.com. The Cloudflare Worker URL is not a live fallback (adsb.fi HTTP 403 from that egress, 2026-10-24).  
Copy the same AirLabs key into `worker/.dev.vars` / Wrangler secrets ([docs/runbooks/secrets.md](../docs/runbooks/secrets.md)).
