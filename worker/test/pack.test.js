import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NYC_METRO,
  filterCandidates,
  interestScore,
  matchesCarrierToken,
  selectPack,
} from "../src/pack.js";

function flight(overrides) {
  return {
    flight: "X",
    carrier: "Airline",
    destination: "ORD",
    origin: "EWR",
    planeType: "Boeing 737",
    altitudeFt: 10000,
    distanceNm: 20,
    ...overrides,
  };
}

describe("matchesCarrierToken", () => {
  it("matches substring case-insensitively", () => {
    assert.equal(matchesCarrierToken("United Airlines", "united"), true);
    assert.equal(matchesCarrierToken("UAL", "ua"), true);
    assert.equal(matchesCarrierToken("Delta", "united"), false);
  });
});

describe("filterCandidates", () => {
  it("deny removes matching carrier even if on allow list", () => {
    const rows = [
      flight({ carrier: "United Airlines", flight: "UAL1" }),
      flight({ carrier: "Delta Air Lines", flight: "DAL1", destination: "ATL" }),
    ];
    const out = filterCandidates(rows, {
      minAltitudeFt: 0,
      carrierAllow: ["United", "Delta"],
      carrierDeny: ["United"],
      destGroup: null,
      destGroupMode: null,
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].carrier, "Delta Air Lines");
  });

  it("exclude + nyc drops EWR/LGA/JFK destinations", () => {
    const rows = [
      flight({ destination: "EWR", flight: "A" }),
      flight({ destination: "ORD", flight: "B" }),
      flight({ destination: "jfk", flight: "C" }),
    ];
    const out = filterCandidates(rows, {
      minAltitudeFt: 0,
      carrierAllow: [],
      carrierDeny: [],
      destGroup: "nyc",
      destGroupMode: "exclude",
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].destination, "ORD");
  });

  it("prefer + nyc does not drop non-metro destinations", () => {
    const rows = [
      flight({ destination: "EWR", flight: "A" }),
      flight({ destination: "ORD", flight: "B" }),
    ];
    const out = filterCandidates(rows, {
      minAltitudeFt: 0,
      carrierAllow: [],
      carrierDeny: [],
      destGroup: "nyc",
      destGroupMode: "prefer",
    });
    assert.equal(out.length, 2);
  });

  it("drops below minAltitudeFt", () => {
    const rows = [
      flight({ altitudeFt: 3000, flight: "LOW" }),
      flight({ altitudeFt: 8000, flight: "HI" }),
    ];
    const out = filterCandidates(rows, {
      minAltitudeFt: 5000,
      carrierAllow: [],
      carrierDeny: [],
      destGroup: null,
      destGroupMode: null,
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].flight, "HI");
  });
});

describe("interestScore", () => {
  it("boosts metro destination and origin", () => {
    const metroDest = interestScore(flight({ destination: "JFK", origin: "LAX", distanceNm: 50 }));
    const metroOrig = interestScore(flight({ destination: "ORD", origin: "EWR", distanceNm: 50 }));
    const neither = interestScore(flight({ destination: "ORD", origin: "LAX", distanceNm: 50 }));
    assert.ok(metroDest > metroOrig);
    assert.ok(metroOrig > neither);
  });
});

describe("selectPack", () => {
  it("caps pack at size and skips incomplete rows", () => {
    const rows = [
      flight({ carrier: "A", destination: "AA", flight: "1" }),
      flight({ carrier: "B", destination: "BB", flight: "2" }),
      flight({ carrier: "C", destination: "CC", flight: "3" }),
      flight({ carrier: "D", destination: "DD", flight: "4" }),
      flight({ carrier: "E", destination: "EE", flight: "5" }),
      flight({ carrier: "F", destination: "FF", flight: "6" }),
      { carrier: "", destination: "ZZ", planeType: "X", altitudeFt: 9000, flight: "BAD" },
    ];
    const pack = selectPack(rows, {
      size: 5,
      unique: true,
      minAltitudeFt: 0,
      carrierAllow: [],
      carrierDeny: [],
      destGroup: null,
      destGroupMode: null,
    });
    assert.equal(pack.length, 5);
    assert.ok(pack.every((f) => f.carrier && f.destination && f.planeType));
  });

  it("with unique=1 prefers distinct carriers when variety exists", () => {
    const rows = [
      flight({ carrier: "United", destination: "ORD", flight: "U1", distanceNm: 10 }),
      flight({ carrier: "United", destination: "DEN", flight: "U2", distanceNm: 11 }),
      flight({ carrier: "Delta", destination: "ATL", flight: "D1", distanceNm: 12 }),
      flight({ carrier: "JetBlue", destination: "BOS", flight: "J1", distanceNm: 13 }),
      flight({ carrier: "American", destination: "DFW", flight: "A1", distanceNm: 14 }),
      flight({ carrier: "Southwest", destination: "MDW", flight: "S1", distanceNm: 15 }),
    ];
    const pack = selectPack(rows, {
      size: 5,
      unique: true,
      minAltitudeFt: 0,
      carrierAllow: [],
      carrierDeny: [],
      destGroup: null,
      destGroupMode: null,
    });
    assert.equal(pack.length, 5);
    const carriers = pack.map((f) => f.carrier);
    assert.equal(new Set(carriers).size, 5);
  });

  it("prefer fills metro destinations before non-metro", () => {
    const rows = [
      flight({
        carrier: "Far1",
        destination: "LAX",
        origin: "SFO",
        flight: "F1",
        distanceNm: 5,
      }),
      flight({
        carrier: "Far2",
        destination: "ORD",
        origin: "DEN",
        flight: "F2",
        distanceNm: 6,
      }),
      flight({
        carrier: "Metro1",
        destination: "EWR",
        origin: "ORD",
        flight: "M1",
        distanceNm: 40,
      }),
      flight({
        carrier: "Metro2",
        destination: "JFK",
        origin: "BOS",
        flight: "M2",
        distanceNm: 41,
      }),
      flight({
        carrier: "Far3",
        destination: "ATL",
        origin: "MIA",
        flight: "F3",
        distanceNm: 7,
      }),
    ];
    const pack = selectPack(rows, {
      size: 3,
      unique: true,
      minAltitudeFt: 0,
      carrierAllow: [],
      carrierDeny: [],
      destGroup: "nyc",
      destGroupMode: "prefer",
    });
    assert.equal(pack.length, 3);
    assert.equal(pack[0].destination, "EWR");
    assert.equal(pack[1].destination, "JFK");
    assert.ok(!NYC_METRO.has(pack[2].destination.toUpperCase()));
  });
});
