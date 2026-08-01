import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFlightsUrl,
  filterFlights,
  isCompleteFlight,
  parseStoredNumber,
  pickGeocodeResult,
  unauthorizedStatusMessage,
} from "./lib.js";

describe("isCompleteFlight", () => {
  it("requires carrier, destination, and planeType", () => {
    assert.equal(
      isCompleteFlight({
        carrier: "United",
        destination: "ORD",
        planeType: "Boeing 737",
      }),
      true,
    );
    assert.equal(
      isCompleteFlight({ carrier: "", destination: "ORD", planeType: "B737" }),
      false,
    );
    assert.equal(isCompleteFlight(null), false);
  });
});

describe("filterFlights", () => {
  const rows = [
    { carrier: "A", destination: "X", planeType: "B737", altitudeFt: 8000 },
    { carrier: "B", destination: "Y", planeType: "A320", altitudeFt: 3000 },
    { carrier: "C", destination: "Z", planeType: "B787", altitudeFt: 5000 },
    { carrier: "", destination: "Z", planeType: "B787", altitudeFt: 9000 },
  ];

  it("keeps complete flights at or above min altitude", () => {
    const out = filterFlights(rows, 5000);
    assert.equal(out.length, 2);
    assert.deepEqual(
      out.map((f) => f.carrier),
      ["A", "C"],
    );
  });

  it("treats non-array as empty", () => {
    assert.deepEqual(filterFlights(null, 0), []);
  });
});

describe("parseStoredNumber", () => {
  it("falls back when raw is invalid", () => {
    assert.equal(parseStoredNumber("25", 10), 25);
    assert.equal(parseStoredNumber("nope", 10), 10);
    assert.equal(parseStoredNumber(null, 10), 10);
  });
});

describe("buildFlightsUrl", () => {
  it("builds query with lat lon radiusMi", () => {
    const url = buildFlightsUrl("https://example.workers.dev", {
      lat: 40.728,
      lon: -74.078,
      radiusMi: 25,
    });
    assert.equal(
      url,
      "https://example.workers.dev/flights?lat=40.728&lon=-74.078&radiusMi=25",
    );
  });
});

describe("pickGeocodeResult", () => {
  it("returns first valid lat/lon", () => {
    const picked = pickGeocodeResult({
      results: [{ name: "Jersey City", latitude: 40.72, longitude: -74.07, admin1: "New Jersey", country: "United States" }],
    });
    assert.equal(picked.lat, 40.72);
    assert.equal(picked.lon, -74.07);
    assert.equal(picked.name, "Jersey City");
  });

  it("returns null when empty", () => {
    assert.equal(pickGeocodeResult({ results: [] }), null);
    assert.equal(pickGeocodeResult(null), null);
  });
});

describe("unauthorizedStatusMessage", () => {
  it("names APP_SHARED_SECRET and warns against AIRLABS_API_KEY", () => {
    const msg = unauthorizedStatusMessage();
    assert.match(msg, /APP_SHARED_SECRET/);
    assert.match(msg, /AIRLABS_API_KEY/);
    assert.match(msg, /paused/i);
  });
});
