import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePlaneAsset } from './resolve.mjs';

const dir = dirname(fileURLToPath(import.meta.url));

async function loadFixtures() {
  const [manifest, familyMap] = await Promise.all([
    readFile(join(dir, 'manifest.json'), 'utf8').then(JSON.parse),
    readFile(join(dir, 'family-map.json'), 'utf8').then(JSON.parse),
  ]);
  return { manifest, familyMap };
}

test('B738 resolves to exact ICAO file', async () => {
  const { manifest, familyMap } = await loadFixtures();
  const r = resolvePlaneAsset('B738', manifest, familyMap);
  assert.equal(r.tier, 'icao');
  assert.equal(r.href, 'planes/B738.svg');
});

test('E75L falls back to regional-jet family', async () => {
  const { manifest, familyMap } = await loadFixtures();
  const r = resolvePlaneAsset('E75L', manifest, familyMap);
  assert.equal(r.tier, 'family');
  assert.equal(r.href, 'planes/_family/regional-jet.svg');
});

test('ZZZZ falls back to generic-jet', async () => {
  const { manifest, familyMap } = await loadFixtures();
  const r = resolvePlaneAsset('ZZZZ', manifest, familyMap);
  assert.equal(r.tier, 'generic');
  assert.equal(r.href, 'planes/_family/generic-jet.svg');
});

test('lowercase icao normalizes', async () => {
  const { manifest, familyMap } = await loadFixtures();
  const r = resolvePlaneAsset('a320', manifest, familyMap);
  assert.equal(r.tier, 'icao');
  assert.equal(r.href, 'planes/A320.svg');
});
