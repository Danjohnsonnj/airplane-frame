/**
 * KV candidate cache: key helpers, freshness, and resolveCandidates.
 */

export function candidateCacheKey(lat, lon, radiusNm) {
  const la = Number(lat).toFixed(3);
  const lo = Number(lon).toFixed(3);
  const r = String(Math.round(Number(radiusNm)));
  return `cand:${la}:${lo}:${r}`;
}

export function isFresh(fetchedAt, nowMs, freshTtlSec) {
  if (!Number.isFinite(fetchedAt) || !Number.isFinite(nowMs)) return false;
  const ttlMs = Number(freshTtlSec) * 1000;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return false;
  return nowMs - fetchedAt < ttlMs;
}

export function ageSeconds(fetchedAt, nowMs) {
  if (!Number.isFinite(fetchedAt) || !Number.isFinite(nowMs)) return 0;
  return Math.max(0, Math.floor((nowMs - fetchedAt) / 1000));
}

/**
 * @param {object} opts
 * @param {{ get: Function, put: Function }} opts.kv
 * @param {() => Promise<object[]>} opts.fetchFresh
 * @param {string} opts.key
 * @param {object} opts.pin
 * @param {number} opts.nowMs
 * @param {number} opts.freshTtlSec
 * @param {number} opts.staleTtlSec
 * @returns {Promise<{ candidates: object[], stale: boolean, ageSeconds: number, fetchedAt: number }>}
 */
export async function resolveCandidates(opts) {
  const {
    kv,
    fetchFresh,
    key,
    pin,
    nowMs,
    freshTtlSec,
    staleTtlSec,
  } = opts;

  const raw = await kv.get(key, "text");
  let record = null;
  if (raw) {
    try {
      record = JSON.parse(raw);
    } catch {
      record = null;
    }
  }

  const hasRecord =
    record &&
    Number.isFinite(record.fetchedAt) &&
    Array.isArray(record.candidates);

  if (hasRecord && isFresh(record.fetchedAt, nowMs, freshTtlSec)) {
    return {
      candidates: record.candidates,
      stale: false,
      ageSeconds: ageSeconds(record.fetchedAt, nowMs),
      fetchedAt: record.fetchedAt,
    };
  }

  try {
    const candidates = await fetchFresh();
    const fetchedAt = nowMs;
    const payload = { fetchedAt, candidates, pin };
    await kv.put(key, JSON.stringify(payload), {
      expirationTtl: staleTtlSec,
    });
    return {
      candidates,
      stale: false,
      ageSeconds: 0,
      fetchedAt,
    };
  } catch (err) {
    if (hasRecord) {
      return {
        candidates: record.candidates,
        stale: true,
        ageSeconds: ageSeconds(record.fetchedAt, nowMs),
        fetchedAt: record.fetchedAt,
      };
    }
    throw err;
  }
}
