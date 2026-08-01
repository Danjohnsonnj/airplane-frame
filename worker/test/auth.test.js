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
});
