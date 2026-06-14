import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BOUNDARIES,
  METHOD_LAYERS,
  MISSING_BEHAVIOR,
  PREMIUM_POINTS,
  PREMIUM_NOTE,
  FUSION_PATH_NOTE,
} from "../components/landing/trustContent";

// RD-5 (council R4): the redesign adds a lot of copy under a "premium" framing. Guard it.
// Two distinct checks:
//  (1) NON-boundary copy + landing component chrome carry NO positive reification claim.
//  (2) the boundaries DO name what Bazodiac refuses (they are negations, exempt from (1)).
const POSITIVE_FORBIDDEN =
  /\bdu bist\b|\bdu wirst\b|\bbeweist\b|\bgarantiert\b|perfekt kompatibel|\bheilt\b|\bdiagnostiziert\b|dein schicksal|\bvorbestimmt\b|\bwahres ich\b|metaphysisch|kollationiert/i;

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const LANDING_DIR = join(__dirname, "..", "components", "landing");

describe("redesign wording (RD-5) — anti-reification", () => {
  it("non-boundary content carries no positive reification claim", () => {
    const blobs = [...METHOD_LAYERS.flatMap((m) => [m.title, m.text]), MISSING_BEHAVIOR, ...PREMIUM_POINTS, PREMIUM_NOTE, FUSION_PATH_NOTE];
    for (const b of blobs) {
      expect(b, b).not.toMatch(POSITIVE_FORBIDDEN);
    }
  });

  it("all landing component chrome (comment-stripped) carries no positive reification claim", () => {
    const files = readdirSync(LANDING_DIR).filter((f) => f.endsWith(".tsx"));
    expect(files.length).toBeGreaterThan(3);
    for (const f of files) {
      const src = stripComments(readFileSync(join(LANDING_DIR, f), "utf8"));
      const hit = src.match(POSITIVE_FORBIDDEN);
      expect(hit, `forbidden "${hit?.[0]}" in landing/${f}`).toBeNull();
    }
  });

  it("the four boundaries explicitly name what Bazodiac does NOT do", () => {
    expect(BOUNDARIES).toHaveLength(4);
    const all = BOUNDARIES.map((b) => `${b.title} ${b.text}`).join(" ");
    expect(all).toMatch(/Diagnose/i);
    expect(all).toMatch(/Zukunft|Schicksal/i);
    expect(all).toMatch(/Therapie/i);
    expect(all).toMatch(/beweist keine|keine feste Identität|Eigenschaft/i);
  });

  it("the app shell (now default-reachable behind the landing) carries no surviving mystique copy (council R4)", () => {
    const SHELL_MYSTIQUE = /transcendent|\bluxury\b|harmony engine|kosmisches spektrum|planetengrid|metaphysisch|\bseele\b|wahres ich|\bschicksal\b/i;
    for (const rel of ["PageShell.tsx", "InputForm.tsx"]) {
      const src = stripComments(readFileSync(join(__dirname, "..", "components", rel), "utf8"));
      const hit = src.match(SHELL_MYSTIQUE);
      expect(hit, `surviving mystique "${hit?.[0]}" in components/${rel}`).toBeNull();
    }
  });
});
