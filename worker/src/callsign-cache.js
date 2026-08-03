import { isFresh } from "./cache.js";

/** @param {string} callsign */
export function normalizeCallsign(callsign) {
  return (callsign || "").trim().toUpperCase();
}

/** @param {string} callsign */
export function positiveCacheKey(callsign) {
  return `cs:${normalizeCallsign(callsign)}`;
}

/**
 * @param {"adsbdb"|"airlabs"} source
 * @param {string} callsign
 */
export function missCacheKey(source, callsign) {
  const src = source === "airlabs" ? "airlabs" : "adsbdb";
  return `cs:miss:${src}:${normalizeCallsign(callsign)}`;
}

/**
 * @param {{ get: Function }} kv
 * @param {string} key
 */
async function readKvJson(kv, key) {
  const raw = await kv.get(key, "text");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {{ get: Function }} kv
 * @param {string} callsign
 * @param {number} nowMs
 * @param {number} ttlSec
 * @returns {Promise<{ origin: string|null, destination: string, carrier: string|null }|null>}
 */
export async function readPositive(kv, callsign, nowMs, ttlSec) {
  if (!kv) return null;
  const record = await readKvJson(kv, positiveCacheKey(callsign));
  if (!record || !Number.isFinite(record.fetchedAt)) return null;
  if (!isFresh(record.fetchedAt, nowMs, ttlSec)) return null;
  const destination = record.destination && String(record.destination).trim();
  if (!destination) return null;
  return {
    origin: record.origin ? String(record.origin).trim() : null,
    destination,
    carrier: record.carrier ? String(record.carrier).trim() : null,
  };
}

/**
 * @param {{ put: Function }} kv
 * @param {string} callsign
 * @param {{ origin?: string|null, destination: string, carrier?: string|null }} fields
 * @param {number} nowMs
 */
export async function writePositive(kv, callsign, fields, nowMs) {
  if (!kv) return;
  const destination = fields.destination && String(fields.destination).trim();
  if (!destination) return;
  const payload = {
    origin: fields.origin ? String(fields.origin).trim() : null,
    destination,
    carrier: fields.carrier ? String(fields.carrier).trim() : null,
    fetchedAt: nowMs,
  };
  await kv.put(positiveCacheKey(callsign), JSON.stringify(payload));
}

/**
 * @param {{ get: Function }} kv
 * @param {"adsbdb"|"airlabs"} source
 * @param {string} callsign
 * @param {number} nowMs
 * @param {number} ttlSec
 */
export async function readMiss(kv, source, callsign, nowMs, ttlSec) {
  if (!kv) return false;
  const record = await readKvJson(kv, missCacheKey(source, callsign));
  if (!record || !Number.isFinite(record.fetchedAt)) return false;
  return isFresh(record.fetchedAt, nowMs, ttlSec);
}

/**
 * @param {{ put: Function }} kv
 * @param {"adsbdb"|"airlabs"} source
 * @param {string} callsign
 * @param {number} nowMs
 */
export async function writeMiss(kv, source, callsign, nowMs) {
  if (!kv) return;
  await kv.put(
    missCacheKey(source, callsign),
    JSON.stringify({ fetchedAt: nowMs }),
  );
}
