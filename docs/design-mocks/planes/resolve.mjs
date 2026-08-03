/**
 * Mock-only resolve: ICAO exact file → family SVG → generic-jet.
 * Loaded by poster-ad-wall.html and resolve.test.mjs.
 */

/**
 * @param {string | null | undefined} icao
 * @param {{ icao?: string[] }} manifest
 * @param {Record<string, string>} familyMap
 * @returns {{ tier: 'icao' | 'family' | 'generic', href: string, icao: string }}
 */
export function resolvePlaneAsset(icao, manifest, familyMap) {
  const code = String(icao ?? '')
    .trim()
    .toUpperCase();
  const exact = Array.isArray(manifest?.icao) ? manifest.icao.map((x) => String(x).toUpperCase()) : [];

  if (code && exact.includes(code)) {
    return { tier: 'icao', href: `planes/${code}.svg`, icao: code };
  }

  const familyKey = code ? familyMap?.[code] : undefined;
  if (familyKey) {
    return { tier: 'family', href: `planes/_family/${familyKey}.svg`, icao: code };
  }

  return { tier: 'generic', href: 'planes/_family/generic-jet.svg', icao: code };
}
