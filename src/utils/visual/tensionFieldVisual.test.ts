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

  it("every axis has a curated, non-empty reflection question (no forbidden claims)", () => {
    const forbidden = /du bist|schicksal|diagnose|therapie|heilung|garantiert|beweist/i;
    for (const id of ["structure_flow", "inner_outer", "security_freedom", "action_being", "tradition_innovation"] as const) {
      expect(AXIS_QUESTION[id].length).toBeGreaterThan(10);
      expect(AXIS_QUESTION[id]).toContain("?");
      expect(AXIS_QUESTION[id]).not.toMatch(forbidden);
    }
  });
});
