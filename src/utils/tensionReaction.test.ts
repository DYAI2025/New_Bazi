import { describe, it, expect } from "vitest";
import { deriveTension, type TensionState } from "./tensionNavigator";
import { applyReaction } from "./tensionReaction";

// Gleiche Minimal-Inputs wie tensionNavigator.test.ts (VM-Form).
// Rangfolge nach |difference|: Metall .299 > Holz .222 > Feuer .06 > Wasser .057 > Erde .04
// → structure_flow > tradition_innovation > action_being > inner_outer > security_freedom
const comparison = [
  { element: "Holz",   western: 0.355, bazi: 0.133, difference: 0.222 },
  { element: "Feuer",  western: 0.21,  bazi: 0.15,  difference: 0.06 },
  { element: "Erde",   western: 0.14,  bazi: 0.18,  difference: -0.04 },
  { element: "Metall", western: 0.131, bazi: 0.43,  difference: -0.299 },
  { element: "Wasser", western: 0.164, bazi: 0.107, difference: 0.057 },
];

function freshState(): TensionState {
  const t = deriveTension(comparison, "spuerbar");
  if (!t) throw new Error("Fixture muss einen TensionState liefern");
  return t;
}

describe("applyReaction — trifft", () => {
  it("mode 'vertiefung': Achse, Lean, Ablehnungen und Frage-Offset bleiben unverändert", () => {
    const state = freshState();
    const r = applyReaction(state, "trifft");
    expect(r.mode).toBe("vertiefung");
    expect(r.state.activeAxis.id).toBe("structure_flow");
    expect(r.state.activeLean).toBe(state.activeLean);
    expect(r.rejectedAxisIds).toEqual([]);
    expect(r.questionOffset).toBe(0);
  });
});

describe("applyReaction — teilweise", () => {
  it("mode 'nuance': Achse und Lean bleiben unverändert", () => {
    const state = freshState();
    const r = applyReaction(state, "teilweise");
    expect(r.mode).toBe("nuance");
    expect(r.state.activeAxis.id).toBe("structure_flow");
    expect(r.state.activeLean).toBe(state.activeLean);
    expect(r.questionOffset).toBe(0);
  });
});

describe("applyReaction — widerstand", () => {
  it("mode 'gegenlesart': activeLean invertiert (b→a), Achse bleibt", () => {
    const state = freshState();
    expect(state.activeLean).toBe("b"); // Metall-Differenz negativ → Blau
    const r = applyReaction(state, "widerstand");
    expect(r.mode).toBe("gegenlesart");
    expect(r.state.activeAxis.id).toBe("structure_flow");
    expect(r.state.activeLean).toBe("a");
  });

  it("invertiert nur die Lesart (activeLean) — die Modell-Daten der Achse bleiben unberührt", () => {
    const state = freshState();
    const r = applyReaction(state, "widerstand");
    expect(r.state.activeAxis.lean).toBe("b"); // Achsen-Datum aus difference, unverändert
    expect(r.state.axes.find((a) => a.id === "structure_flow")!.lean).toBe("b");
  });

  it("wechselt die Frage: questionOffset +1 mod 3", () => {
    const state = freshState();
    const r1 = applyReaction(state, "widerstand");
    expect(r1.questionOffset).toBe(1);
    const r2 = applyReaction(r1.state, "widerstand", r1.rejectedAxisIds, r1.questionOffset);
    expect(r2.questionOffset).toBe(2);
    expect(r2.state.activeLean).toBe("b"); // doppelt invertiert = Ausgangs-Lean
    const r3 = applyReaction(r2.state, "widerstand", r2.rejectedAxisIds, r2.questionOffset);
    expect(r3.questionOffset).toBe(0); // mod 3
  });
});

describe("applyReaction — passt_nicht", () => {
  it("mode 'alternative': nächststärkste nicht abgelehnte Achse wird aktiv (Rang 2: Holz)", () => {
    const state = freshState();
    const r = applyReaction(state, "passt_nicht");
    expect(r.mode).toBe("alternative");
    expect(r.state.activeAxis.id).toBe("tradition_innovation");
    expect(r.state.activeLean).toBe("a"); // Holz-Differenz positiv → Gold/Innovation
    expect(r.rejectedAxisIds).toEqual(["structure_flow"]);
  });

  it("Nebenachsen werden neu gebildet: nächste Ränge ohne aktive und abgelehnte Achsen", () => {
    const state = freshState();
    const r = applyReaction(state, "passt_nicht");
    expect(r.state.secondaries.map((s) => s.id)).toEqual(["action_being", "inner_outer"]);
  });

  it("setzt den Frage-Offset zurück: neue Achse beginnt bei ihrer Basisfrage", () => {
    const state = freshState();
    const w = applyReaction(state, "widerstand");
    expect(w.questionOffset).toBe(1);
    const r = applyReaction(w.state, "passt_nicht", w.rejectedAxisIds, w.questionOffset);
    expect(r.questionOffset).toBe(0);
  });

  it("Doppel-passt_nicht wählt Rang 3 (Feuer → action_being)", () => {
    const state = freshState();
    const r1 = applyReaction(state, "passt_nicht");
    const r2 = applyReaction(r1.state, "passt_nicht", r1.rejectedAxisIds, r1.questionOffset);
    expect(r2.mode).toBe("alternative");
    expect(r2.state.activeAxis.id).toBe("action_being");
    expect(r2.rejectedAxisIds).toEqual(["structure_flow", "tradition_innovation"]);
  });

  it("Dreifach-passt_nicht → mode 'kalibrierung' (kein endloses Durchwechseln)", () => {
    const state = freshState();
    const r1 = applyReaction(state, "passt_nicht");
    const r2 = applyReaction(r1.state, "passt_nicht", r1.rejectedAxisIds, r1.questionOffset);
    const r3 = applyReaction(r2.state, "passt_nicht", r2.rejectedAxisIds, r2.questionOffset);
    expect(r3.mode).toBe("kalibrierung");
    expect(r3.rejectedAxisIds).toEqual(["structure_flow", "tradition_innovation", "action_being"]);
    // Zustand bleibt der zuletzt angebotene — UI zeigt den ehrlichen Hinweis, keine neue Achse.
    expect(r3.state.activeAxis.id).toBe("action_being");
  });

  it("geht auch in 'kalibrierung', wenn vor der 3. Ablehnung keine Achse mehr übrig ist", () => {
    const two = deriveTension(
      [
        { element: "Metall", western: 0.131, bazi: 0.43, difference: -0.299 },
        { element: "Holz", western: 0.355, bazi: 0.133, difference: 0.222 },
      ],
      "leise",
    );
    if (!two) throw new Error("2-Achsen-Fixture muss einen TensionState liefern");
    const r1 = applyReaction(two, "passt_nicht");
    expect(r1.mode).toBe("alternative");
    expect(r1.state.activeAxis.id).toBe("tradition_innovation");
    const r2 = applyReaction(r1.state, "passt_nicht", r1.rejectedAxisIds, r1.questionOffset);
    expect(r2.mode).toBe("kalibrierung");
  });
});

describe("applyReaction — Purity", () => {
  it("mutiert weder den Eingabe-State noch die übergebene Ablehnungsliste", () => {
    const state = freshState();
    const snapshot = JSON.parse(JSON.stringify(state));
    const rejected: string[] = [];
    applyReaction(state, "passt_nicht", rejected);
    applyReaction(state, "widerstand", rejected);
    expect(state).toEqual(snapshot);
    expect(rejected).toEqual([]);
  });
});
