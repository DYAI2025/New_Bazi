import { describe, it, expect } from "vitest";
import { normalizeFuFireProfile } from "./fufireNormalizer";
import { ElementType } from "../types";
import unknownBazi from "../__fixtures__/fufire/unknown-time/bazi.json";
import unknownWestern from "../__fixtures__/fufire/unknown-time/western.json";
import unknownFusion from "../__fixtures__/fufire/unknown-time/fusion.json";

const INPUT = { name: "Hannah Arendt", birthDate: "1906-10-14", birthTime: "21:15", birthPlaceLabel: "Linden", gender: "Weiblich" };

const FULL = {
  western: { sunSign: "Waage", moonSign: "Stier", ascendant: "Krebs", planets: [], aspects: [], houses: [] },
  bazi: { dayMaster: ElementType.WOOD, dayMasterName: "Jiǎ", pillars: { Tag: { stem: { name: "Jiǎ", chinese: "甲", element: ElementType.WOOD, yinYang: "Yang" }, branch: { name: "Zǐ", chinese: "子", element: ElementType.WATER, animal: "Ratte", hiddenStems: [], yinYang: "Yang" } } } },
  wuxing: { wu_xing_vector: { [ElementType.WOOD]: 30, [ElementType.FIRE]: 10, [ElementType.EARTH]: 20, [ElementType.METAL]: 10, [ElementType.WATER]: 30 } },
  fusion: { coherenceIndex: 82 }
};

function provFor(vm: any, field: string) {
  return vm.provenance.find((p: any) => p.uiField.includes(field));
}

describe("normalizeFuFireProfile — legacy planet degree normalization", () => {
  it("normalizes negative legacy longitudes into a [0,30) sign degree", () => {
    const raw = {
      ...FULL,
      western: { sunSign: "Waage", moonSign: "Stier", ascendant: "Krebs", aspects: [], houses: [],
        planets: [{ name: "Sonne", longitude: -10 }] }
    };
    const vm = normalizeFuFireProfile(raw, INPUT, "fallback-local");
    const sun = vm.western.planets.find((p: any) => p.name === "Sonne");
    expect(sun).toBeDefined();
    // -10° longitude == 350° == 20° within its sign; must NOT be the pre-fix -10.
    expect(sun!.degree).toBeGreaterThanOrEqual(0);
    expect(sun!.degree).toBeLessThan(30);
    expect(sun!.degree).toBeCloseTo(20, 6);
  });
});

describe("normalizeFuFireProfile honesty for missing sections (real FuFirE source)", () => {
  it("marks every section available on a complete chart", () => {
    const vm = normalizeFuFireProfile(FULL, INPUT, "fufire-chart");
    expect(vm.source).toBe("fufire-chart");
    expect(vm.bazi.available).toBe(true);
    expect(vm.wuxing.available).toBe(true);
    expect(vm.fusion.source).toBe("fufire");
    expect(vm.wuxing.distribution[ElementType.WOOD]).toBe(30);
  });

  it("does NOT fabricate an even Wu-Xing distribution when wuxing is missing", () => {
    const { wuxing, ...rest } = FULL;
    const vm = normalizeFuFireProfile(rest, INPUT, "fufire-chart");
    expect(vm.wuxing.available).toBe(false);
    // No fabricated 20%-each product values.
    const values = Object.values(vm.wuxing.distribution);
    expect(values.every((v) => v === 0)).toBe(true);
    expect(vm.wuxing.elementCards).toHaveLength(0);
    expect(provFor(vm, "Wu Xing").status).toBe("missing");
  });

  it("treats present-but-empty Wu-Xing payload as unavailable instead of five fake 0% bars", () => {
    const vm = normalizeFuFireProfile({ ...FULL, wuxing: {} }, INPUT, "fufire-chart");
    expect(vm.wuxing.available).toBe(false);
    expect(Object.values(vm.wuxing.distribution).every((v) => v === 0)).toBe(true);
    expect(vm.wuxing.elementCards).toHaveLength(0);
    expect(vm.wuxing.vectorExplanation).toContain("ohne nutzbaren Elementvektor");
    expect(vm.warnings).toContain("Wu-Xing-Daten wurden ohne nutzbaren Elementvektor geliefert.");
  });

  it("does NOT fabricate a coherence index when fusion is missing", () => {
    const { fusion, ...rest } = FULL;
    const vm = normalizeFuFireProfile(rest, INPUT, "fufire-chart");
    expect(vm.fusion.source).toBe("missing");
    expect(vm.fusion.coherenceIndex).toBeNull();
  });

  it("marks bazi unavailable when bazi is missing", () => {
    const { bazi, ...rest } = FULL;
    const vm = normalizeFuFireProfile(rest, INPUT, "fufire-chart");
    expect(vm.bazi.available).toBe(false);
    expect(provFor(vm, "BaZi").status).toBe("missing");
  });

  it("treats local fallback as available and labelled fallback-local", () => {
    const { wuxing, ...rest } = FULL;
    const vm = normalizeFuFireProfile({ ...rest, wuxing }, INPUT, "fallback-local");
    expect(vm.source).toBe("fallback-local");
    expect(vm.wuxing.available).toBe(true);
    expect(provFor(vm, "Wu Xing").source).toBe("fallback-local");
  });

  it("exposes timeKnown:true from input when not set (default)", () => {
    const vm = normalizeFuFireProfile(FULL, INPUT, "fufire-chart");
    expect(vm.timeKnown).toBe(true);
  });
});

// REQ-P4-004: response-driven degradation using real unknown-time fixtures
describe("normalizeFuFireProfile — unknown birth time degradation (REQ-P4-004)", () => {
  const UNKNOWN_INPUT = {
    name: "Test Person",
    birthDate: "1990-06-15",
    birthTime: "12:00",
    birthPlaceLabel: "Berlin",
    gender: "Divers",
    timeKnown: false
  };

  const UNKNOWN_RAW = {
    bazi: unknownBazi,
    western: unknownWestern,
    fusion: unknownFusion,
    wuxing: {}
  };

  // F-01: Ascendant MUST be null — engine returns angles.Ascendant=163.89 but provisional_fields includes "ascendant"
  it("[F-01] western.ascendant === null when provisional_fields includes ascendant (short-circuits angles.Ascendant)", () => {
    const vm = normalizeFuFireProfile(UNKNOWN_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(unknownWestern.angles?.Ascendant).toBeGreaterThan(0); // fixture has non-null angles.Ascendant
    expect(vm.western.ascendant).toBeNull(); // normalizer MUST not use angles.Ascendant
  });

  // F-02: Hour pillar MUST be null — engine returns pillars.hour populated but provisional_fields includes "hour"
  it("[F-02] bazi.hourAvailable === false when provisional_fields includes hour", () => {
    const vm = normalizeFuFireProfile(UNKNOWN_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(unknownBazi.pillars?.hour).toBeTruthy(); // fixture has non-null hour pillar
    expect(vm.bazi.hourAvailable).toBe(false); // normalizer MUST mark it unavailable
  });

  // Houses must be empty when provisional_fields includes "houses"
  it("western.housesAvailable === false when provisional_fields includes houses", () => {
    const vm = normalizeFuFireProfile(UNKNOWN_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.western.housesAvailable).toBe(false);
    expect(vm.western.houses).toHaveLength(0);
  });

  // F-06: westernContributors must NOT include "Aszendent in ..." when ascendant is provisional
  it("[F-06] westernContributors excludes Aszendent when ascendant is provisional", () => {
    const vm = normalizeFuFireProfile(UNKNOWN_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    const hasAsc = vm.fusion.westernContributors.some((c) => c.toLowerCase().includes("aszendent in"));
    expect(hasAsc).toBe(false);
  });

  // timeKnown propagated from input to ViewModel
  it("vm.timeKnown is false when input.timeKnown is false", () => {
    const vm = normalizeFuFireProfile(UNKNOWN_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.timeKnown).toBe(false);
  });

  // Fusion signalLevelSuffix set when hour/signature provisional
  it("fusion.signalLevelSuffix is set when provisional_fields includes hour", () => {
    const vm = normalizeFuFireProfile(UNKNOWN_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.fusion.signalLevelSuffix).not.toBeNull();
    expect(typeof vm.fusion.signalLevelSuffix).toBe("string");
  });

});

// BIRTH-TIME-01: timeKnown:false MUST suppress time-dependent fields even when the
// engine response omits precision.provisional_fields (version skew, a fallback-local
// path, or an endpoint that ignores birth_time_known). The honesty guarantee must be a
// LOCAL invariant, not trust in the engine self-reporting. Each assertion below fails
// against the pre-fix code (which read provisional_fields only).
describe("normalizeFuFireProfile — timeKnown:false is a local honesty backstop (BIRTH-TIME-01)", () => {
  const UNKNOWN_INPUT = {
    name: "Test Person",
    birthDate: "1990-06-15",
    birthTime: "12:00",
    birthPlaceLabel: "Berlin",
    gender: "Divers",
    timeKnown: false
  };

  // Same engine payload as the provisional fixtures, but with precision stripped — i.e.
  // the engine sent a 12:00-computed ascendant/houses/hour pillar WITHOUT flagging them.
  const stripPrecision = (o: any) => {
    const clone = JSON.parse(JSON.stringify(o));
    if (clone && typeof clone === "object") delete clone.precision;
    return clone;
  };
  const NO_PROVISIONAL_RAW = {
    bazi: stripPrecision(unknownBazi),
    western: stripPrecision(unknownWestern),
    fusion: stripPrecision(unknownFusion),
    wuxing: {}
  };

  it("guards the test premise: precision stripped, but engine still sent a 12:00 ascendant + hour pillar", () => {
    expect((NO_PROVISIONAL_RAW.western as any).precision).toBeUndefined();
    expect((NO_PROVISIONAL_RAW.bazi as any).precision).toBeUndefined();
    expect(unknownWestern.angles?.Ascendant).toBeGreaterThan(0);
    expect(unknownBazi.pillars?.hour).toBeTruthy();
  });

  it("ascendant === null even without engine provisional_fields", () => {
    const vm = normalizeFuFireProfile(NO_PROVISIONAL_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.western.ascendant).toBeNull();
  });

  it("housesAvailable === false and houses empty even without engine provisional_fields", () => {
    const vm = normalizeFuFireProfile(NO_PROVISIONAL_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.western.housesAvailable).toBe(false);
    expect(vm.western.houses).toHaveLength(0);
  });

  it("hourAvailable === false even without engine provisional_fields", () => {
    const vm = normalizeFuFireProfile(NO_PROVISIONAL_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.bazi.hourAvailable).toBe(false);
  });

  it("fusion.signalLevelSuffix carries the '(ohne Stundensäule)' caveat even without engine provisional_fields", () => {
    const vm = normalizeFuFireProfile(NO_PROVISIONAL_RAW, UNKNOWN_INPUT, "fufire-orchestrated");
    expect(vm.fusion.signalLevelSuffix).not.toBeNull();
  });

  it("a KNOWN birth time still trusts the engine (no over-suppression)", () => {
    const vm = normalizeFuFireProfile(FULL, INPUT, "fufire-chart");
    expect(vm.western.ascendant).not.toBeNull();
    expect(vm.bazi.hourAvailable).toBe(true);
  });
});
