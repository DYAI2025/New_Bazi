import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { renderComponent, cleanupComponent } from "../test-utils/renderComponent";
import { normalizeFuFireProfile } from "../utils/fufireNormalizer";
import Overview from "./Overview";

const DUMMY_INPUT = {
  name: "Test",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthPlace: "Berlin",
  birthPlaceLabel: "Berlin",
  placeId: "p1",
  gender: "Divers" as const
};

afterEach(() => cleanupComponent());

describe("Overview warnings (A13)", () => {
  it("zeigt overview-warnings wenn viewModel.warnings nicht leer", () => {
    // empty raw → normalizer pushes 4 warnings (western/bazi/wuxing/fusion missing)
    const vm = normalizeFuFireProfile({}, DUMMY_INPUT, "fufire-chart");
    expect(vm.warnings.length).toBeGreaterThan(0);

    const container = renderComponent(<Overview viewModel={vm} onNavigate={() => {}} />);
    const el = container.querySelector('[data-testid="overview-warnings"]');
    expect(el).not.toBeNull();
    expect(el!.textContent).toContain("Hinweise zur Berechnung");
    vm.warnings.forEach((w) => expect(el!.textContent).toContain(w));
  });

  it("overview-warnings fehlt wenn keine Warnungen", () => {
    // Construct a minimal VM with empty warnings
    const vm = normalizeFuFireProfile({}, DUMMY_INPUT, "fufire-chart");
    const vmNoWarnings = { ...vm, warnings: [] };

    const container = renderComponent(<Overview viewModel={vmNoWarnings} onNavigate={() => {}} />);
    const el = container.querySelector('[data-testid="overview-warnings"]');
    expect(el).toBeNull();
  });
});
