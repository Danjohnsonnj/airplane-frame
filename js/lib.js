/** Pure helpers — safe to unit-test without a browser. */

export function isCompleteFlight(f) {
  if (!f || typeof f !== "object") return false;
  return Boolean(
    String(f.carrier || "").trim() &&
      String(f.destination || "").trim() &&
      String(f.planeType || "").trim(),
  );
}

export function filterFlights(flights, minAltitudeFt) {
  const min = Number(minAltitudeFt);
  const floor = Number.isFinite(min) ? min : 0;
  const list = Array.isArray(flights) ? flights : [];
  return list.filter((f) => {
    if (!isCompleteFlight(f)) return false;
    const alt = Number(f.altitudeFt);
    if (!Number.isFinite(alt)) return false;
    return alt >= floor;
  });
}

export function parseStoredNumber(raw, fallback) {
  if (raw === null || raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function buildFlightsUrl(base, { lat, lon, radiusMi }) {
  const u = new URL("/flights", base.endsWith("/") ? base : `${base}/`);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lon));
  u.searchParams.set("radiusMi", String(radiusMi));
  return u.toString();
}

export function pickGeocodeResult(payload) {
  const results = payload?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const first = results[0];
  const lat = Number(first.latitude);
  const lon = Number(first.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat,
    lon,
    name: first.name || "",
    admin1: first.admin1 || "",
    country: first.country || "",
  };
}

/** Status copy when Worker returns 401 — do not persist the rejected Bearer. */
export function unauthorizedStatusMessage() {
  return (
    "Unauthorized — use APP_SHARED_SECRET from worker/.dev.vars " +
    "(not AIRLABS_API_KEY). Auto-refresh paused."
  );
}
