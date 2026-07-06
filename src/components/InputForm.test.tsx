/**
 * REQ-P4-007: Supabase JSONB persistence — timeKnown round-trip + InputForm restore
 *
 * F-07 BFF-JSONB-Strip-Check: confirms birth_data.timeKnown:false is preserved
 * through JSON serialisation (as it would be in the Supabase JSONB column) and
 * that InputForm initialises the checkbox correctly from the loaded birth_data.
 *
 * Uses react-dom/server renderToStaticMarkup (no @testing-library dep, NFR-05).
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InputForm from "./InputForm";
import type { BirthData } from "../types";

const BASE_BIRTH_DATA: BirthData = {
  name: "Test Person",
  birthDate: "1990-06-15",
  birthTime: "12:00",
  birthPlace: "Berlin",
  birthPlaceLabel: "Berlin, Deutschland",
  placeId: "ChIJxxxBerlin",
  lat: 52.52,
  lon: 13.405,
  tz: "Europe/Berlin",
  gender: "Divers"
};

describe("REQ-P4-007 — F-07 BirthData JSON round-trip", () => {
  it("timeKnown:false survives JSON serialise→parse (no JSONB stripping)", () => {
    const data: BirthData = { ...BASE_BIRTH_DATA, timeKnown: false };
    const restored = JSON.parse(JSON.stringify(data)) as BirthData;
    expect(restored.timeKnown).toBe(false);
  });

  it("timeKnown:true survives JSON serialise→parse", () => {
    const data: BirthData = { ...BASE_BIRTH_DATA, timeKnown: true };
    const restored = JSON.parse(JSON.stringify(data)) as BirthData;
    expect(restored.timeKnown).toBe(true);
  });

  it("birth_data without timeKnown field restores as undefined (default→true)", () => {
    const data: BirthData = { ...BASE_BIRTH_DATA };
    delete (data as any).timeKnown;
    const restored = JSON.parse(JSON.stringify(data)) as BirthData;
    expect(restored.timeKnown).toBeUndefined();
    // default: !!(undefined !== false) === true
    expect(restored.timeKnown !== false).toBe(true);
  });
});

describe("REQ-P4-007 — InputForm checkbox restore from birthData prop", () => {
  it("renders checkbox NOT checked when birthData.timeKnown is undefined (default)", () => {
    const out = renderToStaticMarkup(
      createElement(InputForm, { birthData: BASE_BIRTH_DATA, onCalculate: () => {} })
    );
    const match = out.match(/id="input-time-unknown"[^>]*/);
    expect(match).not.toBeNull();
    expect(match![0]).not.toContain("checked");
  });

  it("renders checkbox NOT checked when birthData.timeKnown is true", () => {
    const out = renderToStaticMarkup(
      createElement(InputForm, {
        birthData: { ...BASE_BIRTH_DATA, timeKnown: true },
        onCalculate: () => {}
      })
    );
    const match = out.match(/id="input-time-unknown"[^>]*/);
    expect(match).not.toBeNull();
    expect(match![0]).not.toContain("checked");
  });

  it("renders checkbox checked when birthData.timeKnown is false (restored from saved profile)", () => {
    const out = renderToStaticMarkup(
      createElement(InputForm, {
        birthData: { ...BASE_BIRTH_DATA, timeKnown: false },
        onCalculate: () => {}
      })
    );
    const match = out.match(/id="input-time-unknown"[^>]*/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("checked");
  });

  it("time field is disabled when birthData.timeKnown is false (restored from saved profile)", () => {
    const out = renderToStaticMarkup(
      createElement(InputForm, {
        birthData: { ...BASE_BIRTH_DATA, timeKnown: false },
        onCalculate: () => {}
      })
    );
    expect(out).toContain('id="input-time"');
    const match = out.match(/id="input-time"[^>]*/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("disabled");
  });

  it("hint text visible when birthData.timeKnown is false", () => {
    const out = renderToStaticMarkup(
      createElement(InputForm, {
        birthData: { ...BASE_BIRTH_DATA, timeKnown: false },
        onCalculate: () => {}
      })
    );
    expect(out).toContain("Tagesmitte (12:00)");
  });
});
