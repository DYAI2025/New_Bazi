import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import TensionNavigator, { __resetIntroForTests } from "./TensionNavigator";
import { renderComponent, cleanupComponent, clickTestId } from "../test-utils/renderComponent";
import { normalizeFuFireProfile } from "../utils/fufireNormalizer";
import fusionFixture from "../__fixtures__/fufire/fusion.json";

const INPUT = { name: "Test", birthDate: "1990-06-15", birthTime: "14:30", birthPlaceLabel: "Berlin", gender: "Divers" };
afterEach(() => { cleanupComponent(); __resetIntroForTests(); });

describe("OriginLayer Kohärenz-Gauge (B-002)", () => {
  it("zeigt den kalibrierten Prozentwert, wenn vorhanden", () => {
    const vm = normalizeFuFireProfile({ fusion: fusionFixture }, INPUT, "fufire-orchestrated");
    const c = renderComponent(<TensionNavigator viewModel={vm} />);
    clickTestId(c, "tension-origin-toggle");
    expect(c.querySelector('[data-testid="fusion-coherence-value"]')?.textContent).toMatch(/\d+(\.\d+)?%/);
  });

  it("rendert 'nicht verfügbar' statt 0%/null%, wenn coherenceIndex null ist", () => {
    const vm = normalizeFuFireProfile(
      { fusion: {
          calibration: { h_raw: 0.5, h_baseline: 0.25, h_sigma: 0.25 },
          elemental_comparison: (fusionFixture as any).elemental_comparison
      } },
      INPUT, "fufire-orchestrated"
    );
    expect(vm.fusion.coherenceIndex).toBeNull();
    const c = renderComponent(<TensionNavigator viewModel={vm} />);
    clickTestId(c, "tension-origin-toggle");
    const missing = c.querySelector('[data-testid="fusion-coherence-missing"]');
    expect(missing).toBeTruthy();
    expect(missing!.textContent).toContain("nicht verfügbar");
    expect(c.querySelector('[data-testid="fusion-coherence-value"]')).toBeNull();
    expect(c.textContent).not.toContain("null%");
    expect(c.textContent).not.toContain("NaN");
  });
});

describe("Navigator-Intro (B-010)", () => {
  const fullVm = () => normalizeFuFireProfile({ fusion: fusionFixture }, INPUT, "fufire-orchestrated");

  it("zeigt beim ersten Render die Anti-Reification-Intro-Zeile", () => {
    const c = renderComponent(<TensionNavigator viewModel={fullVm()} />);
    const intro = c.querySelector('[data-testid="tension-intro"]');
    expect(intro).toBeTruthy();
    expect(intro!.textContent).toContain("Kein Urteil.");
    expect(intro!.textContent).toContain("du entscheidest, ob sie trägt");
    expect(intro!.textContent).not.toMatch(/%|\d/);
  });

  it("ist dismissible und bleibt in derselben Session weg (Remount)", () => {
    const c1 = renderComponent(<TensionNavigator viewModel={fullVm()} />);
    clickTestId(c1, "tension-intro-dismiss");
    expect(c1.querySelector('[data-testid="tension-intro"]')).toBeNull();
    cleanupComponent();
    const c2 = renderComponent(<TensionNavigator viewModel={fullVm()} />);
    expect(c2.querySelector('[data-testid="tension-intro"]')).toBeNull();
  });
});
