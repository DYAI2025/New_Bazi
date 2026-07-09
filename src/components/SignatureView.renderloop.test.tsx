// Regressionstest: SignatureView darf nach dem Mount NICHT endlos re-rendern.
//
// Der Loop-Mechanismus (2026-07-09, auf feat/signature-3d gefixt):
// SignatureView baute `input` pro Render neu (toSignatureInput ohne useMemo),
// SignatureCanvas memoisiert `signature` auf der `input`-Identität und meldet
// den Status per onStatus → setStatus nach oben. Neues input → neue signature
// → Effect feuert → setStatus → Re-Render → neues input … (898 Aufrufe/500 ms).
// Fix: useMemo um toSignatureInput in SignatureView.
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";

const calls = { computeSignature: 0 };

vi.mock("../lib/signature/signatureData", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../lib/signature/signatureData")>();
  return {
    ...mod,
    computeSignature: (...args: Parameters<typeof mod.computeSignature>) => {
      calls.computeSignature++;
      return mod.computeSignature(...args);
    },
  };
});

// Kein echter NOAA-Netzverkehr im Test.
vi.mock("../lib/signature/dynamics", () => ({
  startDynamics: () => ({ stop: () => {} }),
}));

import SignatureView from "./SignatureView";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";

function vm(): ProfileViewModel {
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
    },
  } as unknown as ProfileViewModel;
}

describe("SignatureView render loop regression", () => {
  it("computeSignature call count stays bounded after mount", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<SignatureView viewModel={vm()} />);
    await new Promise((r) => setTimeout(r, 500));
    const count = calls.computeSignature;
    root.unmount();
    container.remove();
    // Gesund: eine Handvoll Berechnungen (Mount + StrictMode-Doppelrender).
    // Der Bug lag bei ~900 Aufrufen in 500 ms.
    expect(count).toBeLessThan(10);
  });
});
