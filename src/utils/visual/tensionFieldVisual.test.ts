import { describe, it, expect } from "vitest";
import { demoPreview, missingPreview, AXIS_QUESTION } from "./tensionFieldVisual";

describe("tensionFieldVisual — FusionHero preview state (RD-2)", () => {
  it("demoPreview is deterministic, labelled static-demo, one active axis + question", () => {
    const a = demoPreview();
    const b = demoPreview();
    expect(a).toEqual(b); // deterministic, no Date/random
    expect(a.mode).toBe("demo");
    expect(a.source).toBe("static-demo");
    expect(a.activeAxis).toBe("structure_flow");
    expect(a.signalLevel).toBe("spuerbar");
    expect(a.question && a.question.length).toBeGreaterThan(10);
    expect(a.question).toContain("?");
    expect(a.secondaryAxes.length).toBeLessThanOrEqual(2);
  });

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
