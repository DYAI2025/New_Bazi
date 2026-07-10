import { describe, it, expect } from "vitest";
import { sectorLabel, SECTOR_LABELS } from "./sectorLabels";

describe("sectorLabels — 12 Lebensbereiche (0-indizierte Engine-Sektoren)", () => {
  it("kennt genau 12 Labels", () => {
    expect(SECTOR_LABELS).toHaveLength(12);
    expect(new Set(SECTOR_LABELS).size).toBe(12);
  });
  it("normalisiert 0-Index auf 1–12 (live verifiziert: saturn sector 0)", () => {
    expect(sectorLabel(0)).toBe("1 · Selbst & Auftreten");
    expect(sectorLabel(4)).toBe("5 · Ausdruck & Kreativität");
    expect(sectorLabel(11)).toBe("12 · Rückzug & Inneres");
  });
  it("gibt für unbekannte Indizes ehrlich null zurück", () => {
    expect(sectorLabel(12)).toBeNull();
    expect(sectorLabel(-1)).toBeNull();
    expect(sectorLabel(null)).toBeNull();
    expect(sectorLabel(2.5)).toBeNull();
  });
});
