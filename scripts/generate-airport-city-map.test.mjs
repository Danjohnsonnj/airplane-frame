import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildMapFromCsv,
  buildModuleFromCsv,
  formatAirportPlace,
  generateModuleSource,
  parseCsvLine,
} from "./generate-airport-city-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureCsv = readFileSync(
  join(here, "fixtures/airports-mini.csv"),
  "utf8",
);
const countryNames = {
  US: "United States",
  GB: "United Kingdom",
  KR: "South Korea",
  CA: "Canada",
};

describe("parseCsvLine", () => {
  it("handles quoted commas", () => {
    assert.deepEqual(parseCsvLine('a,"b,c",d'), ["a", "b,c", "d"]);
  });
});

describe("buildMapFromCsv", () => {
  it("maps IATA and ICAO keys to formatted places", () => {
    const { map, conflicts } = buildMapFromCsv(fixtureCsv, countryNames);
    assert.equal(map.JFK, "New York, NY");
    assert.equal(map.KJFK, "New York, NY");
    assert.equal(map.LHR, "London, United Kingdom");
    assert.equal(map.EGLL, "London, United Kingdom");
    assert.equal(map.ICN, "Seoul, South Korea");
    assert.equal(map.GUL, "Gulfport");
    assert.equal(map.SFO, "San Francisco, CA");
    assert.equal(map.LAX, "Los Angeles, CA");
    assert.equal(map.AAA, undefined);
    assert.equal(conflicts.some((c) => c.startsWith("BBB:")), true);
    assert.equal(map.BBB, undefined);
  });

  it("formats place labels according to country and region", () => {
    assert.equal(
      formatAirportPlace("New York", "US", "US-NY", countryNames),
      "New York, NY",
    );
    assert.equal(
      formatAirportPlace("Washington", "US", "US-DC", countryNames),
      "Washington, DC",
    );
    assert.equal(
      formatAirportPlace("Gulfport", "US", "", countryNames),
      "Gulfport",
    );
    assert.equal(
      formatAirportPlace("Seoul", "KR", "KR-11", countryNames),
      "Seoul, South Korea",
    );
  });
});

describe("generateModuleSource", () => {
  it("emits lookup helper and metadata", () => {
    const src = generateModuleSource(
      { JFK: "New York" },
      {
        sourceUrl: "https://example.test/airports.csv",
        generatedAt: "2026-08-07",
        rowCount: 1,
        skippedNoMunicipality: 0,
        conflictCount: 0,
      },
    );
    assert.match(src, /export const AIRPORT_CITY_MAP/);
    assert.match(src, /export function lookupAirportCity/);
    assert.match(src, /"JFK": "New York"/);
  });
});

describe("buildModuleFromCsv", () => {
  it("builds importable module from fixture", () => {
    const { source, keyCount } = buildModuleFromCsv(fixtureCsv, {
      generatedAt: "2026-08-07",
    }, countryNames);
    assert.ok(keyCount >= 8);
    assert.match(source, /AIRPORT_CITY_MAP_KEY_COUNT = \d+/);
  });
});
