/**
 * Normalizer tests against the REAL FuFirE engine response shapes.
 *
 * Every fixture in src/__fixtures__/fufire/ is a verbatim live response
 * (Berlin 1990-06-15 14:30, captured via scripts/fufire-dump-fixtures.mts).
 * The expected values (Zwillinge/Fische/Waage, day master Xin, …) are
 * cross-checked against the engine's own bootstrap.profile summary:
 *   { sun_sign: "Zwillinge", moon_sign: "Fische", ascendant_sign: "Waage",
 *     day_master: "Xin", … }
 *
 * Prod regression covered here: POST /api/azodiac/profile 500
 * "rawPlanets.map is not a function" — WesternResponse.bodies is an OBJECT
 * (name → body), not an array.
 */
import { describe, it, expect } from "vitest";
import { normalizeFuFireProfile } from "./fufireNormalizer";
import { ElementType } from "../types";

import chartFixture from "../__fixtures__/fufire/chart.json";
import westernFixture from "../__fixtures__/fufire/western.json";
import baziFixture from "../__fixtures__/fufire/bazi.json";
import wuxingFixture from "../__fixtures__/fufire/wuxing.json";
import fusionFixture from "../__fixtures__/fufire/fusion.json";

const INPUT = {
  name: "Live Smoke",
  birthDate: "1990-06-15",
  birthTime: "14:30",
  birthPlaceLabel: "Berlin",
  gender: "Divers"
};

/**
 * Exactly what buildProfile() hands to the normalizer in prod: the /chart
 * response spread (carries chart-shaped bazi + wuxing), plus the orchestrated
 * /v1/calculate/western and /v1/calculate/fusion responses (chart has no
 * `western`/`fusion` keys).
 */
function prodOrchestratedRaw(): any {
  return { ...chartFixture, western: westernFixture, fusion: fusionFixture };
}

describe("normalizer vs REAL orchestrated prod raw (chart + western + fusion)", () => {
  it("does not throw and never returns an empty planets list", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.western.planets.length).toBeGreaterThanOrEqual(10);
  });

  it("derives the western triad matching the engine's own bootstrap summary", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.western.sunSign).toBe("Zwillinge");
    expect(vm.western.moonSign).toBe("Fische");
    expect(vm.western.ascendant).toBe("Waage");
  });

  it("maps the bodies OBJECT to German planet entries with sign/degree/house", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    const sun = vm.western.planets.find((p) => p.name === "Sonne");
    expect(sun).toBeDefined();
    expect(sun!.sign).toBe("Zwillinge");
    expect(sun!.degree).toBeCloseTo(24.1, 1);
    expect(sun!.element).toBe("Luft");
    expect(sun!.retrograde).toBe(false);
    // Sun longitude 84.15 lies between cusp 9 (66.11) and cusp 10 (103.29).
    expect(sun!.house).toBe(9);
    const uranus = vm.western.planets.find((p) => p.name === "Uranus");
    expect(uranus!.retrograde).toBe(true);
  });

  it("maps the houses cusp OBJECT (\"1\"..\"12\" -> longitude) to 12 house meanings", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.western.houses).toHaveLength(12);
    // Cusp 1 = 190.046° -> Waage 10.0°
    expect(vm.western.houses[0].signResonance).toContain("Waage");
    expect(vm.western.houses[0].signResonance).toContain("10.0");
    // Sun (house 9) must be listed in the 9th house.
    const ninth = vm.western.houses.find((h) => h.number === 9)!;
    expect(ninth.planets.map((p) => p.name)).toContain("Sonne");
  });

  it("translates real AspectResponse entries and derives harmony from type", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.western.aspects.length).toBeGreaterThan(0);
    const trine = vm.western.aspects.find((a) => a.type === "Trigon");
    expect(trine).toBeDefined();
    expect(trine!.harmony).toBe("harmonisch");
    expect(trine!.planet1).toBe("Mond");
    expect(trine!.planet2).toBe("Pluto");
    const quincunx = vm.western.aspects.find((a) => a.type === "Quincunx");
    expect(quincunx!.harmony).toBe("spannend");
  });

  it("resolves chart-shaped bazi pillars (stem/branch names + indexes)", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.bazi.available).toBe(true);
    const day = vm.bazi.pillars.find((p) => p.pillarKey === "Tag")!;
    expect(day.stemPinyin).toBe("Xīn");
    expect(day.stemChinese).toBe("辛");
    expect(day.stemElement).toBe(ElementType.METAL);
    expect(day.stemPolarity).toBe("Yin");
    expect(day.branchAnimal).toBe("Schwein");
    expect(day.branchElement).toBe(ElementType.WATER);
    expect(day.hiddenStems.length).toBeGreaterThan(0);
    const year = vm.bazi.pillars.find((p) => p.pillarKey === "Jahr")!;
    expect(year.stemPinyin).toBe("Gēng");
    expect(year.branchAnimal).toBe("Pferd");
  });

  it("resolves the day master from the stem name (Xin -> Metall Yin), not as an element string", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.bazi.dayMaster.element).toBe(ElementType.METAL);
    expect(vm.bazi.dayMaster.polarity).toBe("Yin");
    expect(vm.bazi.dayMaster.chinese).toBe("辛");
  });

  it("normalizes the chart WuXingSection (from_planets weights) to percentages", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.wuxing.available).toBe(true);
    const sum = Object.values(vm.wuxing.distribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 0);
    // from_planets: Holz 4.6 / 15.5 -> ~29.7%
    expect(vm.wuxing.distribution[ElementType.WOOD]).toBeCloseTo(29.7, 0);
    expect(vm.wuxing.elementCards).toHaveLength(5);
  });

  it("maps the real FusionResponse (cosmic_state 0..1) to a 0..100 coherence index", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.fusion.coherenceIndex).toBeCloseTo(90.8, 1);
    expect(vm.fusion.source).toBe("fufire");
    // Engine's own interpretation is surfaced, not a locally invented label.
    expect(vm.fusion.coherenceRating).toContain("Starke Resonanz");
  });
});

describe("normalizer vs REAL detail-endpoint shapes (one section each)", () => {
  it("WesternResponse alone (bodies object, angles, cusp houses)", () => {
    const vm = normalizeFuFireProfile({ western: westernFixture }, INPUT, "fufire-orchestrated");
    expect(vm.western.sunSign).toBe("Zwillinge");
    expect(vm.western.moonSign).toBe("Fische");
    expect(vm.western.ascendant).toBe("Waage");
    expect(vm.western.planets.length).toBeGreaterThanOrEqual(10);
  });

  it("BaziResponse alone (German pillar keys stamm/zweig/tier + chinese.day_master)", () => {
    const vm = normalizeFuFireProfile({ bazi: baziFixture }, INPUT, "fufire-orchestrated");
    expect(vm.bazi.available).toBe(true);
    const day = vm.bazi.pillars.find((p) => p.pillarKey === "Tag")!;
    expect(day.stemPinyin).toBe("Xīn");
    expect(day.stemChinese).toBe("辛");
    expect(day.stemElement).toBe(ElementType.METAL);
    expect(day.branchAnimal).toBe("Schwein");
    const hour = vm.bazi.pillars.find((p) => p.pillarKey === "Stunde")!;
    expect(hour.stemPinyin).toBe("Yǐ");
    expect(hour.branchAnimal).toBe("Ziege");
    expect(vm.bazi.dayMaster.element).toBe(ElementType.METAL);
  });

  it("WxResponse alone (wu_xing_vector 0..1 weights -> percentage shares)", () => {
    const vm = normalizeFuFireProfile({ wuxing: wuxingFixture }, INPUT, "fufire-orchestrated");
    expect(vm.wuxing.available).toBe(true);
    const sum = Object.values(vm.wuxing.distribution).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 0);
    expect(vm.wuxing.distribution[ElementType.WOOD]).toBeCloseTo(29.7, 0);
    expect(vm.wuxing.distribution[ElementType.METAL]).toBeCloseTo(6.5, 0);
  });

  it("FusionResponse alone (harmony_index object + cosmic_state)", () => {
    const vm = normalizeFuFireProfile({ fusion: fusionFixture }, INPUT, "fufire-orchestrated");
    expect(vm.fusion.coherenceIndex).toBeCloseTo(90.8, 1);
    expect(vm.fusion.source).toBe("fufire");
  });
});

describe("normalizer degrades per-section instead of throwing", () => {
  it("tolerates a completely empty raw object", () => {
    const vm = normalizeFuFireProfile({}, INPUT, "fufire-chart");
    expect(vm.western.planets).toEqual([]);
    expect(vm.bazi.available).toBe(false);
    expect(vm.wuxing.available).toBe(false);
    expect(vm.warnings.length).toBeGreaterThan(0);
  });

  it("tolerates junk section payloads (wrong primitive types)", () => {
    const vm = normalizeFuFireProfile(
      { western: { bodies: 42, houses: "x", aspects: null }, bazi: { pillars: 7 }, wuxing: { wu_xing_vector: null }, fusion: { harmony_index: "n/a" } },
      INPUT,
      "fufire-orchestrated"
    );
    expect(vm.western.planets).toEqual([]);
    expect(vm.fusion.coherenceIndex).toBe(0);
  });
});
