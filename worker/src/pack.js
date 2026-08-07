/** NYC metro IATA codes used for destGroup=nyc and airport-interest bias. */
export const NYC_METRO = new Set(["EWR", "LGA", "JFK"]);

export function parseTokenList(raw) {
  if (raw == null || raw === "") return [];
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function matchesCarrierToken(carrier, token) {
  if (!carrier || !token) return false;
  return String(carrier).toLowerCase().includes(String(token).toLowerCase());
}

function normalizeAirport(code) {
  if (code == null) return "";
  let s = String(code).trim().toUpperCase();
  if (s.startsWith("K") && s.length === 4) s = s.slice(1);
  return s;
}

export function isMetroAirport(code, metro = NYC_METRO) {
  return metro.has(normalizeAirport(code));
}

/** Finite non-negative distance in nm, else Infinity for sort-last. */
export function distanceRank(value) {
  if (value == null || value === "") return Infinity;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : Infinity;
}

export function compareByDistanceAsc(a, b) {
  return distanceRank(a.distanceNm) - distanceRank(b.distanceNm);
}

export function sortFlightsByDistanceAsc(flights) {
  return [...flights].sort(compareByDistanceAsc);
}

export function interestScore(flight, metro = NYC_METRO) {
  let score = 0;
  if (isMetroAirport(flight.destination, metro)) score += 2;
  if (isMetroAirport(flight.origin, metro)) score += 1;
  const dist = Number(flight.distanceNm);
  if (Number.isFinite(dist) && dist >= 0) {
    score += 0.1 * (1 / (1 + dist));
  }
  return score;
}

function isComplete(f) {
  if (!f || typeof f !== "object") return false;
  return Boolean(
    String(f.carrier || "").trim() &&
      String(f.destination || "").trim() &&
      String(f.planeType || "").trim(),
  );
}

/**
 * Hard filters before packing: altitude, carrier allow/deny, dest exclude.
 * @param {object[]} candidates
 * @param {{ minAltitudeFt: number, carrierAllow: string[], carrierDeny: string[], destGroup: string|null, destGroupMode: string|null }} opts
 */
export function filterCandidates(candidates, opts) {
  const list = Array.isArray(candidates) ? candidates : [];
  const minAlt = Number(opts.minAltitudeFt) || 0;
  const allow = opts.carrierAllow || [];
  const deny = opts.carrierDeny || [];
  const excludeMetro =
    opts.destGroup === "nyc" && opts.destGroupMode === "exclude";

  return list.filter((f) => {
    if (!isComplete(f)) return false;
    const alt = Number(f.altitudeFt);
    if (!Number.isFinite(alt)) return false;
    if (minAlt > 0 && alt < minAlt) return false;

    if (allow.length > 0) {
      const ok = allow.some((t) => matchesCarrierToken(f.carrier, t));
      if (!ok) return false;
    }
    if (deny.some((t) => matchesCarrierToken(f.carrier, t))) return false;

    if (excludeMetro && isMetroAirport(f.destination)) return false;
    return true;
  });
}

function carrierKey(f) {
  return String(f.carrier || "")
    .trim()
    .toLowerCase();
}

function destKey(f) {
  return normalizeAirport(f.destination);
}

function pickBest(pool, pack, unique, sortByDistance) {
  if (pool.length === 0) return null;
  const usedCarriers = new Set(pack.map(carrierKey));
  const usedDests = new Set(pack.map(destKey));

  const byRank = sortByDistance
    ? compareByDistanceAsc
    : (a, b) => interestScore(b) - interestScore(a);

  if (!unique) {
    return [...pool].sort(byRank)[0];
  }

  const both = pool.filter(
    (f) => !usedCarriers.has(carrierKey(f)) && !usedDests.has(destKey(f)),
  );
  if (both.length) return both.sort(byRank)[0];

  const either = pool.filter(
    (f) => !usedCarriers.has(carrierKey(f)) || !usedDests.has(destKey(f)),
  );
  if (either.length) return either.sort(byRank)[0];

  return [...pool].sort(byRank)[0];
}

function fillFromPool(pack, pool, size, unique, sortByDistance) {
  const remaining = [...pool];
  while (pack.length < size && remaining.length > 0) {
    const next = pickBest(remaining, pack, unique, sortByDistance);
    if (!next) break;
    pack.push(next);
    const idx = remaining.indexOf(next);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return remaining;
}

/**
 * Filter then diversity-pack candidates.
 * @param {object[]} candidates
 * @param {{ size: number, unique: boolean, sortByDistance?: boolean, minAltitudeFt: number, carrierAllow: string[], carrierDeny: string[], destGroup: string|null, destGroupMode: string|null }} opts
 */
export function selectPack(candidates, opts) {
  const size = Math.max(1, Number(opts.size) || 5);
  const unique = opts.unique !== false;
  const sortByDistance = Boolean(opts.sortByDistance);
  let filtered = filterCandidates(candidates, opts);
  if (sortByDistance) {
    filtered = sortFlightsByDistanceAsc(filtered);
  }
  const pack = [];

  const preferMetro =
    opts.destGroup === "nyc" && opts.destGroupMode === "prefer";

  if (preferMetro) {
    const metroPool = filtered.filter((f) => isMetroAirport(f.destination));
    fillFromPool(pack, metroPool, size, unique, sortByDistance);
    const remaining = filtered.filter((f) => !pack.includes(f));
    fillFromPool(pack, remaining, size, unique, sortByDistance);
  } else {
    fillFromPool(pack, filtered, size, unique, sortByDistance);
  }

  return sortByDistance ? sortFlightsByDistanceAsc(pack) : pack;
}
