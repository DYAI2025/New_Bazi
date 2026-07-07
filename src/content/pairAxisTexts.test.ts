import { describe, it, expect } from "vitest";
import { PAIR_AXIS_TEXTS } from "./pairAxisTexts";

const AXIS_IDS = [
  "structure_flow",
  "inner_outer",
  "security_freedom",
  "action_being",
  "tradition_innovation",
] as const;

// Anti-Reifikation: keine Schicksals-/Pathologisierungs-/Paar-Verdikt-Sprache.
const FORBIDDEN =
  /Schicksal|Seele|Diagnose|Therapie|Heilung|Trennung|toxisch|du bist|ihr seid|garantiert|perfekt kompatibel|passt (perfekt )?zusammen|kompatibel|harmonisch/i;

describe("PAIR_AXIS_TEXTS", () => {
  it("enthält genau die 5 Achsen-IDs", () => {
    expect(Object.keys(PAIR_AXIS_TEXTS).sort()).toEqual([...AXIS_IDS].sort());
  });

  it("jede Achse hat einen reibung- und einen harmonie-Text", () => {
    for (const id of AXIS_IDS) {
      const entry = PAIR_AXIS_TEXTS[id];
      expect(entry).toBeDefined();
      expect(typeof entry.reibung).toBe("string");
      expect(typeof entry.harmonie).toBe("string");
      expect(entry.reibung.trim().length).toBeGreaterThan(0);
      expect(entry.harmonie.trim().length).toBeGreaterThan(0);
    }
  });

  it("alle 10 Texte sind eindeutig", () => {
    const all = AXIS_IDS.flatMap((id) => [
      PAIR_AXIS_TEXTS[id].reibung,
      PAIR_AXIS_TEXTS[id].harmonie,
    ]);
    expect(all).toHaveLength(10);
    expect(new Set(all).size).toBe(10);
  });

  it("jeder Text hat ~15-35 Wörter", () => {
    for (const id of AXIS_IDS) {
      for (const text of [PAIR_AXIS_TEXTS[id].reibung, PAIR_AXIS_TEXTS[id].harmonie]) {
        const words = text.trim().split(/\s+/).filter(Boolean);
        expect(words.length).toBeGreaterThanOrEqual(15);
        expect(words.length).toBeLessThanOrEqual(35);
      }
    }
  });

  it("jeder reibung-Text enthält 'Wachstumskante'", () => {
    for (const id of AXIS_IDS) {
      expect(PAIR_AXIS_TEXTS[id].reibung).toContain("Wachstumskante");
    }
  });

  it("jeder harmonie-Text enthält 'Ressource'", () => {
    for (const id of AXIS_IDS) {
      expect(PAIR_AXIS_TEXTS[id].harmonie).toContain("Ressource");
    }
  });

  it("kein Text enthält verbotene Reifikations-/Verdikt-Begriffe", () => {
    for (const id of AXIS_IDS) {
      expect(PAIR_AXIS_TEXTS[id].reibung).not.toMatch(FORBIDDEN);
      expect(PAIR_AXIS_TEXTS[id].harmonie).not.toMatch(FORBIDDEN);
    }
  });

  it("jeder Text ist spezifisch für die Bedeutung seiner Achse", () => {
    expect(PAIR_AXIS_TEXTS.structure_flow.reibung + PAIR_AXIS_TEXTS.structure_flow.harmonie).toMatch(/Struktur/);
    expect(PAIR_AXIS_TEXTS.structure_flow.reibung + PAIR_AXIS_TEXTS.structure_flow.harmonie).toMatch(/Fluss/);
    expect(PAIR_AXIS_TEXTS.inner_outer.reibung + PAIR_AXIS_TEXTS.inner_outer.harmonie).toMatch(/Innen/);
    expect(PAIR_AXIS_TEXTS.inner_outer.reibung + PAIR_AXIS_TEXTS.inner_outer.harmonie).toMatch(/Außen/);
    expect(PAIR_AXIS_TEXTS.security_freedom.reibung + PAIR_AXIS_TEXTS.security_freedom.harmonie).toMatch(/Sicherheit/);
    expect(PAIR_AXIS_TEXTS.security_freedom.reibung + PAIR_AXIS_TEXTS.security_freedom.harmonie).toMatch(/Freiheit/);
    expect(PAIR_AXIS_TEXTS.action_being.reibung + PAIR_AXIS_TEXTS.action_being.harmonie).toMatch(/Handeln/);
    expect(PAIR_AXIS_TEXTS.action_being.reibung + PAIR_AXIS_TEXTS.action_being.harmonie).toMatch(/Sein/);
    expect(PAIR_AXIS_TEXTS.tradition_innovation.reibung + PAIR_AXIS_TEXTS.tradition_innovation.harmonie).toMatch(/Tradition/);
    expect(PAIR_AXIS_TEXTS.tradition_innovation.reibung + PAIR_AXIS_TEXTS.tradition_innovation.harmonie).toMatch(/Innovation/);
  });
});
