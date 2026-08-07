import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildMapFromCsv,
  buildModuleFromCsv,
  generateModuleSource,
  parseCsvLine,
} from "./generate-airport-city-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureCsv = readFileSync(
  join(here, "fixtures/airports-mini.csv"),
  "utf8",
);

describe("parseCsvLine", () => {
  it("handles quoted commas", () => {
    assert.deepEqual(parseCsvLine('a,"b,c",d'), ["a", "b,c", "d"]);
  });
});

describe("buildMapFromCsv", () => {
  it("maps IATA and ICAO keys to municipality", () => {
    const { map, conflicts } = buildMapFromCsv(fixtureCsv);
    assert.equal(map.JFK, "New York");
    assert.equal(map.KJFK, "New York");
    assert.equal(map.LHR, "London");
    assert.equal(map.EGLL, "London");
    assert.equal(map.SFO, "San Francisco");
    assert.equal(map.LAX, "Los Angeles");
    assert.equal(map.AAA, undefined);
    assert.equal(conflicts.some((c) => c.startsWith("BBB:")), true);
    assert.equal(map.BBB, undefined);
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
    });
    assert.ok(keyCount >= 8);
    assert.match(source, /AIRPORT_CITY_MAP_KEY_COUNT = \d+/);
  });
});
