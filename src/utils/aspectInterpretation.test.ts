/**
 * A6: aspect cards must never show the literal placeholder
 * "Lokale abgeleitete Deutung" — the REAL AspectResponse has no
 * interpretation field, so a local deterministic generator composes one
 * German sentence per aspect.
 */
import { describe, it, expect } from "vitest";
import { aspectInterpretation } from "./aspectInterpretation";
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
    expect(opp).toContain("Werte und Beziehung");
    expect(opp).toContain("Struktur und Grenze");
    expect(opp).toContain("Achse");
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
