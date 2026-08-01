import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFlightRow, fetchAirplanesLive } from "../src/providers.js";

describe("fetchAirplanesLive", () => {
  it("retries once on 429 then succeeds", async () => {
    let calls = 0;
    const mockFetch = async (url) => {
      calls += 1;
      if (calls === 1) {
        return { ok: false, status: 429, text: async () => "" };
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ac: [{ flight: "UAL1", desc: "B737", alt_baro: 5000 }] }),
      };
    };
    const ac = await fetchAirplanesLive(40.728, -74.078, 22, {
      fetch: mockFetch,
      retryDelayMs: 1,
    });
    assert.equal(calls, 2);
    assert.equal(ac.length, 1);
  });

  it("throws after retry still fails", async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 429,
      text: async () => "",
    });
    await assert.rejects(
      () =>
        fetchAirplanesLive(40.728, -74.078, 22, {
          fetch: mockFetch,
          retryDelayMs: 1,
        }),
      /HTTP 429/,
    );
  });
});

describe("buildFlightRow", () => {
  const base = {
    flight: "UAL700  ",
    desc: "BOEING 737 MAX 9",
    t: "B39M",
    ownOp: "UMB BANK NA TRUSTEE",
    alt_baro: 5000,
    dst: 10,
    lat: 40.7,
    lon: -74.0,
  };

  it("prefers AirLabs carrier and destination", () => {
    const row = buildFlightRow(
      base,
      {
        airline_name: "United Airlines",
        dep_iata: "BOS",
        arr_iata: "EWR",
      },
      null,
    );
    assert.equal(row.carrier, "United Airlines");
    assert.equal(row.destination, "EWR");
    assert.equal(row.origin, "BOS");
    assert.equal(row.enrichmentSource, "airlabs");
    assert.equal(row.planeType, "BOEING 737 MAX 9");
  });

  it("falls back to hexdb route", () => {
    const row = buildFlightRow(base, null, { route: "KBOS-KEWR" });
    assert.equal(row.destination, "KEWR");
    assert.equal(row.origin, "KBOS");
    assert.equal(row.enrichmentSource, "hexdb");
    assert.equal(row.carrier, "UMB BANK NA TRUSTEE");
  });

  it("returns null without destination", () => {
    assert.equal(buildFlightRow(base, null, null), null);
  });

  it("skips ground aircraft", () => {
    assert.equal(buildFlightRow({ ...base, alt_baro: "ground" }, { arr_iata: "EWR", airline_name: "United Airlines" }, null), null);
  });
});
