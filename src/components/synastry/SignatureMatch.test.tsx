// SignatureMatch — Match-Mode-Verdrahtung im Synastrie-Tab.
// jsdom hat kein WebGL: SignatureScene wirft im Konstruktor, SignatureCanvas
// zeigt den ehrlichen Fallback. Der Test prüft deshalb die Verdrahtung
// (Match-Sektion vs. Missing-State) — nicht die 3D-Szene selbst.
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("../../lib/signature/dynamics", () => ({
  startDynamics: () => ({ stop: () => {} }),
}));

import SignatureMatch from "./SignatureMatch";
import type { ElementalComparisonEntry } from "../../viewmodels/profileViewModel";

const COMPARISON: ElementalComparisonEntry[] = [
  { element: "Holz", western: 0.6, bazi: 0.2, difference: 0.4 },
  { element: "Feuer", western: 0.3, bazi: 0.5, difference: -0.2 },
  { element: "Metall", western: 0.25, bazi: 0.6, difference: -0.35 },
] as unknown as ElementalComparisonEntry[];

function render(ui: React.ReactElement): { container: HTMLElement; cleanup: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  return {
    container,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("SignatureMatch", () => {
  it("zeigt die Match-Sektion mit beiden Namen, wenn beide Elementtabellen auswertbar sind", () => {
    const { container, cleanup } = render(
      <SignatureMatch comparisonA={COMPARISON} comparisonB={COMPARISON} nameA="Ada" nameB="Grace" />,
    );
    expect(container.querySelector('[data-testid="signature-match"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="signature-match-missing"]')).toBeNull();
    expect(container.textContent).toContain("Ada");
    expect(container.textContent).toContain("Grace");
    // Footer-Einordnung: Beschreibung, keine Bewertung.
    expect(container.querySelector('[data-testid="signature-match-footer"]')?.textContent).toContain("keine Bewertung");
    cleanup();
  });

  it("zeigt den ehrlichen Missing-State, wenn eine Seite keine auswertbare Tabelle hat", () => {
    for (const [a, b] of [
      [[], COMPARISON],
      [COMPARISON, []],
      [null, COMPARISON],
      [COMPARISON, [COMPARISON[0]]], // nur 1 Element → < 2 auswertbare
    ] as const) {
      const { container, cleanup } = render(
        <SignatureMatch comparisonA={a as any} comparisonB={b as any} nameA="Ada" nameB="Grace" />,
      );
      expect(container.querySelector('[data-testid="signature-match-missing"]'), JSON.stringify([a?.length, b?.length])).not.toBeNull();
      expect(container.querySelector('[data-testid="signature-match"]')).toBeNull();
      cleanup();
    }
  });
});
