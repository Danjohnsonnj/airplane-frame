/** Pure helpers — safe to unit-test without a browser. */

export function isCompleteFlight(f) {
  if (!f || typeof f !== "object") return false;
  return Boolean(
    String(f.carrier || "").trim() &&
      String(f.destination || "").trim() &&
      String(f.planeType || "").trim(),
  );
}

/** Client-side completeness guard only (Worker applies altitude + pack). */
export function guardFlights(flights) {
  const list = Array.isArray(flights) ? flights : [];
  return list.filter(isCompleteFlight);
}

/** @deprecated Prefer guardFlights; kept for tests during transition. */
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

export function parseStoredBool(raw, fallback) {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return fallback;
}

/**
 * @param {string} base
 * @param {{
 *   lat: number, lon: number, radiusMi: number,
 *   minAltitudeFt?: number,
 *   carrierAllow?: string,
 *   carrierDeny?: string,
 *   destGroup?: string,
 *   destGroupMode?: string,
 *   unique?: boolean,
 * }} q
 */
export function buildFlightsUrl(base, q) {
  const u = new URL("/flights", base.endsWith("/") ? base : `${base}/`);
  u.searchParams.set("lat", String(q.lat));
  u.searchParams.set("lon", String(q.lon));
  u.searchParams.set("radiusMi", String(q.radiusMi));
  if (q.minAltitudeFt != null && q.minAltitudeFt !== "") {
    u.searchParams.set("minAltitudeFt", String(q.minAltitudeFt));
  }
  const allow = (q.carrierAllow || "").trim();
  if (allow) u.searchParams.set("carrierAllow", allow);
  const deny = (q.carrierDeny || "").trim();
  if (deny) u.searchParams.set("carrierDeny", deny);
  const group = (q.destGroup || "").trim();
  const mode = (q.destGroupMode || "").trim();
  if (group && mode) {
    u.searchParams.set("destGroup", group);
    u.searchParams.set("destGroupMode", mode);
  }
  if (q.unique === false) u.searchParams.set("unique", "0");
  else if (q.unique === true) u.searchParams.set("unique", "1");
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
