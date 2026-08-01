#!/usr/bin/env python3
"""Phase 1 spike: JC radius → carrier + destination + plane type.

Keyless path: airplanes.live (positions) + hexdb (best-effort route).
Optional: OpenSky / AirLabs / Aviationstack via spike/.env — see CREDENTIALS.md.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

JC_LAT = 40.728
JC_LON = -74.078
RADIUS_NM = 25  # airplanes.live uses nautical miles; ~25 mi statute ≈ 22 nm; use 25 nm for coverage
USER_AGENT = "airplane-frame-spike/0.1 (personal research)"
OUT_DIR = Path(__file__).resolve().parent / "out"
ENV_PATH = Path(__file__).resolve().parent / ".env"


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def http_json(url: str, *, data: bytes | None = None, headers: dict | None = None) -> object:
    hdrs = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs, method="POST" if data else "GET")
    with urllib.request.urlopen(req, timeout=45) as resp:
        body = resp.read()
        if not body:
            return None
        return json.loads(body.decode())


def fetch_airplanes_live(lat: float, lon: float, radius_nm: int) -> list[dict]:
    url = f"https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nm}"
    payload = http_json(url)
    if not isinstance(payload, dict):
        return []
    return list(payload.get("ac") or [])


def hexdb_route(callsign: str) -> dict | None:
    cs = callsign.strip().upper()
    try:
        data = http_json(f"https://hexdb.io/api/v1/route/icao/{urllib.parse.quote(cs)}")
    except urllib.error.HTTPError:
        return None
    return data if isinstance(data, dict) else None


def opensky_token() -> str | None:
    client_id = os.environ.get("OPENSKY_CLIENT_ID", "").strip()
    client_secret = os.environ.get("OPENSKY_CLIENT_SECRET", "").strip()
    cred_path = Path(__file__).resolve().parent / "credentials.json"
    if (not client_id or not client_secret) and cred_path.is_file():
        creds = json.loads(cred_path.read_text())
        client_id = creds.get("clientId") or creds.get("client_id") or client_id
        client_secret = creds.get("clientSecret") or creds.get("client_secret") or client_secret
    if not client_id or not client_secret:
        return None
    body = urllib.parse.urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        }
    ).encode()
    data = http_json(
        "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if isinstance(data, dict) and data.get("access_token"):
        return str(data["access_token"])
    return None


def airlabs_flight(callsign: str) -> dict | None:
    key = os.environ.get("AIRLABS_API_KEY", "").strip()
    if not key:
        return None
    # flight_icao often matches ADS-B callsign (e.g. UAL700)
    url = (
        "https://airlabs.co/api/v9/flight"
        f"?flight_icao={urllib.parse.quote(callsign.strip())}"
        f"&api_key={urllib.parse.quote(key)}"
    )
    try:
        data = http_json(url)
    except urllib.error.HTTPError:
        return None
    if not isinstance(data, dict):
        return None
    # AirLabs wraps response; accept either response object or error
    if data.get("error"):
        return None
    resp = data.get("response")
    if isinstance(resp, dict):
        return resp
    if isinstance(resp, list) and resp:
        return resp[0] if isinstance(resp[0], dict) else None
    return None


def aviationstack_flight(callsign: str) -> dict | None:
    key = os.environ.get("AVIATIONSTACK_ACCESS_KEY", "").strip()
    if not key:
        return None
    url = (
        "http://api.aviationstack.com/v1/flights"
        f"?access_key={urllib.parse.quote(key)}"
        f"&flight_icao={urllib.parse.quote(callsign.strip())}"
        "&flight_status=active"
    )
    try:
        data = http_json(url)
    except urllib.error.HTTPError:
        return None
    if not isinstance(data, dict):
        return None
    rows = data.get("data") or []
    return rows[0] if rows and isinstance(rows[0], dict) else None


def enrich(aircraft: dict) -> dict | None:
    flight = (aircraft.get("flight") or "").strip()
    plane_type = (aircraft.get("desc") or "").strip() or (aircraft.get("t") or "").strip()
    carrier = (aircraft.get("ownOp") or "").strip()
    if not flight or not plane_type:
        return None
    if aircraft.get("alt_baro") in (None, "ground"):
        return None

    origin = destination = None
    source = "none"
    airline_name = None

    airlabs = airlabs_flight(flight)
    if airlabs:
        origin = airlabs.get("dep_iata") or airlabs.get("dep_icao")
        destination = airlabs.get("arr_iata") or airlabs.get("arr_icao")
        airline_name = airlabs.get("airline_name") or airlabs.get("airline_icao")
        source = "airlabs"

    if not destination:
        av = aviationstack_flight(flight)
        if av:
            dep = av.get("departure") or {}
            arr = av.get("arrival") or {}
            airline = av.get("airline") or {}
            origin = dep.get("iata") or dep.get("icao") or origin
            destination = arr.get("iata") or arr.get("icao")
            airline_name = airline.get("name") or airline_name
            source = "aviationstack"

    if not destination:
        route = hexdb_route(flight)
        if route and isinstance(route.get("route"), str) and "-" in route["route"]:
            parts = route["route"].split("-")
            origin, destination = parts[0], parts[-1]
            source = "hexdb"

    if not destination:
        return None

    return {
        "flight": flight,
        "carrier": airline_name or carrier,
        "destination": destination,
        "origin": origin,
        "planeType": plane_type,
        "icaoType": aircraft.get("t"),
        "altitudeFt": aircraft.get("alt_baro"),
        "distanceNm": aircraft.get("dst"),
        "lat": aircraft.get("lat"),
        "lon": aircraft.get("lon"),
        "enrichmentSource": source,
    }


def main() -> int:
    load_dotenv(ENV_PATH)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    providers = {
        "airplanes.live": True,
        "hexdb": True,
        "opensky": bool(opensky_token()),
        "airlabs": bool(os.environ.get("AIRLABS_API_KEY", "").strip()),
        "aviationstack": bool(os.environ.get("AVIATIONSTACK_ACCESS_KEY", "").strip()),
    }
    print("providers:", json.dumps(providers))

    aircraft = fetch_airplanes_live(JC_LAT, JC_LON, RADIUS_NM)
    print(f"positions: {len(aircraft)} aircraft within {RADIUS_NM} nm of JC")

    enriched: list[dict] = []
    for ac in aircraft:
        row = enrich(ac)
        if row:
            enriched.append(row)

    # Prefer live enrichment sources when sorting for the pass bar
    rank = {"airlabs": 0, "aviationstack": 1, "hexdb": 2, "none": 9}
    enriched.sort(key=lambda r: (rank.get(r["enrichmentSource"], 9), r.get("distanceNm") or 999))

    out_path = OUT_DIR / "jc_sample.json"
    payload = {
        "pin": {"lat": JC_LAT, "lon": JC_LON, "radiusNm": RADIUS_NM},
        "providers": providers,
        "count": len(enriched),
        "flights": enriched[:10],
    }
    out_path.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"fully enriched: {len(enriched)} (wrote {out_path})")
    for row in enriched[:5]:
        print(
            f"  {row['flight']:8} {row['carrier'][:40]:40} "
            f"-> {row['destination']:4}  {row['planeType'][:28]}  [{row['enrichmentSource']}]"
        )

    if len(enriched) >= 3:
        print("PASS: >=3 flights with carrier + destination + plane type")
        return 0
    print("FAIL: need >=3 fully enriched flights", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
