import { describe, it, expect } from "vitest";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";
import {
  SIGN_INDEX_DE,
  CLASSICAL_BODIES,
  bodyPositionsFromViewModel,
  computeInterAspects,
  type BodyPosition,
  type InterAspect,
} from "./interAspects";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Build a single body position. */
function body(name: string, longitude: number): BodyPosition {
  return { name, longitude };
}

/**
 * Minimal vm-like object that satisfies the slices bodyPositionsFromViewModel
 * actually reads (western.planets + western.ascendantLongitude). Cast through
 * unknown so we don't have to fabricate the whole ProfileViewModel surface.
 */
function makeVm(opts: {
  planets: { name: string; sign: string; degree: number }[];
  ascendantLongitude?: number | null;
}): ProfileViewModel {
  return {
    western: {
      planets: opts.planets.map((p) => ({
        name: p.name,
        symbol: "",
        sign: p.sign,
        house: 1,
        degree: p.degree,
        element: "Feuer",
        retrograde: false,
      })),
      ascendantLongitude:
        opts.ascendantLongitude === undefined ? null : opts.ascendantLongitude,
    },
  } as unknown as ProfileViewModel;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

describe("SIGN_INDEX_DE", () => {
  it("maps the 12 German signs in WESTERN_ZODIAC order (0..11)", () => {
    expect(SIGN_INDEX_DE["Widder"]).toBe(0);
    expect(SIGN_INDEX_DE["Stier"]).toBe(1);
    expect(SIGN_INDEX_DE["Zwillinge"]).toBe(2);
    expect(SIGN_INDEX_DE["Krebs"]).toBe(3);
    expect(SIGN_INDEX_DE["Löwe"]).toBe(4);
    expect(SIGN_INDEX_DE["Jungfrau"]).toBe(5);
    expect(SIGN_INDEX_DE["Waage"]).toBe(6);
    expect(SIGN_INDEX_DE["Skorpion"]).toBe(7);
    expect(SIGN_INDEX_DE["Schütze"]).toBe(8);
    expect(SIGN_INDEX_DE["Steinbock"]).toBe(9);
    expect(SIGN_INDEX_DE["Wassermann"]).toBe(10);
    expect(SIGN_INDEX_DE["Fische"]).toBe(11);
    expect(Object.keys(SIGN_INDEX_DE)).toHaveLength(12);
  });
});

describe("CLASSICAL_BODIES", () => {
  it("is the 10 classical bodies in order, excluding Aszendent", () => {
    expect(CLASSICAL_BODIES).toEqual([
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
    ]);
    expect(CLASSICAL_BODIES).not.toContain("Aszendent");
  });
});

// -----------------------------------------------------------------------------
// computeInterAspects
// -----------------------------------------------------------------------------

describe("computeInterAspects", () => {
  it("detects an exact Trigon (120° separation -> orb 0)", () => {
    const a = [body("Sonne", 0)];
    const b = [body("Mars", 120)];
    const res = computeInterAspects(a, b);
    const trigon = res.find((r) => r.type === "Trigon");
    expect(trigon).toBeDefined();
    expect(trigon!.planetA).toBe("Sonne");
    expect(trigon!.planetB).toBe("Mars");
    expect(trigon!.exact_angle).toBe(120);
    expect(trigon!.orb).toBe(0);
  });

  it("detects all 5 aspect types at exact angle with orb 0", () => {
    const expected: { type: string; angle: number }[] = [
      { type: "Konjunktion", angle: 0 },
      { type: "Sextil", angle: 60 },
      { type: "Quadrat", angle: 90 },
      { type: "Trigon", angle: 120 },
      { type: "Opposition", angle: 180 },
    ];
    for (const { type, angle } of expected) {
      // use Mars/Saturn (non-luminary) so tolerance is the tighter 6° band,
      // but exact angle is well within it for every type.
      const res = computeInterAspects([body("Mars", 10)], [body("Saturn", (10 + angle) % 360)]);
      const hit = res.find((r) => r.type === type);
      expect(hit, `aspect ${type} should be detected`).toBeDefined();
      expect(hit!.exact_angle).toBe(angle);
      expect(hit!.orb).toBe(0);
    }
  });

  it("detects Konjunktion at the 0° boundary (same longitude)", () => {
    const res = computeInterAspects([body("Venus", 200)], [body("Merkur", 200)]);
    const konj = res.find((r) => r.type === "Konjunktion");
    expect(konj).toBeDefined();
    expect(konj!.exact_angle).toBe(0);
    expect(konj!.orb).toBe(0);
  });

  it("luminary tolerance (8°) admits a 7° Sonne aspect", () => {
    // Sonne at 0, other at 127 -> separation 127, |127-120| = 7 <= 8 (luminary)
    const res = computeInterAspects([body("Sonne", 0)], [body("Jupiter", 127)]);
    const trigon = res.find((r) => r.type === "Trigon");
    expect(trigon).toBeDefined();
    expect(trigon!.orb).toBe(7);
  });

  it("non-luminary tolerance (6°) rejects a 7° Mars-Saturn aspect", () => {
    // Mars at 0, Saturn at 127 -> |127-120| = 7 > 6 (no luminary) -> rejected
    const res = computeInterAspects([body("Mars", 0)], [body("Saturn", 127)]);
    const trigon = res.find((r) => r.type === "Trigon");
    expect(trigon).toBeUndefined();
  });

  it("luminary tolerance applies if EITHER body is Sonne or Mond", () => {
    // Mond as the second body still grants the 8° band.
    const res = computeInterAspects([body("Saturn", 0)], [body("Mond", 127)]);
    const trigon = res.find((r) => r.type === "Trigon");
    expect(trigon).toBeDefined();
    expect(trigon!.orb).toBe(7);
  });

  it("computes orb as |separation - exact_angle| rounded to 2 decimals", () => {
    // separation 121.337 -> |121.337-120| = 1.337 -> 1.34
    const res = computeInterAspects([body("Sonne", 0)], [body("Mars", 121.337)]);
    const trigon = res.find((r) => r.type === "Trigon");
    expect(trigon).toBeDefined();
    expect(trigon!.orb).toBe(1.34);
  });

  it("uses the shortest angular separation (wrap-around past 180°)", () => {
    // lonA=350, lonB=10 -> raw diff 340, separation = 20 -> Sextil (60) no,
    // pick lonA=350, lonB=110 -> raw 240 -> separation 120 -> Trigon orb 0
    const res = computeInterAspects([body("Sonne", 350)], [body("Mars", 110)]);
    const trigon = res.find((r) => r.type === "Trigon");
    expect(trigon).toBeDefined();
    expect(trigon!.orb).toBe(0);
  });

  it("sorts results ascending by orb", () => {
    // Sonne(0) vs Mars(122): Trigon orb 2
    // Mond(0) vs Mars: dummy not used; build distinct orbs
    const a = [body("Sonne", 0), body("Mond", 0)];
    const b = [body("Mars", 123), body("Venus", 121)];
    const res = computeInterAspects(a, b);
    const orbs = res.map((r) => r.orb);
    const sorted = [...orbs].sort((x, y) => x - y);
    expect(orbs).toEqual(sorted);
    expect(res.length).toBeGreaterThan(1);
  });

  it("emits one InterAspect per matching A-body x B-body x aspect-type", () => {
    // Sonne(0) and Mond(60) on side A; Mars(120) on side B.
    // Sonne-Mars: separation 120 -> Trigon
    // Mond-Mars: separation 60 -> Sextil
    const a = [body("Sonne", 0), body("Mond", 60)];
    const b = [body("Mars", 120)];
    const res = computeInterAspects(a, b);
    const pairs = res.map((r) => `${r.planetA}-${r.planetB}-${r.type}`);
    expect(pairs).toContain("Sonne-Mars-Trigon");
    expect(pairs).toContain("Mond-Mars-Sextil");
  });

  it("returns [] for invalid input (non-arrays / empty)", () => {
    expect(computeInterAspects([], [])).toEqual([]);
    expect(computeInterAspects([body("Sonne", 0)], [])).toEqual([]);
    expect(computeInterAspects([], [body("Mars", 120)])).toEqual([]);
    // Intentionally invalid runtime args (cast to bypass the static signature).
    const bad = (x: unknown, y: unknown): InterAspect[] =>
      computeInterAspects(x as BodyPosition[], y as BodyPosition[]);
    expect(bad(null, [body("Mars", 120)])).toEqual([]);
    expect(bad(undefined, undefined)).toEqual([]);
    expect(bad("nope", 42)).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// bodyPositionsFromViewModel
// -----------------------------------------------------------------------------

describe("bodyPositionsFromViewModel", () => {
  it("extracts longitudes from German sign + degree-in-sign", () => {
    const vm = makeVm({
      planets: [
        { name: "Sonne", sign: "Widder", degree: 10 }, // 0*30 + 10 = 10
        { name: "Mars", sign: "Löwe", degree: 5 }, // 4*30 + 5 = 125
        { name: "Pluto", sign: "Fische", degree: 0 }, // 11*30 + 0 = 330
      ],
    });
    const res = bodyPositionsFromViewModel(vm);
    const byName = Object.fromEntries(res.map((p) => [p.name, p.longitude]));
    expect(byName["Sonne"]).toBe(10);
    expect(byName["Mars"]).toBe(125);
    expect(byName["Pluto"]).toBe(330);
  });

  it("filters out non-classical bodies (Chiron / Lilith / Mondknoten etc.)", () => {
    const vm = makeVm({
      planets: [
        { name: "Sonne", sign: "Widder", degree: 0 },
        { name: "Chiron", sign: "Stier", degree: 0 },
        { name: "Lilith", sign: "Zwillinge", degree: 0 },
        { name: "Wahrer Mondknoten", sign: "Krebs", degree: 0 },
      ],
    });
    const res = bodyPositionsFromViewModel(vm);
    const names = res.map((p) => p.name);
    expect(names).toContain("Sonne");
    expect(names).not.toContain("Chiron");
    expect(names).not.toContain("Lilith");
    expect(names).not.toContain("Wahrer Mondknoten");
  });

  it("skips planets whose sign is unknown / not in the map", () => {
    const vm = makeVm({
      planets: [
        { name: "Sonne", sign: "Widder", degree: 0 },
        { name: "Mars", sign: "Unbekannt", degree: 0 },
      ],
    });
    const res = bodyPositionsFromViewModel(vm);
    const names = res.map((p) => p.name);
    expect(names).toContain("Sonne");
    expect(names).not.toContain("Mars");
  });

  it("includes Aszendent ONLY when ascendantLongitude is set", () => {
    const withAsc = makeVm({
      planets: [{ name: "Sonne", sign: "Widder", degree: 0 }],
      ascendantLongitude: 200,
    });
    const resWith = bodyPositionsFromViewModel(withAsc);
    const asc = resWith.find((p) => p.name === "Aszendent");
    expect(asc).toBeDefined();
    expect(asc!.longitude).toBe(200);

    const withoutAsc = makeVm({
      planets: [{ name: "Sonne", sign: "Widder", degree: 0 }],
      ascendantLongitude: null,
    });
    const resWithout = bodyPositionsFromViewModel(withoutAsc);
    expect(resWithout.find((p) => p.name === "Aszendent")).toBeUndefined();
  });

  it("produces positions usable by computeInterAspects end-to-end", () => {
    const vmA = makeVm({ planets: [{ name: "Sonne", sign: "Widder", degree: 0 }] }); // lon 0
    const vmB = makeVm({ planets: [{ name: "Mars", sign: "Löwe", degree: 0 }] }); // lon 120
    const res: InterAspect[] = computeInterAspects(
      bodyPositionsFromViewModel(vmA),
      bodyPositionsFromViewModel(vmB),
    );
    expect(res.some((r) => r.type === "Trigon" && r.orb === 0)).toBe(true);
  });
});
