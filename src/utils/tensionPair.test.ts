import { describe, it, expect } from "vitest";
import { derivePairTension, fuseElementalWeights, derivePairAxes, type ElementalWeight } from "./tensionPair";
import { ELEMENT_AXIS_MAP } from "./tensionNavigator";
import type { ElementalComparisonEntry } from "../viewmodels/profileViewModel";

// Konstruierte Fixtures mit bekannter Top-Differenz:
// Metall: wA 0.50 − wB 0.10 = +0.40 (größte |Differenz|, Person-A-Überschuss → Gold)
// Wasser: wA 0.10 − wB 0.40 = −0.30 (zweitgrößte, Person-B-Überschuss → Blau)
// Holz:   wA 0.20 − wB 0.10 = +0.10 (drittgrößte)
const A: ElementalWeight[] = [
  { element: "Holz", weight: 0.2 },
  { element: "Feuer", weight: 0.15 },
  { element: "Erde", weight: 0.05 },
  { element: "Metall", weight: 0.5 },
  { element: "Wasser", weight: 0.1 },
];
const B: ElementalWeight[] = [
  { element: "Holz", weight: 0.1 },
  { element: "Feuer", weight: 0.2 },
  { element: "Erde", weight: 0.1 },
  { element: "Metall", weight: 0.1 },
  { element: "Wasser", weight: 0.4 },
];

describe("fuseElementalWeights", () => {
  it("mittelt West- und BaZi-Gewicht je Element zu EINEM Personengewicht", () => {
    const w = fuseElementalWeights([
      { element: "Metall", western: 0.6, bazi: 0.2, difference: 0.4 },
      { element: "Holz", western: 0.1, bazi: 0.3, difference: -0.2 },
    ]);
    expect(w).toEqual([
      { element: "Metall", weight: 0.4 },
      { element: "Holz", weight: 0.2 },
    ]);
  });

  it("ist degradationssicher: leere/fehlende comparison → leeres Array", () => {
    expect(fuseElementalWeights([])).toEqual([]);
  });
});

describe("derivePairTension", () => {
  it("wählt die Achse mit größter |wA − wB| als aktiv (Fixture: Metall → Struktur↔Fluss)", () => {
    const t = derivePairTension(A, B)!;
    expect(t.activeAxis.id).toBe("structure_flow");
    expect(t.activeAxis.difference).toBeCloseTo(0.4, 10);
  });

  it("Person-A-Überschuss → Gold (lean a), Person-B-Überschuss → Blau (lean b)", () => {
    const t = derivePairTension(A, B)!;
    expect(t.activeLean).toBe("a"); // Metall: A-Überschuss → Gold
    expect(t.axes.find((a) => a.id === "inner_outer")!.lean).toBe("b"); // Wasser: B-Überschuss → Blau
  });

  it("liefert genau 2 Nebenachsen nach |Differenz|-Rang (Wasser, dann Holz)", () => {
    const t = derivePairTension(A, B)!;
    expect(t.secondaries.map((s) => s.id)).toEqual(["inner_outer", "tradition_innovation"]);
  });

  it("nutzt das ELEMENT_AXIS_MAP (gleiche Pole wie der Natal-Navigator)", () => {
    const t = derivePairTension(A, B)!;
    expect(t.activeAxis.poleA).toBe(ELEMENT_AXIS_MAP["Metall"].poleA);
    expect(t.activeAxis.poleB).toBe(ELEMENT_AXIS_MAP["Metall"].poleB);
  });

  it("normiert Achsen-Stärken auf [0,1] relativ zur größten Differenz", () => {
    const t = derivePairTension(A, B)!;
    expect(t.axes.find((a) => a.id === "structure_flow")!.strength).toBeCloseTo(1, 5);
    expect(t.axes.find((a) => a.id === "inner_outer")!.strength).toBeCloseTo(0.3 / 0.4, 5);
  });

  it("MVP: Paar-Fragen existieren nur in Stufe spürbar → signalLevel ist 'spuerbar'", () => {
    expect(derivePairTension(A, B)!.signalLevel).toBe("spuerbar");
  });

  it("ist degradationssicher: leere Verteilungen → null", () => {
    expect(derivePairTension([], [])).toBeNull();
    expect(derivePairTension(A, [])).toBeNull();
  });

  it("degeneriert ehrlich: identische Verteilungen (keine Differenz) → null", () => {
    expect(derivePairTension(A, A)).toBeNull();
  });

  it("ignoriert nicht-finite B-Gewichte statt NaN-Differenzen zu erzeugen", () => {
    const badB: ElementalWeight[] = [
      { element: "Holz", weight: 0.1 },
      { element: "Feuer", weight: 0.2 },
      { element: "Erde", weight: 0.1 },
      { element: "Metall", weight: NaN },
      { element: "Wasser", weight: Infinity },
    ];
    const t = derivePairTension(A, badB);
    if (t) {
      for (const ax of t.axes) {
        expect(Number.isFinite(ax.difference)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// derivePairAxes (REQ-F-005): pro Achse die Lehne BEIDER Personen + harmonie/reibung
// ---------------------------------------------------------------------------

// Vollständige comparison-Listen (alle 5 Elemente). difference = western − bazi
// je Person. Ring-Reihenfolge nach angle: Metall 0, Wasser 72, Erde 144,
// Feuer 216, Holz 288.
const compFull = (diffs: Record<string, number>): ElementalComparisonEntry[] =>
  ["Holz", "Feuer", "Erde", "Metall", "Wasser"].map((element) => ({
    element,
    western: 0,
    bazi: 0,
    difference: diffs[element] ?? 0,
  }));

describe("derivePairAxes", () => {
  it("liefert genau 5 Achsen in Ring-Reihenfolge (nach angle)", () => {
    const a = compFull({ Metall: 0.4, Wasser: -0.3, Erde: 0.2, Feuer: -0.1, Holz: 0.5 });
    const b = compFull({ Metall: 0.4, Wasser: -0.3, Erde: 0.2, Feuer: -0.1, Holz: 0.5 });
    const axes = derivePairAxes(a, b);
    expect(axes.map((x) => x.id)).toEqual([
      "structure_flow",      // Metall, angle 0
      "inner_outer",         // Wasser, angle 72
      "security_freedom",    // Erde, angle 144
      "action_being",        // Feuer, angle 216
      "tradition_innovation" // Holz, angle 288
    ]);
  });

  it("beide lehnen denselben Pol (gleiches Vorzeichen) → harmonie", () => {
    const a = compFull({ Metall: 0.4, Wasser: 0, Erde: 0, Feuer: 0, Holz: 0 });
    const b = compFull({ Metall: 0.2, Wasser: 0, Erde: 0, Feuer: 0, Holz: 0 });
    const metall = derivePairAxes(a, b).find((x) => x.id === "structure_flow")!;
    expect(metall.leanA).toBe(ELEMENT_AXIS_MAP["Metall"].poleA);
    expect(metall.leanB).toBe(ELEMENT_AXIS_MAP["Metall"].poleA);
    expect(metall.mode).toBe("harmonie");
    expect(metall.magnitude).toBeCloseTo(0.6, 10);
  });

  it("strikt gegensätzliche Lehnen → reibung", () => {
    const a = compFull({ Metall: 0.4, Wasser: 0, Erde: 0, Feuer: 0, Holz: 0 });
    const b = compFull({ Metall: -0.3, Wasser: 0, Erde: 0, Feuer: 0, Holz: 0 });
    const metall = derivePairAxes(a, b).find((x) => x.id === "structure_flow")!;
    expect(metall.leanA).toBe(ELEMENT_AXIS_MAP["Metall"].poleA);
    expect(metall.leanB).toBe(ELEMENT_AXIS_MAP["Metall"].poleB);
    expect(metall.mode).toBe("reibung");
    expect(metall.magnitude).toBeCloseTo(0.7, 10);
  });

  it("eine Seite ausgeglichen (≈0) → harmonie, lean 'ausgeglichen'", () => {
    const a = compFull({ Metall: 0.4, Wasser: 0, Erde: 0, Feuer: 0, Holz: 0 });
    const b = compFull({ Metall: 0, Wasser: 0, Erde: 0, Feuer: 0, Holz: 0 });
    const metall = derivePairAxes(a, b).find((x) => x.id === "structure_flow")!;
    expect(metall.leanA).toBe(ELEMENT_AXIS_MAP["Metall"].poleA);
    expect(metall.leanB).toBe("ausgeglichen");
    expect(metall.mode).toBe("harmonie");
  });

  it("übernimmt id/element/poleA/poleB direkt aus dem ELEMENT_AXIS_MAP", () => {
    const a = compFull({ Metall: 0.4, Wasser: -0.3, Erde: 0.2, Feuer: -0.1, Holz: 0.5 });
    const b = compFull({ Metall: 0.4, Wasser: -0.3, Erde: 0.2, Feuer: -0.1, Holz: 0.5 });
    const wasser = derivePairAxes(a, b).find((x) => x.id === "inner_outer")!;
    expect(wasser.element).toBe("Wasser");
    expect(wasser.poleA).toBe(ELEMENT_AXIS_MAP["Wasser"].poleA);
    expect(wasser.poleB).toBe(ELEMENT_AXIS_MAP["Wasser"].poleB);
  });

  it("ist degradationssicher: leere/Nicht-Array Eingaben → []", () => {
    const full = compFull({ Metall: 0.4, Wasser: -0.3, Erde: 0.2, Feuer: -0.1, Holz: 0.5 });
    expect(derivePairAxes([], full)).toEqual([]);
    expect(derivePairAxes(full, [])).toEqual([]);
    // Laufzeit-Schutz gegen Nicht-Array (Eingaben aus untypisierten Quellen)
    expect(derivePairAxes(undefined as unknown as ElementalComparisonEntry[], full)).toEqual([]);
    expect(derivePairAxes(full, null as unknown as ElementalComparisonEntry[])).toEqual([]);
  });

  it("überspringt nur die Achse, deren Element auf einer Seite fehlt", () => {
    const a: ElementalComparisonEntry[] = [
      { element: "Metall", western: 0, bazi: 0, difference: 0.4 },
      { element: "Wasser", western: 0, bazi: 0, difference: -0.3 },
      { element: "Erde", western: 0, bazi: 0, difference: 0.2 },
      { element: "Feuer", western: 0, bazi: 0, difference: -0.1 },
      { element: "Holz", western: 0, bazi: 0, difference: 0.5 },
    ];
    // B fehlt das Wasser-Element → nur inner_outer wird ausgelassen.
    const b: ElementalComparisonEntry[] = [
      { element: "Metall", western: 0, bazi: 0, difference: 0.4 },
      { element: "Erde", western: 0, bazi: 0, difference: 0.2 },
      { element: "Feuer", western: 0, bazi: 0, difference: -0.1 },
      { element: "Holz", western: 0, bazi: 0, difference: 0.5 },
    ];
    const axes = derivePairAxes(a, b);
    expect(axes.map((x) => x.id)).toEqual([
      "structure_flow",
      "security_freedom",
      "action_being",
      "tradition_innovation",
    ]);
  });
});
