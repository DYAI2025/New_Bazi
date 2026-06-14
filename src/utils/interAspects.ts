import type { ProfileViewModel } from "../viewmodels/profileViewModel";

/**
 * Western inter-aspects between two profiles (REQ-F-001 / F-002).
 *
 * Pure module: no React, no IO/network, no Date.now()/Math.random(). All math
 * is deterministic. German sign/body names match the rest of the app.
 */

/** A single celestial body with an absolute ecliptic longitude in [0, 360). */
export interface BodyPosition {
  name: string;
  longitude: number;
}

/** One detected aspect between a body of profile A and a body of profile B. */
export interface InterAspect {
  planetA: string;
  planetB: string;
  type: string;
  /** |separation - exact_angle|, rounded to 2 decimals. */
  orb: number;
  /** Canonical aspect angle in degrees (0/60/90/120/180). */
  exact_angle: number;
}

/**
 * German sign name -> index 0..11, matching WESTERN_ZODIAC order in
 * src/utils/astrology.ts. Hardcoded here to keep this module pure-light (no
 * import of astrology.ts), but the order MUST stay in sync with that file.
 */
export const SIGN_INDEX_DE: Record<string, number> = {
  Widder: 0,
  Stier: 1,
  Zwillinge: 2,
  Krebs: 3,
  Löwe: 4,
  Jungfrau: 5,
  Waage: 6,
  Skorpion: 7,
  Schütze: 8,
  Steinbock: 9,
  Wassermann: 10,
  Fische: 11,
};

/**
 * The 10 classical bodies considered for inter-aspects. The ascendant is
 * handled separately (only when a real longitude is available), and other
 * points (Chiron, Lilith, Mondknoten, ...) are intentionally excluded.
 */
export const CLASSICAL_BODIES: string[] = [
  "Sonne",
  "Mond",
  "Merkur",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptun",
  "Pluto",
];

/** Aspect definitions: German name -> canonical angle. */
const ASPECTS: { type: string; angle: number }[] = [
  { type: "Konjunktion", angle: 0 },
  { type: "Sextil", angle: 60 },
  { type: "Quadrat", angle: 90 },
  { type: "Trigon", angle: 120 },
  { type: "Opposition", angle: 180 },
];

/** Luminaries grant the wider orb tolerance. */
const LUMINARIES = new Set(["Sonne", "Mond"]);

const LUMINARY_ORB = 8;
const DEFAULT_ORB = 6;

/** Shortest angular distance between two longitudes (0..180). */
function angularSeparation(lonA: number, lonB: number): number {
  const d = Math.abs(lonA - lonB) % 360;
  return Math.min(d, 360 - d);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build the list of classical body positions from a profile view-model.
 *
 * Reads vm.western.planets (keeping only CLASSICAL_BODIES whose sign is known)
 * and appends the Aszendent only when vm.western.ascendantLongitude is set.
 */
export function bodyPositionsFromViewModel(vm: ProfileViewModel): BodyPosition[] {
  const positions: BodyPosition[] = [];

  const planets = vm?.western?.planets;
  if (Array.isArray(planets)) {
    for (const planet of planets) {
      if (!planet || !CLASSICAL_BODIES.includes(planet.name)) continue;
      const signIndex = SIGN_INDEX_DE[planet.sign];
      if (signIndex === undefined) continue; // unknown / out-of-map sign
      if (!Number.isFinite(planet.degree)) continue; // no fabricated NaN longitude (D-001)
      positions.push({
        name: planet.name,
        longitude: signIndex * 30 + planet.degree,
      });
    }
  }

  const ascLon = vm?.western?.ascendantLongitude;
  if (ascLon != null) {
    positions.push({ name: "Aszendent", longitude: ascLon });
  }

  return positions;
}

/**
 * Compute all Western inter-aspects between two sets of body positions.
 *
 * For each A-body x B-body pair and each aspect type, emit an InterAspect when
 * |separation - exact_angle| is within tolerance (8° if either body is a
 * luminary, else 6°). Results are sorted ascending by orb. Invalid or empty
 * input yields [].
 */
export function computeInterAspects(
  a: BodyPosition[],
  b: BodyPosition[],
): InterAspect[] {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return [];
  }

  const results: InterAspect[] = [];

  for (const bodyA of a) {
    for (const bodyB of b) {
      const separation = angularSeparation(bodyA.longitude, bodyB.longitude);
      const tolerance =
        LUMINARIES.has(bodyA.name) || LUMINARIES.has(bodyB.name)
          ? LUMINARY_ORB
          : DEFAULT_ORB;

      for (const aspect of ASPECTS) {
        const delta = Math.abs(separation - aspect.angle);
        if (delta <= tolerance) {
          results.push({
            planetA: bodyA.name,
            planetB: bodyB.name,
            type: aspect.type,
            orb: round2(delta),
            exact_angle: aspect.angle,
          });
        }
      }
    }
  }

  results.sort((x, y) => x.orb - y.orb);
  return results;
}
