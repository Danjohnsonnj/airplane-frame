import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageSeconds,
  candidateCacheKey,
  isFresh,
  resolveCandidates,
} from "../src/cache.js";

describe("candidateCacheKey", () => {
  it("rounds lat/lon to 3 decimals and radius to integer nm", () => {
    assert.equal(candidateCacheKey(40.728, -74.078, 21.7), "cand:40.728:-74.078:22");
  });

  it("handles negative longitude and trailing zeros", () => {
    assert.equal(candidateCacheKey(40.7, -74.07, 43), "cand:40.700:-74.070:43");
  });
});

describe("isFresh", () => {
  it("is fresh within TTL", () => {
    assert.equal(isFresh(1000, 1399, 1), true);
    assert.equal(isFresh(1000, 2001, 1), false);
  });
});

describe("ageSeconds", () => {
  it("floors elapsed seconds", () => {
    assert.equal(ageSeconds(1000, 6500), 5);
  });
});

function mockKv(store = {}) {
  return {
    async get(key) {
      return store[key] ?? null;
    },
    async put(key, value, _opts) {
      store[key] = value;
    },
  };
}

describe("resolveCandidates", () => {
  const pin = { lat: 40.728, lon: -74.078, radiusMi: 25, radiusNm: 22 };
  const key = candidateCacheKey(pin.lat, pin.lon, pin.radiusNm);
  const freshTtlSec = 300;
  const staleTtlSec = 1800;

  it("miss: fetchFresh, put KV, return live", async () => {
    const store = {};
    const kv = mockKv(store);
    const candidates = [{ flight: "UAL1", carrier: "United", destination: "EWR", planeType: "B737" }];
    let fetchCount = 0;
    const result = await resolveCandidates({
      kv,
      key,
      pin,
      nowMs: 10_000,
      freshTtlSec,
      staleTtlSec,
      fetchFresh: async () => {
        fetchCount += 1;
        return candidates;
      },
    });
    assert.equal(fetchCount, 1);
    assert.equal(result.stale, false);
    assert.deepEqual(result.candidates, candidates);
    assert.ok(store[key]);
  });

  it("hit + fresh: no fetchFresh", async () => {
    const fetchedAt = 9000;
    const candidates = [{ flight: "DAL2" }];
    const store = {
      [key]: JSON.stringify({ fetchedAt, candidates, pin }),
    };
    const kv = mockKv(store);
    let fetchCount = 0;
    const result = await resolveCandidates({
      kv,
      key,
      pin,
      nowMs: 10_000,
      freshTtlSec,
      staleTtlSec,
      fetchFresh: async () => {
        fetchCount += 1;
        return [];
      },
    });
    assert.equal(fetchCount, 0);
    assert.equal(result.stale, false);
    assert.deepEqual(result.candidates, candidates);
    assert.equal(result.ageSeconds, 1);
  });

  it("hit + stale: fetchFresh fails → return cached stale", async () => {
    const fetchedAt = 1000;
    const candidates = [{ flight: "AAL3" }];
    const store = {
      [key]: JSON.stringify({ fetchedAt, candidates, pin }),
    };
    const kv = mockKv(store);
    const result = await resolveCandidates({
      kv,
      key,
      pin,
      nowMs: 10_000,
      freshTtlSec: 5,
      staleTtlSec,
      fetchFresh: async () => {
        throw new Error("HTTP 429");
      },
    });
    assert.equal(result.stale, true);
    assert.deepEqual(result.candidates, candidates);
    assert.equal(result.ageSeconds, 9);
  });

  it("miss + fetchFresh fail → throws", async () => {
    const kv = mockKv({});
    await assert.rejects(
      () =>
        resolveCandidates({
          kv,
          key,
          pin,
          nowMs: 10_000,
          freshTtlSec,
          staleTtlSec,
          fetchFresh: async () => {
            throw new Error("HTTP 429");
          },
        }),
      /HTTP 429/,
    );
  });
});
