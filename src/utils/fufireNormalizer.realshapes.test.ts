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

  it("carries the ascendant ABSOLUTE longitude from angles.Ascendant (P7-T1)", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    // angles.Ascendant = 190.046° (Waage 10.0°) — the real absolute ecliptic longitude.
    expect(vm.western.ascendantLongitude).toBeCloseTo(190.046, 2);
  });

  it("returns ascendantLongitude null when no angles and no cusps (legacy, P7-T1)", () => {
    const raw: any = { western: { sunSign: "Widder", planets: [] } };
    const vm = normalizeFuFireProfile(raw, INPUT, "fufire-orchestrated");
    expect(vm.western.ascendantLongitude).toBeNull();
  });

  it("returns ascendantLongitude null when ascendant is provisional/unknown-time (P7-T1)", () => {
    const raw: any = {
      western: { angles: { Ascendant: 190.046 }, precision: { provisional_fields: ["ascendant"] }, planets: [] },
    };
    const vm = normalizeFuFireProfile(raw, INPUT, "fufire-orchestrated");
    expect(vm.western.ascendantLongitude).toBeNull();
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

  it("displays the CALIBRATED coherence (calibration.h_calibrated), not the flattering raw dot-product", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    // calibration.h_calibrated = 0.6144 -> 61.4% (NOT h_raw 0.908 -> 90.8%)
    expect(vm.fusion.coherenceIndex).toBeCloseTo(61.4, 1);
    expect(vm.fusion.coherenceCalibrated).toBe(true);
    expect(vm.fusion.source).toBe("fufire");
    // The engine's calibrated interpretation_band is surfaced, not a locally
    // invented label and not the raw-harmony flattery.
    expect(vm.fusion.coherenceRating).toBe("Überdurchschnittliche Kongruenz");
  });

  it("derives the signal level from the calibration z-score (h_raw vs baseline/sigma)", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    // z = (0.908 - 0.7614) / 0.1445 = 1.015 -> 1 <= |z| < 2 -> "spuerbar"
    expect(vm.fusion.signalLevel).toBe("spuerbar");
  });

  it("pins the >= bucket semantics of the signal level (z=0.99 / 1.0 / 2.0)", () => {
    // Exact binary fractions so the z-score boundaries are hit precisely:
    // baseline 0.25, sigma 0.25 -> z = (h_raw - 0.25) / 0.25.
    const vmFor = (hRaw: number) =>
      normalizeFuFireProfile(
        { fusion: { calibration: { h_raw: hRaw, h_baseline: 0.25, h_sigma: 0.25, h_calibrated: 0.5 } } },
        INPUT,
        "fufire-orchestrated"
      );
    // z = 0.99 < 1 -> leise
    expect(vmFor(0.4975).fusion.signalLevel).toBe("leise");
    // z = 1.0 -> the >= boundary flips to spuerbar
    expect(vmFor(0.5).fusion.signalLevel).toBe("spuerbar");
    // z = 2.0 -> the >= boundary flips to dominant
    expect(vmFor(0.75).fusion.signalLevel).toBe("dominant");
  });

  it("falls back to the RAW harmony only when calibration is absent — and flags it", () => {
    const { calibration, ...uncalibrated } = fusionFixture as any;
    const vm = normalizeFuFireProfile({ fusion: uncalibrated }, INPUT, "fufire-orchestrated");
    expect(vm.fusion.coherenceIndex).toBeCloseTo(90.8, 1);
    expect(vm.fusion.coherenceCalibrated).toBe(false);
    // Raw harmony_index.interpretation is the best remaining label.
    expect(vm.fusion.coherenceRating).toContain("Starke Resonanz");
    // No baseline/sigma and no h_calibrated -> no signal level claim.
    expect(vm.fusion.signalLevel).toBeNull();
  });

  it("maps elemental_comparison (per-element West-vs-BaZi weights) into the view model", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.fusion.elementalComparison).toHaveLength(5);
    const holz = vm.fusion.elementalComparison.find((c) => c.element === ElementType.WOOD)!;
    expect(holz.western).toBeCloseTo(0.61, 2);
    expect(holz.bazi).toBeCloseTo(0.388, 3);
    expect(holz.difference).toBeCloseTo(0.222, 3);
    const metall = vm.fusion.elementalComparison.find((c) => c.element === ElementType.METAL)!;
    expect(metall.difference).toBeCloseTo(-0.299, 3);
  });

  it("NEVER invents top signals: they derive from the largest elemental differences", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    // The old hardcoded reading every user saw is gone.
    const triggers = vm.fusion.topSignals.map((s) => s.trigger).join(" ");
    expect(triggers).not.toContain("Sonne-Tagesmeister Interferenz");
    // Top-2 |difference|: Metall (-0.299) and Holz (+0.222).
    expect(vm.fusion.topSignals).toHaveLength(2);
    expect(vm.fusion.topSignals[0].trigger).toContain("Metall");
    expect(vm.fusion.topSignals[1].trigger).toContain("Holz");
    expect(vm.fusion.topSignals[0].interpretation).toContain("BaZi-Struktur");
  });

  it("returns NO top signals when the response carries no elemental_comparison", () => {
    const { elemental_comparison, ...rest } = fusionFixture as any;
    const vm = normalizeFuFireProfile({ fusion: rest }, INPUT, "fufire-orchestrated");
    expect(vm.fusion.elementalComparison).toEqual([]);
    expect(vm.fusion.topSignals).toEqual([]);
  });

  it("surfaces the engine's REAL fusion_interpretation as integrationText", () => {
    const vm = normalizeFuFireProfile(prodOrchestratedRaw(), INPUT, "fufire-orchestrated");
    expect(vm.fusion.integrationText).toContain("Harmonie-Index: 90.80%");
    expect(vm.fusion.integrationText).toContain("Westliche Dominanz: Holz");
  });

  it("returns integrationText null when the engine sent no fusion_interpretation — NO invented fallback", () => {
    const { fusion_interpretation, ...rest } = fusionFixture as any;
    const vm = normalizeFuFireProfile({ fusion: rest }, INPUT, "fufire-orchestrated");
    // The "Fusions-Deutung der Engine" section must stay hidden instead of
    // labeling local copy as engine output.
    expect(vm.fusion.integrationText).toBeNull();
  });

  it("approximates the signal level from h_calibrated thirds when sigma is missing", () => {
    const { calibration, ...rest } = fusionFixture as any;
    const vm = normalizeFuFireProfile(
      { fusion: { ...rest, calibration: { h_calibrated: 0.6144, interpretation_band: "Überdurchschnittliche Kongruenz" } } },
      INPUT,
      "fufire-orchestrated"
    );
    // 0.33 <= 0.6144 < 0.66 -> "spuerbar" (documented coarse bucketing)
    expect(vm.fusion.signalLevel).toBe("spuerbar");
    expect(vm.fusion.coherenceIndex).toBeCloseTo(61.4, 1);
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

  it("FusionResponse alone (calibration block beats harmony_index/cosmic_state)", () => {
    const vm = normalizeFuFireProfile({ fusion: fusionFixture }, INPUT, "fufire-orchestrated");
    expect(vm.fusion.coherenceIndex).toBeCloseTo(61.4, 1);
    expect(vm.fusion.coherenceCalibrated).toBe(true);
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
    expect(vm.fusion.coherenceIndex).toBeNull();
  });

  it("liefert coherenceIndex null, wenn weder Kalibrierung noch Legacy-Wert existieren (B-002)", () => {
    const vm = normalizeFuFireProfile(
      { fusion: { calibration: { h_raw: 0.5, h_baseline: 0.25, h_sigma: 0.25 } } },
      INPUT, "fufire-orchestrated"
    );
    expect(vm.fusion.coherenceIndex).toBeNull();
    expect(vm.fusion.coherenceCalibrated).toBe(false);
    expect(vm.fusion.signalLevel).toBeNull();
    expect(vm.fusion.coherenceRating).toBe("Keine Kohärenz-Daten verfügbar");
  });

  it("lokaler Fallback erfindet keine 75 mehr (B-002)", async () => {
    const { getRawSimulatedProfileFromLocal } = await import("./fufireNormalizer");
    const raw = getRawSimulatedProfileFromLocal({ birthDate: "1990-06-15", birthTime: "14:30", name: "X" } as any);
    expect((raw.fusion as any)?.coherenceIndex).toBeUndefined();
    const vm = normalizeFuFireProfile(raw, INPUT, "fallback-local");
    expect(vm.fusion.coherenceIndex).toBeNull();
    expect(vm.fusion.coherenceCalibrated).toBe(false);
  });
});

describe("B-007 Pinning: Aszendent/Mond/Haus-Texte kreuzen sich nie", () => {
  const vm = () => normalizeFuFireProfile({ western: westernFixture }, INPUT, "fufire-orchestrated");

  it("Aszendent (→ Waage) und Mond (→ Fische) sind getrennt und korrekt", () => {
    const v = vm();
    expect(v.western.ascendant).toBe("Waage");
    expect(v.western.moonSign).toBe("Fische");
    expect(v.western.ascendant).not.toBe(v.western.moonSign);
  });

  it("der Mond steht per Server-Cusps in Haus 5 — NIE pauschal in Haus 1", () => {
    const moon = vm().western.planets.find((p) => p.name === "Mond")!;
    expect(moon.sign).toBe("Fische");
    expect(moon.house).toBe(5);
  });

  it("Haus-1-Text referenziert den Aszendenten und listet KEINEN Mond (Fixture: Haus 1 leer)", () => {
    const h1 = vm().western.houses.find((h) => h.number === 1)!;
    expect(h1.description).toContain("Aszendent");
    expect(h1.signResonance).toContain("Waage");
    expect(h1.signResonance).not.toContain("Fische");
    expect(h1.planets).toEqual([]);
  });

  it("Haus 5 listet den Mond mit Zeichen Fische — kein Kreuz-Label-Aszendent", () => {
    const v = vm();
    const h5 = v.western.houses.find((h) => h.number === 5)!;
    const moonEntry = h5.planets.find((p) => p.name === "Mond")!;
    expect(moonEntry).toBeDefined();
    expect(moonEntry.sign).toBe("Fische");
    expect(h5.description).toContain("Mond (Fische)");
    expect(h5.description).not.toContain("Aszendent");
    const asc = v.western.planets.find((p) => p.name === "Aszendent");
    if (asc) expect(asc.sign).toBe(v.western.ascendant);
  });
});

describe("A14 — DAY_MASTER_TEXTS element-spezifische Fallback-Texte", () => {
  const INPUT = {
    name: "Test", birthDate: "1990-01-01", birthTime: "12:00",
    birthPlace: "Berlin", birthPlaceLabel: "Berlin", placeId: "p1", gender: "Divers" as const
  };

  it("METAL-Tagesmeister (Xin) liefert Metall-Modell-Text (kein 'Ausgewogenheit')", () => {
    const fullRaw = {
      western: westernFixture, bazi: baziFixture, wuxing: wuxingFixture, fusion: fusionFixture
    };
    const vm = normalizeFuFireProfile(fullRaw, INPUT, "fufire-chart");
    expect(vm.bazi.dayMaster.element).toBe(ElementType.METAL);
    expect(vm.bazi.dayMaster.strengths).toContain("Im BaZi-Modell");
    expect(vm.bazi.dayMaster.strengths).not.toBe("Ausgewogenheit, Feinfühligkeit");
    expect(vm.bazi.dayMaster.strengths).toContain("Klarheit");
    expect(vm.bazi.dayMaster.shadow).toContain("Im BaZi-Modell");
    expect(vm.bazi.dayMaster.coreInterpretation).toContain("im BaZi-Modell");
  });

  it.each([
    ["Holz", ElementType.WOOD, "Wachstumsorientierung"],
    ["Feuer", ElementType.FIRE, "Ausdrucksstärke"],
    ["Erde", ElementType.EARTH, "Verlässlichkeit"],
    ["Metall", ElementType.METAL, "Klarheit"],
    ["Wasser", ElementType.WATER, "Anpassungsfähigkeit"],
  ])("Element %s → strengths enthält '%s'", (_label, element, keyword) => {
    const rawWithElement = { bazi: { dayMaster: element } };
    const vm = normalizeFuFireProfile(rawWithElement, INPUT, "fufire-chart");
    expect(vm.bazi.dayMaster.element).toBe(element);
    expect(vm.bazi.dayMaster.strengths).toContain(keyword);
    expect(vm.bazi.dayMaster.strengths).toContain("Im BaZi-Modell");
    expect(vm.bazi.dayMaster.shadow).toContain("Im BaZi-Modell");
    expect(vm.bazi.dayMaster.coreInterpretation).toContain("im BaZi-Modell");
  });

  it("Engine-Wert rawBazi.strengths hat Vorrang vor DAY_MASTER_TEXTS", () => {
    const rawWithCustom = { bazi: { dayMaster: ElementType.FIRE, strengths: "Direkter Engine-Wert" } };
    const vm = normalizeFuFireProfile(rawWithCustom, INPUT, "fufire-chart");
    expect(vm.bazi.dayMaster.strengths).toBe("Direkter Engine-Wert");
  });
});
