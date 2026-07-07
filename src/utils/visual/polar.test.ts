import { describe, it, expect } from "vitest";
import { polar, curvePath, clamp, blend } from "./polar";

// Pins the re-housed FusionHero geometry to the SAME output as TensionNavigator's
// originals (CX/CY 360, R 240). If either copy drifts, these + the tension-navigator
// e2e go red.
describe("polar geometry (FusionHero, re-housed from TensionNavigator)", () => {
  it("0° is the top of the ring (12 o'clock)", () => {
    const p = polar(360, 360, 240, 0);
    expect(p.x).toBeCloseTo(360, 6);
    expect(p.y).toBeCloseTo(120, 6); // 360 - 240
  });

  it("90° is the right of the ring (3 o'clock)", () => {
    const p = polar(360, 360, 240, 90);
    expect(p.x).toBeCloseTo(600, 6);
    expect(p.y).toBeCloseTo(360, 6);
  });

  it("180° is the bottom", () => {
    const p = polar(360, 360, 240, 180);
    expect(p.x).toBeCloseTo(360, 6);
    expect(p.y).toBeCloseTo(600, 6);
  });

  it("curvePath builds an M..Q quadratic from p1 to p2", () => {
    const top = polar(360, 360, 240, 0);
    const right = polar(360, 360, 240, 90);
    const d = curvePath(top, right, 100);
    expect(d).toMatch(/^M 360\.0 120\.0 Q /);
    expect(d).toContain(" 600.0 360.0"); // ends at p2
    expect(d.startsWith("M")).toBe(true);
  });

  it("blend: t=1 → Gold, t=0 → Blau, clamped, deterministic midpoint", () => {
    expect(blend(1)).toBe("#d9b86d");
    expect(blend(0)).toBe("#27c8ee");
    expect(blend(2)).toBe("#d9b86d"); // clamp high
    expect(blend(-1)).toBe("#27c8ee"); // clamp low
    expect(blend(0.5)).toBe("#80c0ae"); // pinned midpoint
  });

  it("clamp bounds correctly", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.3, 0, 1)).toBe(0.3);
  });

});
