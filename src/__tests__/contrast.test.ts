import { describe, it, expect } from "vitest";
import { contrastRatio } from "../utils/visual/contrast";

// RD-6 (council/Phase-7): the redesign's text-on-dark palette must meet WCAG AA.
// Dark obsidian background is the worst case for the gold/blue/stone text tokens.
const OBSIDIAN = "#050505"; // --color-obsidian-deep (dark theme page bg)

// Approved redesign text colors actually used in the landing/design components.
const APPROVED = [
  { fg: "#d6d3d1", label: "stone-300 (body)", min: 4.5 },
  { fg: "#a8a29e", label: "stone-400 (small mono footnotes — the compliant choice)", min: 4.5 },
  { fg: "#F5E6C4", label: "gold-light (headings)", min: 4.5 },
  { fg: "#D4AF37", label: "gold-muted (eyebrows/labels)", min: 4.5 },
  { fg: "#27c8ee", label: "fusion-blue (markers/badges; /80 variant ≈6.7:1 still ≥4.5)", min: 4.5 },
];

describe("redesign WCAG AA contrast (RD-6)", () => {
  for (const p of APPROVED) {
    it(`${p.label} on obsidian meets AA ${p.min}:1`, () => {
      expect(contrastRatio(p.fg, OBSIDIAN)).toBeGreaterThanOrEqual(p.min);
    });
  }

  it("CTA dark text on gold-muted button meets AA", () => {
    expect(contrastRatio("#0c0a09", "#D4AF37")).toBeGreaterThanOrEqual(4.5); // stone-950 on gold
  });

  it("RATIONALE: stone-500 is BELOW AA on obsidian → banned for small text (use stone-400)", () => {
    // ~4.25:1 — documents why the 4 small-mono footnotes were bumped 500→400.
    expect(contrastRatio("#78716c", OBSIDIAN)).toBeLessThan(4.5);
  });
});
