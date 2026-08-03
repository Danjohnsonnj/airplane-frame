/**
 * ICAO exact file → family SVG → generic-jet.
 * Resolve key: Worker flight.icaoType (do not parse planeType strings).
 */

/**
 * @param {string | null | undefined} icao
 * @param {{ icao?: string[] }} manifest
 * @param {Record<string, string>} familyMap
 * @returns {{ tier: 'icao' | 'family' | 'generic', href: string, icao: string }}
 */
export function resolvePlaneAsset(icao, manifest, familyMap) {
  const code = String(icao ?? "")
    .trim()
    .toUpperCase();
  const exact = Array.isArray(manifest?.icao)
    ? manifest.icao.map((x) => String(x).toUpperCase())
    : [];

  if (code && exact.includes(code)) {
    return { tier: "icao", href: `assets/planes/${code}.svg`, icao: code };
  }

  const familyKey = code ? familyMap?.[code] : undefined;
  if (familyKey) {
    return {
      tier: "family",
      href: `assets/planes/family/${familyKey}.svg`,
      icao: code,
    };
  }

  return {
    tier: "generic",
    href: "assets/planes/family/generic-jet.svg",
    icao: code,
  };
}
