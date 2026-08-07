import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorize, milesToNm, parseFlightsQuery, timingSafeEqual } from "../src/auth.js";

describe("timingSafeEqual", () => {
  it("accepts equal strings", () => {
    assert.equal(timingSafeEqual("abc", "abc"), true);
  });
  it("rejects different strings", () => {
    assert.equal(timingSafeEqual("abc", "abd"), false);
    assert.equal(timingSafeEqual("abc", "ab"), false);
  });
});

describe("authorize", () => {
  it("accepts Bearer token", () => {
    const req = new Request("https://example/flights", {
      headers: { Authorization: "Bearer secret-value" },
    });
    assert.equal(authorize(req, "secret-value"), true);
  });
  it("rejects missing or wrong token", () => {
    assert.equal(authorize(new Request("https://example/flights"), "secret"), false);
    const bad = new Request("https://example/flights", {
      headers: { Authorization: "Bearer nope" },
    });
    assert.equal(authorize(bad, "secret"), false);
  });
});

describe("milesToNm / parseFlightsQuery", () => {
  it("converts statute miles to nm and clamps", () => {
    assert.equal(milesToNm(25), 22);
    assert.equal(milesToNm(0), 25);
    assert.equal(milesToNm(9999), 250);
  });
  it("parses JC query", () => {
    const url = new URL("https://x/flights?lat=40.728&lon=-74.078&radiusMi=25");
    const q = parseFlightsQuery(url);
    assert.equal(q.lat, 40.728);
    assert.equal(q.radiusNm, 22);
  });
  it("errors on bad coords", () => {
    const url = new URL("https://x/flights?lat=nope&lon=-74");
    assert.equal(parseFlightsQuery(url).error != null, true);
  });
  it("parses pack filter defaults", () => {
    const url = new URL("https://x/flights?lat=40.728&lon=-74.078&radiusMi=25");
    const q = parseFlightsQuery(url);
    assert.equal(q.minAltitudeFt, 0);
    assert.deepEqual(q.carrierAllow, []);
    assert.deepEqual(q.carrierDeny, []);
    assert.equal(q.destGroup, null);
    assert.equal(q.destGroupMode, null);
    assert.equal(q.unique, true);
    assert.equal(q.sortByDistance, false);
  });
  it("parses filter query params", () => {
    const url = new URL(
      "https://x/flights?lat=40.7&lon=-74&minAltitudeFt=5000" +
        "&carrierAllow=United,Delta&carrierDeny=Spirit" +
        "&destGroup=nyc&destGroupMode=prefer&unique=0&sortByDistance=1",
    );
    const q = parseFlightsQuery(url);
    assert.equal(q.minAltitudeFt, 5000);
    assert.deepEqual(q.carrierAllow, ["United", "Delta"]);
    assert.deepEqual(q.carrierDeny, ["Spirit"]);
    assert.equal(q.destGroup, "nyc");
    assert.equal(q.destGroupMode, "prefer");
    assert.equal(q.unique, false);
    assert.equal(q.sortByDistance, true);
  });
  it("errors on invalid sortByDistance", () => {
    const url = new URL("https://x/flights?lat=40.7&lon=-74&sortByDistance=2");
    assert.match(parseFlightsQuery(url).error || "", /sortByDistance/);
  });
  it("errors when destGroup set without destGroupMode", () => {
    const url = new URL("https://x/flights?lat=40.7&lon=-74&destGroup=nyc");
    assert.match(parseFlightsQuery(url).error || "", /destGroupMode/);
  });
  it("errors on unknown destGroup", () => {
    const url = new URL(
      "https://x/flights?lat=40.7&lon=-74&destGroup=bos&destGroupMode=exclude",
    );
    assert.match(parseFlightsQuery(url).error || "", /destGroup/);
  });
});
