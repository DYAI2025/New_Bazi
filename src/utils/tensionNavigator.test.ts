import { describe, it, expect } from "vitest";
import { deriveTension, ELEMENT_AXIS_MAP } from "./tensionNavigator";

// Minimal-Inputs in VM-Form (FusionData.elementalComparison + signalLevel)
const comparison = [
  { element: "Holz",   western: 0.355, bazi: 0.133, difference: 0.222 },
  { element: "Feuer",  western: 0.21,  bazi: 0.15,  difference: 0.06 },
  { element: "Erde",   western: 0.14,  bazi: 0.18,  difference: -0.04 },
  { element: "Metall", western: 0.131, bazi: 0.43,  difference: -0.299 },
  { element: "Wasser", western: 0.164, bazi: 0.107, difference: 0.057 },
];

describe("ELEMENT_AXIS_MAP", () => {
  it("bildet alle 5 Elemente auf die 5 Konzept-Pole ab", () => {
    expect(ELEMENT_AXIS_MAP["Metall"].id).toBe("structure_flow");
    expect(ELEMENT_AXIS_MAP["Wasser"].id).toBe("inner_outer");
    expect(ELEMENT_AXIS_MAP["Erde"].id).toBe("security_freedom");
    expect(ELEMENT_AXIS_MAP["Feuer"].id).toBe("action_being");
    expect(ELEMENT_AXIS_MAP["Holz"].id).toBe("tradition_innovation");
  });
});

describe("deriveTension", () => {
  it("wählt die Achse mit größter |Differenz| als aktiv (Fixture: Metall → Struktur↔Fluss)", () => {
    const t = deriveTension(comparison, "spuerbar")!;
    expect(t.activeAxis.id).toBe("structure_flow");
    expect(t.signalLevel).toBe("spuerbar");
  });

  it("Polneigung: negative Differenz (BaZi-Überschuss) → Blau-Pol (poleB), positive → Gold-Pol (poleA)", () => {
    const t = deriveTension(comparison, "spuerbar")!;
    expect(t.activeLean).toBe("b"); // Metall-Differenz negativ → Fluss/Blau (Pol B)
    // Holz difference +0.222 → lean "a" = Innovation-Neigung (Pol A = Gold = West-Überschuss;
    // bei Holz ist Pol A per Polaritäts-Konvention "Innovation", NICHT "Tradition")
    expect(t.axes.find(a => a.id === "tradition_innovation")!.lean).toBe("a");
    expect(t.axes.find(a => a.id === "tradition_innovation")!.poleA).toBe("Innovation");
  });

  it("liefert genau 2 Nebenachsen nach |Differenz|-Rang (Fixture: Holz, dann Feuer)", () => {
    const t = deriveTension(comparison, "spuerbar")!;
    expect(t.secondaries.map(s => s.id)).toEqual(["tradition_innovation", "action_being"]);
  });

  it("ist degradationssicher: leere comparison → null", () => {
    expect(deriveTension([], "leise")).toBeNull();
    expect(deriveTension([], null)).toBeNull();
  });

  it("normiert Achsen-Stärken auf [0,1] relativ zur größten Differenz", () => {
    const t = deriveTension(comparison, "dominant")!;
    const main = t.axes.find(a => a.id === "structure_flow")!;
    expect(main.strength).toBeCloseTo(1, 5);
    const erde = t.axes.find(a => a.id === "security_freedom")!;
    expect(erde.strength).toBeCloseTo(0.04 / 0.299, 3);
  });
});
