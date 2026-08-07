import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  missCacheKey,
  normalizeCallsign,
  positiveCacheKey,
  readMiss,
  readPositive,
  writeMiss,
  writePositive,
} from "../src/callsign-cache.js";

function memoryKv() {
  /** @type {Record<string, string>} */
  const store = Object.create(null);
  return {
    async get(key) {
      return store[key] ?? null;
    },
    async put(key, value) {
      store[key] = String(value);
    },
    store,
  };
}

describe("callsign cache keys", () => {
  it("normalizes callsign to uppercase trim", () => {
    assert.equal(normalizeCallsign(" ual1 "), "UAL1");
    assert.equal(positiveCacheKey("ual1"), "cs:UAL1");
    assert.equal(missCacheKey("adsbdb", "ual1"), "cs:miss:adsbdb:UAL1");
    assert.equal(missCacheKey("airlabs", "ual1"), "cs:miss:airlabs:UAL1");
  });
});

describe("readPositive / writePositive", () => {
  it("returns fresh hit and omits expired", async () => {
    const kv = memoryKv();
    const nowMs = 1_000_000;
    await writePositive(
      kv,
      "UAL1",
      { origin: "SFO", destination: "EWR", carrier: "United Airlines" },
      nowMs,
    );

    const hit = await readPositive(kv, "ual1", nowMs + 100_000, 900);
    assert.deepEqual(hit, {
      origin: "SFO",
      destination: "EWR",
      carrier: "United Airlines",
      originCity: "San Francisco",
      destinationCity: "Newark",
    });

    const expired = await readPositive(kv, "UAL1", nowMs + 901_000, 900);
    assert.equal(expired, null);
  });

  it("treats corrupt JSON as miss", async () => {
    const kv = memoryKv();
    await kv.put(positiveCacheKey("UAL2"), "{not json");
    assert.equal(await readPositive(kv, "UAL2", Date.now(), 900), null);
  });

  it("stores resolved city fields on write", async () => {
    const kv = memoryKv();
    const nowMs = 3_000_000;
    await writePositive(
      kv,
      "DAL1",
      { origin: "BOS", destination: "LAX", carrier: "Delta Air Lines" },
      nowMs,
    );
    const raw = JSON.parse(kv.store[positiveCacheKey("DAL1")]);
    assert.equal(raw.originCity, "Boston");
    assert.equal(raw.destinationCity, "Los Angeles");
  });
});

describe("readMiss / writeMiss", () => {
  it("returns fresh miss and omits expired", async () => {
    const kv = memoryKv();
    const nowMs = 2_000_000;
    await writeMiss(kv, "adsbdb", "N123AB", nowMs);

    assert.equal(await readMiss(kv, "adsbdb", "N123AB", nowMs + 100_000, 600), true);
    assert.equal(await readMiss(kv, "adsbdb", "N123AB", nowMs + 601_000, 600), false);
    assert.equal(await readMiss(kv, "airlabs", "N123AB", nowMs, 600), false);
  });
});
