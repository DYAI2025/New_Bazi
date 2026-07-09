import { describe, it, expect } from "vitest";
import { comparisonToSignatureInput, toSignatureInput } from "./signatureAdapter";
import { computeSignature } from "../../lib/signature/signatureData";
import type { ProfileViewModel } from "../../viewmodels/profileViewModel";

function vmWithFusion(fusion: Partial<ProfileViewModel["fusion"]>): ProfileViewModel {
  return {
    fusion: {
      coherenceIndex: 48.7,
      coherenceCalibrated: true,
      signalLevel: "spuerbar",
      coherenceRating: "",
      coherenceExplanation: "",
      systemBridge: "",
      elementalComparison: [
        { element: "Holz", western: 0.6, bazi: 0.2, difference: 0.4 },
        { element: "Metall", western: 0.25, bazi: 0.6, difference: -0.35 },
      ],
      topSignals: [],
      label: "",
      explanation: "",
      signalLevelSuffix: null,
      westernContributors: [],
      baziContributors: [],
      wuxingContributors: [],
      supports: [],
      frictions: [],
      integrationText: null,
      source: "fufire",
      ...fusion,
    },
  } as unknown as ProfileViewModel;
}

describe("toSignatureInput", () => {
  it("mappt elementalComparison auf wu_xing_vectors und skaliert coherenceIndex 0–100 → 0..1", () => {
    const input = toSignatureInput(vmWithFusion({}))!;
    expect(input.wu_xing_vectors.western_planets).toEqual({ Holz: 0.6, Metall: 0.25 });
    expect(input.wu_xing_vectors.bazi_pillars).toEqual({ Holz: 0.2, Metall: 0.6 });
    expect((input.harmony_index as { harmony_index: number }).harmony_index).toBeCloseTo(0.487, 10);
    // Ergebnis ist direkt computeSignature-tauglich (Keys werden dort lowercased)
    const sig = computeSignature(input);
    expect(sig.elements.find((e) => e.id === "holz")!.delta).toBeCloseTo(0.4, 10);
  });

  it("fusion.source === 'missing' → null (ehrlicher Missing-State statt Beispieldaten)", () => {
    expect(toSignatureInput(vmWithFusion({ source: "missing" }))).toBeNull();
  });

  it("< 2 Element-Einträge → null (wie deriveTension)", () => {
    expect(toSignatureInput(vmWithFusion({
      elementalComparison: [{ element: "Holz", western: 0.6, bazi: 0.2, difference: 0.4 }],
    }))).toBeNull();
  });

  it("coherenceIndex null → kein harmony_index (computeSignature rechnet lokal)", () => {
    const input = toSignatureInput(vmWithFusion({ coherenceIndex: null }))!;
    expect(input.harmony_index).toBeUndefined();
  });

  it("fehlendes viewModel → null", () => {
    expect(toSignatureInput(null)).toBeNull();
    expect(toSignatureInput(undefined)).toBeNull();
  });
});

describe("comparisonToSignatureInput", () => {
  it("baut Partner-Eingabe aus einer West/BaZi-Elementtabelle", () => {
    const input = comparisonToSignatureInput([
      { element: "Feuer", western: 0.5, bazi: 0.3 },
      { element: "Wasser", western: 0.2, bazi: 0.7 },
    ])!;
    expect(input.wu_xing_vectors.western_planets).toEqual({ Feuer: 0.5, Wasser: 0.2 });
    expect(input.wu_xing_vectors.bazi_pillars).toEqual({ Feuer: 0.3, Wasser: 0.7 });
  });

  it("leer oder < 2 Einträge → null", () => {
    expect(comparisonToSignatureInput(null)).toBeNull();
    expect(comparisonToSignatureInput([])).toBeNull();
    expect(comparisonToSignatureInput([{ element: "Feuer", western: 0.5, bazi: 0.3 }])).toBeNull();
  });
});
