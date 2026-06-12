import { describe, it, expect } from "vitest";
import { validateBirthInput } from "./birthInputValidation";

const VALID = {
  name: "Hannah Arendt",
  birthDate: "1906-10-14",
  birthTime: "21:15",
  placeId: "ChIJ2V-RNo9SkFMRAL6clg6IPvs",
  lat: 52.37,
  lon: 9.73,
  tz: "Europe/Berlin"
};

function fieldsOf(errors: { field: string }[]) {
  return errors.map((e) => e.field);
}

describe("validateBirthInput", () => {
  it("accepts a fully valid input", () => {
    const result = validateBirthInput(VALID);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.value?.lat).toBe(52.37);
    expect(result.value?.tz).toBe("Europe/Berlin");
  });

  it("rejects too short and too long names", () => {
    expect(validateBirthInput({ ...VALID, name: "A" }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, name: "x".repeat(81) }).valid).toBe(false);
    expect(fieldsOf(validateBirthInput({ ...VALID, name: "A" }).errors)).toContain("name");
  });

  it("rejects barred demo / reference names case-insensitively", () => {
    for (const name of ["Benjamin Pörsch", "benjamin poersch", "Goethe", "Johann Wolfgang von Goethe", "Marie Curie"]) {
      const r = validateBirthInput({ ...VALID, name });
      expect(r.valid).toBe(false);
      expect(fieldsOf(r.errors)).toContain("name");
    }
  });

  it("rejects missing or malformed date", () => {
    expect(validateBirthInput({ ...VALID, birthDate: "" }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, birthDate: "14.10.1906" }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, birthDate: "1906-13-40" }).valid).toBe(false);
  });

  it("rejects a future birth date", () => {
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const r = validateBirthInput({ ...VALID, birthDate: future });
    expect(r.valid).toBe(false);
    expect(fieldsOf(r.errors)).toContain("birthDate");
  });

  it("rejects malformed time (not HH:mm)", () => {
    expect(validateBirthInput({ ...VALID, birthTime: "9am" }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, birthTime: "25:00" }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, birthTime: "12:60" }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, birthTime: "21:15" }).valid).toBe(true);
  });

  it("requires placeId, lat, lon, tz", () => {
    expect(fieldsOf(validateBirthInput({ ...VALID, placeId: "" }).errors)).toContain("placeId");
    expect(fieldsOf(validateBirthInput({ ...VALID, lat: undefined as any }).errors)).toContain("lat");
    expect(fieldsOf(validateBirthInput({ ...VALID, lon: undefined as any }).errors)).toContain("lon");
    expect(fieldsOf(validateBirthInput({ ...VALID, tz: "" }).errors)).toContain("tz");
  });

  it("rejects out-of-range coordinates", () => {
    expect(validateBirthInput({ ...VALID, lat: 91 }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, lat: -91 }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, lon: 181 }).valid).toBe(false);
    expect(validateBirthInput({ ...VALID, lon: -181 }).valid).toBe(false);
  });

  it("rejects fake 0/0 coordinates as a missing-location signal", () => {
    const r = validateBirthInput({ ...VALID, lat: 0, lon: 0 });
    expect(r.valid).toBe(false);
  });

  it("rejects a non-IANA timezone", () => {
    const r = validateBirthInput({ ...VALID, tz: "GMT+1" });
    expect(r.valid).toBe(false);
    expect(fieldsOf(r.errors)).toContain("tz");
  });

  it("accumulates multiple field errors", () => {
    const r = validateBirthInput({ name: "", birthDate: "", birthTime: "", placeId: "", lat: 999, lon: 999, tz: "" });
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(5);
  });
});

// REQ-P4-002: timeKnown:false mode
describe("validateBirthInput — timeKnown:false mode", () => {
  it("accepts missing birthTime when timeKnown:false, defaults to 12:00", () => {
    const r = validateBirthInput({ ...VALID, birthTime: undefined, timeKnown: false });
    expect(r.valid).toBe(true);
    expect(r.value?.birthTime).toBe("12:00");
    expect(r.value?.timeKnown).toBe(false);
  });

  it("accepts empty birthTime string when timeKnown:false, defaults to 12:00", () => {
    const r = validateBirthInput({ ...VALID, birthTime: "", timeKnown: false });
    expect(r.valid).toBe(true);
    expect(r.value?.birthTime).toBe("12:00");
    expect(r.value?.timeKnown).toBe(false);
  });

  it("accepts provided birthTime when timeKnown:false, preserves it but keeps flag false", () => {
    const r = validateBirthInput({ ...VALID, birthTime: "14:30", timeKnown: false });
    expect(r.valid).toBe(true);
    expect(r.value?.birthTime).toBe("14:30");
    expect(r.value?.timeKnown).toBe(false);
  });

  it("rejects missing birthTime when timeKnown:true (existing behavior unchanged)", () => {
    const r = validateBirthInput({ ...VALID, birthTime: undefined, timeKnown: true });
    expect(r.valid).toBe(false);
    expect(fieldsOf(r.errors)).toContain("birthTime");
  });

  it("passes timeKnown:true through in valid result", () => {
    const r = validateBirthInput({ ...VALID, timeKnown: true });
    expect(r.valid).toBe(true);
    expect(r.value?.timeKnown).toBe(true);
  });

  it("defaults timeKnown to true when not provided (backward compat)", () => {
    const r = validateBirthInput(VALID);
    expect(r.valid).toBe(true);
    expect(r.value?.timeKnown).not.toBe(false);
  });
});
