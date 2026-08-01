import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFlightRow } from "../src/providers.js";

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
