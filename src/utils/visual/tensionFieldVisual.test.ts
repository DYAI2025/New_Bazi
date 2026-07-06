import { describe, it, expect } from "vitest";
import { missingPreview, previewFromTension, AXIS_QUESTION } from "./tensionFieldVisual";
import type { TensionState } from "../tensionNavigator";

describe("tensionFieldVisual — FusionHero preview state (RD-2)", () => {
  it("missingPreview is a neutral state — no axis, no fabricated value", () => {
    const m = missingPreview();
    expect(m.mode).toBe("missing");
    expect(m.activeAxis).toBeNull();
    expect(m.signalLevel).toBeNull();
    expect(m.secondaryAxes).toEqual([]);
    expect(m.question).toBeNull();
    expect(m.source).toBe("missing");
  });

  it("previewFromTension(null) → missing (no fake values)", () => {
    expect(previewFromTension(null)).toEqual(missingPreview());
  });

  it("previewFromTension maps a real TensionState to a computed preview", () => {
    const state = {
      activeAxis: { id: "action_being", element: "Feuer", poleA: "Handeln", poleB: "Sein", angle: 216, strength: 1, lean: "a", difference: 0.3 },
      activeLean: "a",
      secondaries: [
        { id: "inner_outer", element: "Wasser", poleA: "Außen", poleB: "Innen", angle: 72, strength: 0.6, lean: "b", difference: -0.18 },
        { id: "tradition_innovation", element: "Holz", poleA: "Innovation", poleB: "Tradition", angle: 288, strength: 0.4, lean: "a", difference: 0.12 },
      ],
      axes: [],
      signalLevel: "dominant",
    } as unknown as TensionState;
    const p = previewFromTension(state);
    expect(p.mode).toBe("computed");
    expect(p.source).toBe("fufire-viewmodel");
    expect(p.activeAxis).toBe("action_being");
    expect(p.signalLevel).toBe("dominant");
    expect(p.secondaryAxes).toEqual(["inner_outer", "tradition_innovation"]);
    expect(p.question).toBe(AXIS_QUESTION.action_being);
  });

  it("every axis has a curated, non-empty reflection question (no forbidden claims)", () => {
    const forbidden = /du bist|schicksal|diagnose|therapie|heilung|garantiert|beweist/i;
    for (const id of ["structure_flow", "inner_outer", "security_freedom", "action_being", "tradition_innovation"] as const) {
      expect(AXIS_QUESTION[id].length).toBeGreaterThan(10);
      expect(AXIS_QUESTION[id]).toContain("?");
      expect(AXIS_QUESTION[id]).not.toMatch(forbidden);
    }
  });
});
