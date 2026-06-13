import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = /coaching|therapie|diagnose/i;

describe("Wording-Ehrlichkeit (B-001)", () => {
  // Scan SHIPPED component source only. Test files (*.test.tsx) legitimately list the
  // forbidden words to assert their ABSENCE from component output (e.g.
  // TimeDependencyNote.test.tsx NFR-03), so including them produces false positives.
  const isComponentSource = (f: string) => f.endsWith(".tsx") && !f.endsWith(".test.tsx");
  const files = readdirSync(__dirname).filter(isComponentSource);

  it("findet Komponenten-Dateien", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    it(`${file} enthält kein Coaching/Therapie/Diagnose-Vokabular`, () => {
      const src = readFileSync(join(__dirname, file), "utf8");
      const hit = src.match(FORBIDDEN);
      expect(hit, `Verbotenes Wort "${hit?.[0]}" in ${file}`).toBeNull();
    });
  }

  it("WuXingDetail trägt 'Alltagsimpuls' + reflectionText statt Coaching-Vektor", () => {
    const src = readFileSync(join(__dirname, "WuXingDetail.tsx"), "utf8");
    expect(src).toContain("Alltagsimpuls");
    expect(src).toContain("reflectionText");
    expect(src).not.toContain("coachingText");
  });
});
