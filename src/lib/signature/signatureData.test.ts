import { describe, it, expect } from "vitest";
import {
  applyDynamics,
  computeDeltas,
  computeHarmony,
  computeOverlay,
  computeSignature,
  fuseWuXing,
  type SignatureApiInput,
} from "./signatureData";

// Referenzformeln: MATHEMATICS.md aus DYAI2025/bazodiac-signature-prototypes.

const INPUT: SignatureApiInput = {
  wu_xing_vectors: {
    western_planets: { Holz: 0.6, Feuer: 0.45, Erde: 0.3, Metall: 0.25, Wasser: 0.55 },
    bazi_pillars: { Holz: 0.2, Feuer: 0.3, Erde: 0.5, Metall: 0.6, Wasser: 0.4 },
  },
  harmony_index: { harmony_index: 0.62 },
  cosmic_state: 0.5,
};

describe("fuseWuXing (§3.1)", () => {
  it("strength = min(1, sqrt(w·b) + 0.3·max(w,b))", () => {
    const fused = fuseWuXing({ holz: 0.6 }, { holz: 0.2 });
    expect(fused.holz).toBeCloseTo(Math.sqrt(0.6 * 0.2) + 0.3 * 0.6, 10);
    // fehlende Elemente zählen als 0, nicht als NaN
    expect(fused.wasser).toBe(0);
  });

  it("kappt bei 1", () => {
    expect(fuseWuXing({ feuer: 1 }, { feuer: 1 }).feuer).toBe(1);
  });
});

describe("computeHarmony (§6.1)", () => {
  it("harmony = 1 − mean(delta) × 0.5", () => {
    const deltas = computeDeltas({ holz: 0.6, feuer: 0.45, erde: 0.3, metall: 0.25, wasser: 0.55 },
      { holz: 0.2, feuer: 0.3, erde: 0.5, metall: 0.6, wasser: 0.4 });
    const mean = (0.4 + 0.15 + 0.2 + 0.35 + 0.15) / 5;
    expect(computeHarmony(deltas)).toBeCloseTo(1 - mean * 0.5, 10);
  });
});

describe("computeSignature", () => {
  it("nutzt API-harmony_index, wenn vorhanden — sonst lokale Berechnung", () => {
    const sig = computeSignature(INPUT);
    expect(sig.harmony).toBe(0.62);
    const local = computeSignature({ wu_xing_vectors: INPUT.wu_xing_vectors });
    expect(local.harmony).toBeCloseTo(1 - ((0.4 + 0.15 + 0.2 + 0.35 + 0.15) / 5) * 0.5, 10);
  });

  it("Friction-Kanten nur bei delta > 0.3; growthEdge = max |delta|", () => {
    const sig = computeSignature(INPUT);
    const frictions = sig.edges.filter((e) => e.type === "friction").map((e) => e.from);
    expect(frictions.sort()).toEqual(["holz", "metall"]); // 0.40 und 0.35
    expect(sig.growthEdge).toBe("holz");
    expect(sig.dominant).toBe("wasser"); // sqrt(0.55·0.4)+0.3·0.55 = 0.634 ist Maximum
  });

  it("13D-Vektor: 7 Planeten-Slots (Default 0.5 ohne Ledger) + 5 Stärken + (h+c)/2", () => {
    const sig = computeSignature(INPUT);
    expect(sig.vector13D).toHaveLength(13);
    expect(sig.vector13D.slice(0, 7)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    expect(sig.vector13D[12]).toBeCloseTo((0.62 + 0.5) / 2, 10);
  });

  it("Ledger-Gewichte werden auf weight/1.3 normiert und bei 1 gekappt", () => {
    const sig = computeSignature({
      ...INPUT,
      contribution_ledger: { western: [{ planet: "Sun", weight: 1.3 }, { planet: "Moon", weight: 0.65 }] },
    });
    expect(sig.vector13D[0]).toBe(1);
    expect(sig.vector13D[1]).toBeCloseTo(0.5, 10);
  });
});

describe("applyDynamics (Konzeptdoc §1/§4)", () => {
  it("Transit-Deltas werden auf ±0.10 begrenzt und nur auf W angewendet", () => {
    const out = applyDynamics(INPUT, { transit_deltas: { western: { holz: 0.5, metall: -0.5 }, bazi: { holz: 0.5 } } });
    expect(out.wu_xing_vectors.western_planets!.Holz).toBeCloseTo(0.7, 10);   // 0.6 + clamp(0.5)=0.10
    expect(out.wu_xing_vectors.western_planets!.Metall).toBeCloseTo(0.15, 10); // 0.25 − 0.10
    // Transits berühren B nie — auch wenn ein bazi-Block mitgeschickt wird
    expect(out.wu_xing_vectors.bazi_pillars!.Holz).toBe(0.2);
    // Original bleibt unverändert (deep copy)
    expect(INPUT.wu_xing_vectors.western_planets!.Holz).toBe(0.6);
  });

  it("Quiz-Bound skaliert mit completed_ratio", () => {
    const out = applyDynamics(INPUT, { quiz_deltas: { western: { feuer: 0.1 }, completed_ratio: 0.5 } });
    expect(out.wu_xing_vectors.western_planets!.Feuer).toBeCloseTo(0.5, 10); // 0.45 + clamp(0.1, ±0.05)
  });

  it("harmony wird relativ reskaliert (kein Sprung), cosmic_weather überschreibt cosmic_state", () => {
    const out = applyDynamics(INPUT, {
      transit_deltas: { western: { holz: -0.1 } },
      cosmic_weather: { normalized: 0.9, source: "noaa" },
    });
    expect(out.cosmic_state).toBe(0.9);
    // Holz-Delta sinkt 0.4 → 0.3 ⇒ lokale Harmony steigt ⇒ reskalierter Wert > 0.62
    const h = (out.harmony_index as { harmony_index: number }).harmony_index;
    expect(h).toBeGreaterThan(0.62);
    expect(h).toBeLessThanOrEqual(1);
  });

  it("ohne dyn: unveränderte tiefe Kopie", () => {
    const out = applyDynamics(INPUT, null);
    expect(out).toEqual(INPUT);
    expect(out).not.toBe(INPUT);
  });
});

describe("computeOverlay (§9.1)", () => {
  it("identische Signaturen → coherence 1, deltaOverlay 0", () => {
    const sig = computeSignature(INPUT);
    const ov = computeOverlay(sig, sig);
    expect(ov.coherence).toBeCloseTo(1, 10);
    ov.perElement.forEach((pe) => {
      expect(pe.deltaOverlay).toBe(0);
      expect(pe.resonance).toBe(1);
      expect(pe.frictionOverlay).toBe(0);
    });
  });

  it("frictionOverlay = deltaOverlay × (1−hA) × (1−hB)", () => {
    const sigA = computeSignature(INPUT);
    const sigB = computeSignature({
      wu_xing_vectors: {
        western_planets: { Holz: 0.1, Feuer: 0.9, Erde: 0.5, Metall: 0.7, Wasser: 0.2 },
        bazi_pillars: { Holz: 0.8, Feuer: 0.1, Erde: 0.5, Metall: 0.2, Wasser: 0.9 },
      },
      harmony_index: { harmony_index: 0.4 },
    });
    const ov = computeOverlay(sigA, sigB);
    const holz = ov.perElement.find((p) => p.id === "holz")!;
    expect(holz.frictionOverlay).toBeCloseTo(holz.deltaOverlay * (1 - 0.62) * (1 - 0.4), 10);
    expect(ov.coherence).toBeGreaterThan(0);
    expect(ov.coherence).toBeLessThan(1);
  });
});
