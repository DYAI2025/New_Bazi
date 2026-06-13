import { describe, it, expect } from "vitest";
import { derivePairTension, fuseElementalWeights, type ElementalWeight } from "./tensionPair";
import { ELEMENT_AXIS_MAP } from "./tensionNavigator";

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
});
