/**
 * A6: aspect cards must never show the literal placeholder
 * "Lokale abgeleitete Deutung" — the REAL AspectResponse has no
 * interpretation field, so a local deterministic generator composes one
 * German sentence per aspect.
 */
import { describe, it, expect } from "vitest";
import { aspectInterpretation, PLANET_KEYWORDS_DE, pairAspectInterpretation } from "./aspectInterpretation";
import { normalizeFuFireProfile } from "./fufireNormalizer";

import westernFixture from "../__fixtures__/fufire/western.json";

const INPUT = {
  name: "Live Smoke",
  birthDate: "1990-06-15",
  birthTime: "14:30",
  birthPlaceLabel: "Berlin",
  gender: "Divers"
};

describe("aspectInterpretation generator", () => {
  it("is deterministic: same input -> same output", () => {
    const a = aspectInterpretation("Sonne", "Saturn", "Quadrat");
    const b = aspectInterpretation("Sonne", "Saturn", "Quadrat");
    expect(a).toBe(b);
  });

  it("composes aspect-type x planet-keyword sentences", () => {
    const trine = aspectInterpretation("Mond", "Pluto", "Trigon");
    expect(trine).toContain("Mond trifft auf Pluto");
    expect(trine).toContain("Gefühlswelt");
    expect(trine).toContain("Wandlung");

    const square = aspectInterpretation("Sonne", "Mars", "Quadrat");
    expect(square).toContain("Identität");
    expect(square).toContain("Antrieb");
    expect(square).toContain("Reibung");

    const opp = aspectInterpretation("Venus", "Saturn", "Opposition");
    expect(opp).toContain("Beziehungswelt");
    expect(opp).toContain("Strukturkraft");
    expect(opp).toContain("Achse");
  });

  it("GRAMMAR CONTRACT: every planet keyword is a single dative-stable noun", () => {
    // Multi-word keywords ("Werte und Beziehung") after "zwischen" (dative)
    // produced broken chains like "zwischen Werte und Beziehung und Denken
    // und Kommunikation". Pin: one word, no "und", no whitespace.
    for (const [planet, keyword] of Object.entries(PLANET_KEYWORDS_DE)) {
      expect(keyword, `keyword for ${planet}`).toMatch(/^[A-ZÄÖÜ][a-zäöüß]+$/);
    }
  });

  it("never composes ambiguous 'und'-chains between the two keywords", () => {
    // The keyword segment between the two themes must contain exactly one
    // "und" for every planet pairing and every aspect type.
    const planets = Object.keys(PLANET_KEYWORDS_DE);
    const types = ["Konjunktion", "Opposition", "Trigon", "Quadrat", "Sextil", "Quincunx", "Halbsextil"];
    for (const p1 of planets) {
      for (const p2 of planets) {
        if (p1 === p2) continue;
        for (const t of types) {
          const s = aspectInterpretation(p1, p2, t);
          const k1 = PLANET_KEYWORDS_DE[p1];
          const k2 = PLANET_KEYWORDS_DE[p2];
          expect(s, `${p1} ${t} ${p2}`).toContain(`${k1} und ${k2}`);
          // The broken legacy chain shape ("zwischen <a> und <b> und <c>")
          // can no longer occur: no keyword itself contains "und".
          expect(k1).not.toContain(" und ");
          expect(k2).not.toContain(" und ");
        }
      }
    }
  });

  it("produces distinct sentences per aspect type", () => {
    const types = ["Konjunktion", "Opposition", "Trigon", "Quadrat", "Sextil", "Quincunx", "Halbsextil"];
    const sentences = types.map((t) => aspectInterpretation("Merkur", "Jupiter", t));
    expect(new Set(sentences).size).toBe(types.length);
  });

  it("uses anti-reification framing — never essential 'Du bist ...' statements", () => {
    const planets = ["Sonne", "Mond", "Merkur", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptun", "Pluto", "Chiron", "Mondknoten"];
    const types = ["Konjunktion", "Opposition", "Trigon", "Quadrat", "Sextil"];
    for (const p1 of planets) {
      for (const t of types) {
        const s = aspectInterpretation(p1, "Mond", t);
        expect(s).not.toMatch(/Du bist|Sie sind/);
        expect(s).toContain(`${p1} `);
      }
    }
  });

  it("falls back gracefully for unknown planets and aspect types", () => {
    const s = aspectInterpretation("Vesta", "Juno", "Quintil");
    expect(s.length).toBeGreaterThan(20);
    expect(s).toContain("Vesta");
    expect(s).toContain("Juno");
    expect(s).not.toBe("Lokale abgeleitete Deutung");
  });
});

describe("pairAspectInterpretation (REQ-D-002/S-001)", () => {
  const SUPPORTED_TYPES = ["Trigon", "Sextil", "Konjunktion", "Quadrat", "Opposition"];

  // The forbidden-pattern guard for anti-reification. Mirrors the hard
  // ANTI-REIFICATION constraint: no fate/soul/diagnosis/relationship-verdict
  // language, no "harmonisch"/"passt zusammen"/"kompatibel" as a verdict.
  const FORBIDDEN = /Schicksal|Seele|Diagnose|Therapie|Heilung|Trennung|toxisch|du bist|ihr seid|garantiert|perfekt kompatibel|passt (perfekt )?zusammen|kompatibel|harmonisch/i;

  it("names BOTH anchors explicitly with (A)/(B) labels", () => {
    const s = pairAspectInterpretation("Sonne", "Mond", "Trigon");
    expect(s).toContain("Sonne (A)");
    expect(s).toContain("Mond (B)");
  });

  it("returns a non-empty sentence for every supported aspect type", () => {
    for (const t of SUPPORTED_TYPES) {
      const s = pairAspectInterpretation("Sonne", "Mond", t);
      expect(s, `type ${t}`).toBeTruthy();
      expect(s.length, `type ${t}`).toBeGreaterThan(20);
    }
  });

  it("uses a distinct tone marker per supported aspect type", () => {
    expect(pairAspectInterpretation("Sonne", "Mond", "Trigon")).toMatch(/Ressource/);
    expect(pairAspectInterpretation("Sonne", "Mond", "Sextil")).toMatch(/Gelegenheit/);
    expect(pairAspectInterpretation("Sonne", "Mond", "Konjunktion")).toMatch(/Bündelung|Aktivierung/);
    expect(pairAspectInterpretation("Sonne", "Mond", "Quadrat")).toMatch(/Reibung|Wachstumskante/);
    expect(pairAspectInterpretation("Sonne", "Mond", "Opposition")).toMatch(/Polarität|Spannungsachse/);
  });

  it("frames Quadrat as a Wachstumskante, never a defect or verdict", () => {
    const s = pairAspectInterpretation("Sonne", "Mars", "Quadrat");
    expect(s).toContain("Wachstumskante");
    expect(s).not.toMatch(FORBIDDEN);
  });

  it("falls back to a safe generic interplay sentence for unknown type", () => {
    const s = pairAspectInterpretation("Sonne", "Mond", "Quintil");
    expect(s.length).toBeGreaterThan(20);
    expect(s).toContain("Sonne (A)");
    expect(s).toContain("Mond (B)");
    expect(s).not.toMatch(FORBIDDEN);
  });

  it("uses the planet's own name as theme for unknown planets", () => {
    const s = pairAspectInterpretation("Vesta", "Juno", "Trigon");
    expect(s).toContain("Vesta (A)");
    expect(s).toContain("Juno (B)");
    expect(s).toContain("Vesta");
    expect(s).toContain("Juno");
  });

  it("emits NONE of the forbidden anti-reification patterns across all type+sample combos", () => {
    const samples: Array<[string, string]> = [
      ["Sonne", "Mond"],
      ["Venus", "Saturn"],
      ["Mars", "Pluto"],
      ["Merkur", "Jupiter"],
      ["Vesta", "Juno"]
    ];
    const types = [...SUPPORTED_TYPES, "Quintil", "Quincunx", ""];
    for (const [a, b] of samples) {
      for (const t of types) {
        const s = pairAspectInterpretation(a, b, t);
        expect(s, `${a} ${t} ${b}`).not.toMatch(FORBIDDEN);
      }
    }
  });
});

describe("normalizer aspect cards against the REAL western fixture", () => {
  it("every fixture aspect gets a non-placeholder, non-empty German sentence", () => {
    const vm = normalizeFuFireProfile({ western: westernFixture }, INPUT, "fufire-orchestrated");
    expect(vm.western.aspects.length).toBeGreaterThan(0);
    for (const asp of vm.western.aspects) {
      expect(asp.interpretation).toBeTruthy();
      expect(asp.interpretation).not.toBe("Lokale abgeleitete Deutung");
      expect(asp.interpretation.length).toBeGreaterThan(30);
      // German planet names appear in the sentence.
      expect(asp.interpretation).toContain(asp.planet1);
      expect(asp.interpretation).toContain(asp.planet2);
    }
  });

  it("same fixture -> identical interpretations on every run (deterministic)", () => {
    const run1 = normalizeFuFireProfile({ western: westernFixture }, INPUT, "fufire-orchestrated").western.aspects.map((a) => a.interpretation);
    const run2 = normalizeFuFireProfile({ western: westernFixture }, INPUT, "fufire-orchestrated").western.aspects.map((a) => a.interpretation);
    expect(run1).toEqual(run2);
  });

  it("keeps a server/legacy-provided interpretation untouched", () => {
    const vm = normalizeFuFireProfile(
      { western: { aspects: [{ planet1: "Sonne", planet2: "Mond", type: "Quadrat", orb: 1.8, harmony: "spannend", interpretation: "Spannung zwischen Wille und Gefühl." }] } },
      INPUT,
      "fufire-orchestrated"
    );
    expect(vm.western.aspects[0].interpretation).toBe("Spannung zwischen Wille und Gefühl.");
  });
});
