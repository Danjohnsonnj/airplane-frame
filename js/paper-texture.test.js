import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function readRepo(rel) {
  return readFile(join(root, rel), "utf8");
}

describe("paper texture ship", () => {
  it("production texture assets exist", async () => {
    await access(join(root, "assets/textures/paper-texture-size-medium.jpg"));
    await access(join(root, "assets/textures/ATTRIBUTION.md"));
  });

  it("index.html links poster-paper.css and defines warp filters 1–10", async () => {
    const html = await readRepo("index.html");
    assert.match(html, /css\/poster-paper\.css/);
    for (let n = 1; n <= 10; n += 1) {
      assert.match(html, new RegExp(`id="paper-warp-${n}"`));
    }
  });

  it("poster-paper.css wires dial vars and slot selectors 1–10", async () => {
    const css = await readRepo("css/poster-paper.css");
    assert.match(css, /opacity:\s*var\(--paper-opacity\)/);
    assert.match(css, /mix-blend-mode:\s*var\(--paper-blend-mode\)/);
    for (let n = 1; n <= 10; n += 1) {
      assert.match(css, new RegExp(`data-paper-slot="${n}"`));
      assert.match(css, new RegExp(`data-warp="${n}"`));
    }
  });

  it("createFlightPanel injects paper layers; createStatusPanel does not", async () => {
    const app = await readRepo("js/app.js");
    const flightPanelStart = app.indexOf("function createFlightPanel");
    const statusPanelStart = app.indexOf("function createStatusPanel");
    assert.notEqual(flightPanelStart, -1);
    assert.notEqual(statusPanelStart, -1);
    const flightPanelSrc = app.slice(flightPanelStart, statusPanelStart);
    assert.match(flightPanelSrc, /assignPaperSlot/);
    assert.match(flightPanelSrc, /paper-surface/);
    assert.match(flightPanelSrc, /paper-wear-layer/);
    assert.match(flightPanelSrc, /assets\/textures\/paper-texture-size-medium\.jpg/);
    const statusPanelEnd = app.indexOf("function renderPosterWall");
    const statusPanelSrc = app.slice(statusPanelStart, statusPanelEnd);
    assert.doesNotMatch(statusPanelSrc, /paper-surface/);
    assert.doesNotMatch(statusPanelSrc, /paper-wear-layer/);
  });
});
