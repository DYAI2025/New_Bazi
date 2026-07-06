import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PAIR_AXIS_TEXTS } from "../content/pairAxisTexts";
import { pairAspectInterpretation } from "../utils/aspectInterpretation";
import { compareBaziPillars } from "../utils/baziCompare";
import type { ProfileViewModel } from "../viewmodels/profileViewModel";

// P7 anti-reification scanner (council C2/C3, Phase 0.16):
//  C2 — widen beyond the exotic words (soulmate/Schicksal/Trennung) to the everyday
//       relationship reifiers: harmonisch / passt zusammen / kompatibel / verdict copy.
//  C3 — cover BOTH the generated/curated pair copy (runtime values) AND the synastry
//       component chrome (incl. the synastry/ subdir the existing scanner skips).
// Comments are NOT scanned for components (they legitimately name forbidden words to
// document their exclusion); we strip comments and check only real source text, and we
// check the content/util copy via its RUNTIME VALUES, never raw source.
const PAIR_FORBIDDEN =
  /seelenverwand|f[üu]r ?einander bestimmt|\btoxisch|\bgarantiert|perfekt kompatibel|\bkompatibel|passt (perfekt )?zusammen|\bharmonisch|du bist|ihr seid|\bschicksal|\btrennung|diagnose|therapie|heilung|match beweist/i;

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const SRC_ROOT = join(__dirname, "..");

const pillar = (pillarKey: string, stemElement: string, branchAnimal: string) =>
  ({ pillarKey, stemElement, branchAnimal } as unknown as ProfileViewModel["bazi"]["pillars"][number]);

describe("P7 synastry wording — anti-reification (council C2/C3)", () => {
  it("curated pair-axis texts carry no forbidden verdict copy", () => {
    const entries = Object.entries(PAIR_AXIS_TEXTS);
    expect(entries.length).toBe(5);
    for (const [id, t] of entries) {
      expect(t.reibung, `${id}.reibung`).not.toMatch(PAIR_FORBIDDEN);
      expect(t.harmonie, `${id}.harmonie`).not.toMatch(PAIR_FORBIDDEN);
    }
  });

  it("generated pair-aspect interpretations carry no forbidden verdict copy", () => {
    const planets = ["Sonne", "Mond", "Merkur", "Venus", "Mars", "Saturn", "Aszendent", "Pluto", "Unbekannt"];
    const types = ["Konjunktion", "Sextil", "Quadrat", "Trigon", "Opposition", "Quincunx", "Foo"];
    for (const a of planets) {
      for (const b of planets) {
        for (const ty of types) {
          const text = pairAspectInterpretation(a, b, ty);
          expect(text.length, `${a}/${b}/${ty}`).toBeGreaterThan(0);
          expect(text, `${a}/${b}/${ty}`).not.toMatch(PAIR_FORBIDDEN);
        }
      }
    }
  });

  it("generated pillar-comparison texts carry no forbidden verdict copy", () => {
    const A = [
      pillar("Jahr", "Holz", "Pferd"),
      pillar("Monat", "Feuer", "Hund"),
      pillar("Tag", "Wasser", "Ratte"),
      pillar("Stunde", "Metall", "Hase"),
    ];
    const B = [
      pillar("Jahr", "Feuer", "Hund"), // San-He + Sheng
      pillar("Monat", "Erde", "Hund"), // gleich-Tier + Sheng
      pillar("Tag", "Feuer", "Pferd"), // Chong + Ke
      pillar("Stunde", "Metall", "Hahn"), // Chong + gleich-Element
    ];
    const out = compareBaziPillars(A, B);
    expect(out.length).toBeGreaterThanOrEqual(1);
    for (const p of out) {
      expect(p.text, p.pillarKey).not.toMatch(PAIR_FORBIDDEN);
    }
  });

  it("synastry component chrome (comment-stripped) carries no forbidden verdict copy", () => {
    for (const rel of ["components/Synastry.tsx", "components/synastry/PartnerJourney.tsx"]) {
      const src = stripComments(readFileSync(join(SRC_ROOT, rel), "utf8"));
      const hit = src.match(PAIR_FORBIDDEN);
      expect(hit, `Verbotenes Verdict-Wort "${hit?.[0]}" in ${rel}`).toBeNull();
    }
  });
});
