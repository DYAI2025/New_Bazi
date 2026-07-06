/**
 * REQ-P4-005: TimeDependencyNote — tone constraints + structural assertions
 * Uses react-dom/server renderToStaticMarkup (no @testing-library dep needed).
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TimeDependencyNote } from "./TimeDependencyNote";

function html(missingFields: string[], workingFields?: string[], variant?: "full" | "inline") {
  return renderToStaticMarkup(
    createElement(TimeDependencyNote, { missingFields, workingFields, variant })
  );
}

const FORBIDDEN = ["coaching", "therapie", "diagnose", "du bist", "achtung", "warnung", "leider", "unvollständig"];

describe("TimeDependencyNote (REQ-P4-005)", () => {
  it("full variant renders working-fields statement and missing reason", () => {
    const out = html(["Aszendent", "Häuser"]);
    expect(out).toContain("vollständig");
    expect(out).toContain("Aszendent");
    expect(out).toContain("Häuser");
    expect(out).toContain("erfordern");
    expect(out).toContain("Geburtszeit");
  });

  it("default workingFields mentions Tagessäulen, Planetenzeichen, Wu-Xing", () => {
    const out = html(["Aszendent"]);
    expect(out).toContain("Tagessäulen");
    expect(out).toContain("Planetenzeichen");
    expect(out).toContain("Wu-Xing");
  });

  it("uses singular conjugation for single missing field", () => {
    const out = html(["Stundensäule"]);
    expect(out).toContain("erfordert");
    expect(out).not.toContain("erfordern");
  });

  it("uses plural conjugation for multiple missing fields", () => {
    const out = html(["Aszendent", "Häuser"]);
    expect(out).toContain("erfordern");
  });

  it("inline variant renders compact form with 'Zeit unbekannt'", () => {
    const out = html(["Stundensäule"], undefined, "inline");
    expect(out).toContain("Zeit unbekannt");
    expect(out).toContain("inline");
    expect(out).toContain("Stundensäule");
  });

  it("respects custom workingFields", () => {
    const out = html(["Aszendent"], ["Tagessäulen", "Planeten"]);
    expect(out).toContain("Tagessäulen");
    expect(out).toContain("Planeten");
  });

  it("NFR-03: no forbidden words in full variant", () => {
    const out = html(["Aszendent", "Häuser", "Stundensäule"]).toLowerCase();
    for (const word of FORBIDDEN) {
      expect(out, `Found forbidden word: "${word}"`).not.toContain(word);
    }
  });

  it("NFR-03: no forbidden words in inline variant", () => {
    const out = html(["Stundensäule"], undefined, "inline").toLowerCase();
    for (const word of FORBIDDEN) {
      expect(out, `Found forbidden word: "${word}"`).not.toContain(word);
    }
  });

  it("NFR-03: no exclamation marks", () => {
    expect(html(["Aszendent"])).not.toContain("!");
    expect(html(["Stundensäule"], undefined, "inline")).not.toContain("!");
  });

  it("full variant has role=note for accessibility", () => {
    const out = html(["Aszendent"]);
    expect(out).toContain('role="note"');
  });
});
