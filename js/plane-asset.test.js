import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { resolvePlaneAsset } from "./plane-asset.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function loadFixtures() {
  const [manifest, familyMap] = await Promise.all([
    readFile(join(root, "assets/planes/manifest.json"), "utf8").then(JSON.parse),
    readFile(join(root, "assets/planes/family-map.json"), "utf8").then(JSON.parse),
  ]);
  return { manifest, familyMap };
}

describe("resolvePlaneAsset", () => {
  it("B738 resolves to exact ICAO file", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("B738", manifest, familyMap);
    assert.equal(r.tier, "icao");
    assert.equal(r.href, "assets/planes/B738.svg");
    assert.equal(r.icao, "B738");
  });

  it("E75L falls back to regional-jet family", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("E75L", manifest, familyMap);
    assert.equal(r.tier, "family");
    assert.equal(r.href, "assets/planes/family/regional-jet.svg");
  });

  it("E190 falls back to regional-jet family", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("E190", manifest, familyMap);
    assert.equal(r.tier, "family");
    assert.equal(r.href, "assets/planes/family/regional-jet.svg");
  });

  it("A319 falls back to narrowbody family", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("A319", manifest, familyMap);
    assert.equal(r.tier, "family");
    assert.equal(r.href, "assets/planes/family/narrowbody.svg");
  });

  it("B77W exact widebody ICAO wins over family-map", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("B77W", manifest, familyMap);
    assert.equal(r.tier, "icao");
    assert.equal(r.href, "assets/planes/B77W.svg");
  });

  it("A333 exact ICAO (widebody family source)", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("A333", manifest, familyMap);
    assert.equal(r.tier, "icao");
    assert.equal(r.href, "assets/planes/A333.svg");
  });

  it("ZZZZ falls back to generic-jet", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("ZZZZ", manifest, familyMap);
    assert.equal(r.tier, "generic");
    assert.equal(r.href, "assets/planes/family/generic-jet.svg");
  });

  it("null/blank falls back to generic-jet", async () => {
    const { manifest, familyMap } = await loadFixtures();
    assert.equal(resolvePlaneAsset(null, manifest, familyMap).tier, "generic");
    assert.equal(resolvePlaneAsset("", manifest, familyMap).tier, "generic");
    assert.equal(resolvePlaneAsset(undefined, manifest, familyMap).tier, "generic");
    assert.equal(
      resolvePlaneAsset(null, manifest, familyMap).href,
      "assets/planes/family/generic-jet.svg",
    );
  });

  it("family and generic hrefs avoid underscore dirs (GitHub Pages/Jekyll)", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const family = resolvePlaneAsset("E75L", manifest, familyMap);
    const generic = resolvePlaneAsset("ZZZZ", manifest, familyMap);
    assert.match(family.href, /\/family\//);
    assert.doesNotMatch(family.href, /\/_/);
    assert.match(generic.href, /\/family\//);
    assert.doesNotMatch(generic.href, /\/_/);
  });

  it("lowercase icao normalizes", async () => {
    const { manifest, familyMap } = await loadFixtures();
    const r = resolvePlaneAsset("a320", manifest, familyMap);
    assert.equal(r.tier, "icao");
    assert.equal(r.href, "assets/planes/A320.svg");
    assert.equal(r.icao, "A320");
  });
});
