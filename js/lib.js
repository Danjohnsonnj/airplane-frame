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
 *   sortByDistance?: boolean,
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
  if (q.sortByDistance === true) u.searchParams.set("sortByDistance", "1");
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

/** Map browser fetch failures to actionable local-dev hints. */
export function friendlyFetchErrorMessage(err, workerBase) {
  const msg = String(err?.message || err || "");
  if (/failed to fetch/i.test(msg)) {
    const base = workerBase || "Worker";
    return `Cannot reach ${base} — start scripts/dev-worker.sh (port 8788) alongside dev-pages.sh.`;
  }
  return msg || "Request failed";
}

/**
 * Legal/ownOp strings → brand-book display names (airlines-seen-2026-08-01).
 * Keep in sync with worker/src/carrier-aliases.js.
 */
export const CARRIER_ALIASES = {
  "UNITED AIRLINES INC": "United Airlines",
  "DELTA AIR LINES INC": "Delta Air Lines",
  "AMERICAN AIRLINES INC": "American Airlines",
};

export function normalizeCarrierKey(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Resolve raw Worker carrier to brand-book name for data-carrier / CSS.
 * @param {string} raw
 * @param {Set<string> | string[]} brandNames
 * @returns {string | null}
 */
export function resolveCarrierBrand(raw, brandNames) {
  const brandList = brandNames instanceof Set ? [...brandNames] : brandNames || [];
  const brandSet = brandNames instanceof Set ? brandNames : new Set(brandList);
  const key = normalizeCarrierKey(raw);
  if (!key) return null;

  let candidate = CARRIER_ALIASES[key];
  if (!candidate) {
    for (const book of brandSet) {
      if (normalizeCarrierKey(book) === key) {
        candidate = book;
        break;
      }
    }
  }
  if (candidate && brandSet.has(candidate)) return candidate;
  return null;
}

/** Default swatch cycle for unknown carriers within a pack (each swatch used once). */
export const DEFAULT_SWATCH_ORDER = [
  "ground-sun",
  "ground-navy",
  "ground-rose",
  "ground-teal",
  "ground-coral",
  "ground-mint",
];

/**
 * @param {number} index Panel index in the current pack
 * @param {number} [slotCount] Number of distinct paper slots (default 10)
 */
export function assignPaperSlot(index, slotCount = 10) {
  const count = Number(slotCount);
  const n = Number(index);
  if (!Number.isFinite(count) || count < 1) return 1;
  if (!Number.isFinite(n)) return 1;
  return (((Math.floor(n) % count) + count) % count) + 1;
}

/**
 * Brand-book carriers always get data-carrier (duplicates share the same brand color).
 * Unknown carriers get unique ground-* swatches (no repeated --sun, --navy, etc.).
 * @param {Array<{ carrier?: string }>} flights
 * @param {Set<string> | string[]} brandNames
 * @param {string[]} swatchOrder
 */
export function assignPanelGrounds(flights, brandNames, swatchOrder = DEFAULT_SWATCH_ORDER) {
  const brandSet =
    brandNames instanceof Set ? brandNames : new Set(brandNames || []);
  const usedGrounds = new Set();
  const list = Array.isArray(flights) ? flights : [];

  return list.map((f) => {
    const carrier = String(f?.carrier || "").trim();
    const resolved = resolveCarrierBrand(carrier, brandSet);
    if (resolved) {
      return { dataCarrier: resolved };
    }
    const groundClass = swatchOrder.find((g) => !usedGrounds.has(g));
    if (groundClass) {
      usedGrounds.add(groundClass);
      return { groundClass };
    }
    return { groundClass: swatchOrder[0] };
  });
}

/**
 * @param {{ orientation?: string, width?: number }} opts
 */
export function resolveWallMode({ orientation }) {
  if (orientation === "landscape") return "columns";
  return "rows";
}

/**
 * @param {{
 *   flightsLength: number,
 *   httpError?: boolean,
 *   networkError?: boolean,
 *   stale?: boolean,
 *   loading?: boolean,
 * }} opts
 */
export function posterStatusKind(opts) {
  const flightsLength = Number(opts.flightsLength) || 0;
  if (opts.loading) return "wait";
  if (opts.networkError || opts.httpError) return "err";
  if (flightsLength > 0) return "ok";
  if (opts.stale) return "stale";
  return "empty";
}

export function formatDistanceNm(nm) {
  if (nm == null || !Number.isFinite(Number(nm))) return "—";
  return `${Number(nm).toFixed(1)} nm`;
}

export function formatRoute(origin, destination) {
  const dest = String(destination || "").trim();
  const orig = String(origin || "").trim();
  if (orig && dest) return `${orig} → ${dest}`;
  if (dest) return `→ ${dest}`;
  return "—";
}

/** Poster route labels: city per endpoint, falling back to airport code. */
export function formatCityRoute(origin, originCity, destination, destinationCity) {
  const destCode = String(destination || "").trim();
  const origCode = String(origin || "").trim();
  const destLabel = String(destinationCity || "").trim() || destCode;
  const origLabel = String(originCity || "").trim() || origCode;
  if (origLabel && destLabel) return `${origLabel} → ${destLabel}`;
  if (destLabel) return `→ ${destLabel}`;
  return "—";
}

/**
 * @param {'wait'|'empty'|'stale'|'err'} kind
 * @param {{ radiusMi?: number, updatedLabel?: string, errorDetail?: string, unauthorized?: boolean }} opts
 */
export function buildPosterStatusCopy(kind, opts = {}) {
  const radiusMi = Number(opts.radiusMi) || 25;
  const updated = opts.updatedLabel || "—";
  if (kind === "wait") {
    return {
      word: "WAIT",
      status: "Refreshing flight data.",
      detail: "Hang tight while we load the pack.",
      action: "Wait for the update to finish.",
      updated,
    };
  }
  if (kind === "empty") {
    return {
      word: "EMPTY",
      status: "The sky is quiet nearby.",
      detail: `No flights found inside your ${radiusMi} mi frame.`,
      action: "Adjust location or distance",
      updated,
    };
  }
  if (kind === "stale") {
    return {
      word: "STALE",
      status: "Showing cached flight data.",
      detail: "Upstream sources were unavailable; counts may be old.",
      action: "Refresh or open settings",
      updated,
    };
  }
  if (kind === "err") {
    const detail =
      opts.errorDetail ||
      (opts.unauthorized
        ? unauthorizedStatusMessage()
        : "The latest request could not be completed.");
    return {
      word: "ERR",
      status: "Flight data is unavailable.",
      detail,
      action: "Open settings or try again",
      updated,
    };
  }
  return { word: "", status: "", detail: "", action: "", updated: "" };
}

export function formatPackStatus(opts) {
  const shown = Number(opts.shown) || 0;
  const parts = [`Pack ${shown}`];
  if (opts.packMax != null && Number.isFinite(Number(opts.packMax))) {
    parts[0] += ` (max ${Number(opts.packMax)})`;
  }
  if (
    opts.candidateCount != null &&
    Number.isFinite(Number(opts.candidateCount))
  ) {
    parts.push(`${Number(opts.candidateCount)} total flights`);
  }
  if (opts.stale && Number.isFinite(Number(opts.ageSeconds))) {
    const mins = Math.max(1, Math.floor(Number(opts.ageSeconds) / 60));
    parts.push(`data ${mins} min old`);
  }
  parts.push(`updated ${opts.updatedLabel}`);
  return parts.join(" · ");
}
