import { describe, it, expect } from "vitest";
import { councilOfSix, deriveIntensity, deriveMode } from "./dayPulse";

describe("deriveMode — FR-DP-001 Schwellen exakt", () => {
  it("spannung < 0.45, pulse 0.45–0.4999…, trace ≥ 0.50", () => {
    expect(deriveMode(0.4499)).toBe("spannung");
    expect(deriveMode(0)).toBe("spannung");
    expect(deriveMode(0.45)).toBe("pulse"); // Grenze inklusiv für pulse
    expect(deriveMode(0.4999)).toBe("pulse");
    expect(deriveMode(0.5)).toBe("trace"); // Grenze inklusiv für trace
    expect(deriveMode(0.7498)).toBe("trace"); // Live-Wert 2026-07-10
    expect(deriveMode(1)).toBe("trace");
  });

  it("ohne Harmony-Index ehrlich null", () => {
    expect(deriveMode(null)).toBeNull();
    expect(deriveMode(undefined)).toBeNull();
    expect(deriveMode(NaN)).toBeNull();
  });
});

describe("deriveIntensity — FR-DP-002 Formel exakt", () => {
  it("clamp(|H − 0.45| / 0.55, 0, 1)", () => {
    expect(deriveIntensity(0.45)).toBe(0);
    expect(deriveIntensity(1)).toBe(1); // |1−0.45|/0.55 = 1
    expect(deriveIntensity(0)).toBeCloseTo(0.45 / 0.55, 10);
    expect(deriveIntensity(0.7498)).toBeCloseTo((0.7498 - 0.45) / 0.55, 10);
  });

  it("ohne Harmony-Index ehrlich null", () => {
    expect(deriveIntensity(null)).toBeNull();
    expect(deriveIntensity(NaN)).toBeNull();
  });
});

describe("councilOfSix — FR-DP-008 Shape", () => {
  const FULL = {
    sunSign: "Zwillinge",
    moonSign: "Stier",
    ascendantSign: "Waage",
    dayMaster: "Yi",
    elements: { Holz: 0.575, Feuer: 0.37, Erde: 0.41, Metall: 0.2, Wasser: 0.29 },
  };

  it("liefert exakt sechs stabile Keys in fixer Reihenfolge", () => {
    expect(councilOfSix(FULL).map((e) => e.key)).toEqual([
      "sun",
      "moon",
      "ascendant",
      "day_master",
      "year_animal",
      "dominant_wuxing",
    ]);
  });

  it("verfügbare Sitze tragen Wert, unverfügbare Grund — nie beides", () => {
    const c = councilOfSix(FULL);
    for (const e of c) {
      if (e.available) {
        expect(e.value, e.key).not.toBeNull();
        expect(e.unavailableReason, e.key).toBeNull();
      } else {
        expect(e.value, e.key).toBeNull();
        expect(e.unavailableReason, e.key).toMatch(/./);
      }
    }
    expect(c.find((e) => e.key === "moon")!.available).toBe(true);
    expect(c.find((e) => e.key === "dominant_wuxing")!.value).toBe("Holz");
  });

  it("year_animal bleibt in Stufe 1 ehrlich unavailable (kein Anker im Tages-Response)", () => {
    const e = councilOfSix(FULL).find((x) => x.key === "year_animal")!;
    expect(e.available).toBe(false);
    expect(e.unavailableReason).toContain("Jahres-Säule");
  });

  it("fehlende Geburtszeit → Aszendent-Sitz unavailable mit ehrlichem Grund", () => {
    const c = councilOfSix({ ...FULL, ascendantSign: null });
    const asc = c.find((e) => e.key === "ascendant")!;
    expect(asc.available).toBe(false);
    expect(asc.unavailableReason).toContain("Geburtszeit");
    expect(c).toHaveLength(6); // Sitz verschwindet NIE, er ist nur leer
  });
});
