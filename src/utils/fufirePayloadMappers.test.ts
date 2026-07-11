import { describe, it, expect } from "vitest";
import type { ValidatedBirthInput } from "./birthInputValidation";
import {
  buildWesternPayload,
  buildBaziPayload,
  buildWuxingPayload,
  buildFusionPayload,
  buildTstPayload,
  buildBootstrapPayload,
  buildDailyPayload,
  buildDayunPayload,
  extractSoulprintSectors
} from "./fufirePayloadMappers";

/**
 * Per-endpoint payload contracts derived from the authoritative engine spec
 * (https://api.fufire.space/openapi.json). The /v1/calculate/* request models
 * are NOT the /chart model: they use `date` (local ISO8601 datetime) + `tz` +
 * `lat`/`lon`, while /chart uses `local_datetime` + `tz_id` + `geo_*_deg`.
 * The /v1/experience/* models wrap a BirthInput with date-only `date` and an
 * HH:MM:SS `time`. Sending the chart shape to these endpoints is a live 422.
 */

const INPUT: ValidatedBirthInput = {
  name: "Hannah Arendt",
  birthDate: "1906-10-14",
  birthTime: "21:15",
  placeId: "ChIJxyz",
  birthPlaceLabel: "Linden, Hannover",
  lat: 52.37,
  lon: 9.73,
  tz: "Europe/Berlin",
  gender: "Weiblich",
  timeKnown: true
};

describe("buildWesternPayload (WesternRequest)", () => {
  it("maps to the exact WesternRequest shape — date is a local ISO8601 datetime", () => {
    expect(buildWesternPayload(INPUT)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error",
      birth_time_known: true,
      zodiac_mode: "tropical"
    });
  });

  it("never emits chart-contract field names", () => {
    const payload = buildWesternPayload(INPUT) as unknown as Record<string, unknown>;
    for (const forbidden of ["local_datetime", "tz_id", "geo_lat_deg", "geo_lon_deg", "time_standard", "day_boundary", "include_validation"]) {
      expect(payload).not.toHaveProperty(forbidden);
    }
  });
});

describe("buildBaziPayload (BaziRequest)", () => {
  it("maps to the exact BaziRequest shape — standard/boundary, not time_standard/day_boundary", () => {
    expect(buildBaziPayload(INPUT)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      standard: "CIVIL",
      boundary: "midnight",
      ambiguousTime: "earlier",
      nonexistentTime: "error",
      birth_time_known: true
    });
  });
});

describe("buildWuxingPayload (WxRequest)", () => {
  it("maps to the exact WxRequest shape — no birth_time_known in this model", () => {
    expect(buildWuxingPayload(INPUT)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    });
  });
});

describe("buildFusionPayload (FusionRequest)", () => {
  it("maps to the exact FusionRequest shape — bazi_pillars omitted so the engine auto-computes", () => {
    expect(buildFusionPayload(INPUT)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error",
      birth_time_known: true
    });
  });
});

describe("buildTstPayload (TSTRequest)", () => {
  it("maps to the exact TSTRequest shape — lon only, no lat in this model", () => {
    expect(buildTstPayload(INPUT)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    });
  });
});

describe("buildBootstrapPayload (BootstrapRequest)", () => {
  it("wraps a BirthInput with date-only date and HH:MM:SS time", () => {
    expect(buildBootstrapPayload(INPUT)).toEqual({
      birth: {
        date: "1906-10-14",
        time: "21:15:00",
        tz: "Europe/Berlin",
        lat: 52.37,
        lon: 9.73,
        place_label: "Linden, Hannover",
        birth_time_known: true
      },
      locale: "de-DE"
    });
  });

  it("sends place_label null when no label was provided", () => {
    const payload = buildBootstrapPayload({ ...INPUT, birthPlaceLabel: "" });
    expect(payload.birth.place_label).toBeNull();
  });
});

describe("buildDailyPayload (DailyRequest)", () => {
  const SECTORS = [0.5, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8, 0.1, 0.55, 0.35, 0.65, 0.45];

  it("requires birth + 12 soulprint sectors + 12 quiz sectors + target_date", () => {
    const payload = buildDailyPayload(INPUT, SECTORS, "2026-06-10");
    expect(payload).toEqual({
      birth: {
        date: "1906-10-14",
        time: "21:15:00",
        tz: "Europe/Berlin",
        lat: 52.37,
        lon: 9.73,
        place_label: "Linden, Hannover",
        birth_time_known: true
      },
      soulprint_sectors: SECTORS,
      // The app has no quiz feature; the soulprint is the only honest sector
      // signal available, so it is mirrored into the required quiz_sectors.
      quiz_sectors: SECTORS,
      target_date: "2026-06-10",
      locale: "de-DE"
    });
  });

  it("defaults target_date to today's YYYY-MM-DD", () => {
    const payload = buildDailyPayload(INPUT, SECTORS);
    expect(payload.target_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// REQ-P4-003: timeKnown:false must propagate birth_time_known:false through all 4 mappers
const INPUT_UNKNOWN_TIME: ValidatedBirthInput = {
  ...INPUT,
  birthTime: "12:00",
  timeKnown: false
};

describe("birth_time_known propagation — timeKnown:false", () => {
  it("buildWesternPayload: birth_time_known:false when timeKnown:false", () => {
    expect(buildWesternPayload(INPUT_UNKNOWN_TIME).birth_time_known).toBe(false);
  });

  it("buildBaziPayload: birth_time_known:false when timeKnown:false", () => {
    expect(buildBaziPayload(INPUT_UNKNOWN_TIME).birth_time_known).toBe(false);
  });

  it("buildFusionPayload: birth_time_known:false when timeKnown:false", () => {
    expect(buildFusionPayload(INPUT_UNKNOWN_TIME).birth_time_known).toBe(false);
  });

  it("buildBootstrapPayload: birth_time_known:false in birth sub-object when timeKnown:false", () => {
    expect(buildBootstrapPayload(INPUT_UNKNOWN_TIME).birth.birth_time_known).toBe(false);
  });

  it("buildDailyPayload: birth_time_known:false in birth sub-object when timeKnown:false", () => {
    const SECTORS = [0.5, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8, 0.1, 0.55, 0.35, 0.65, 0.45];
    expect(buildDailyPayload(INPUT_UNKNOWN_TIME, SECTORS).birth.birth_time_known).toBe(false);
  });

  it("timeKnown:true (default) still maps birth_time_known:true — no regression", () => {
    expect(buildWesternPayload({ ...INPUT, timeKnown: true }).birth_time_known).toBe(true);
    expect(buildBaziPayload({ ...INPUT, timeKnown: true }).birth_time_known).toBe(true);
    expect(buildFusionPayload({ ...INPUT, timeKnown: true }).birth_time_known).toBe(true);
    expect(buildBootstrapPayload({ ...INPUT, timeKnown: true }).birth.birth_time_known).toBe(true);
  });

  it("INPUT without timeKnown defaults to birth_time_known:true (backward compat)", () => {
    expect(buildWesternPayload(INPUT).birth_time_known).toBe(true);
  });
});

describe("buildDayunPayload", () => {
  const base = {
    name: "X", birthDate: "1985-06-15", birthTime: "14:30",
    placeId: "p", birthPlaceLabel: "Berlin", lat: 52.52, lon: 13.405,
    tz: "Europe/Berlin", gender: "Männlich", timeKnown: true,
  } as ValidatedBirthInput;

  it("baut das live-verifizierte Dayun-Schema (sex_at_birth aus Gender)", () => {
    expect(buildDayunPayload(base)).toEqual({
      date: "1985-06-15T14:30",
      tz: "Europe/Berlin",
      lat: 52.52,
      lon: 13.405,
      sex_at_birth: "male",
      direction_method: "year_stem_yinyang_and_sex",
    });
    expect(buildDayunPayload({ ...base, gender: "Weiblich" })!.sex_at_birth).toBe("female");
  });

  it("gibt für Divers/unbekannt ehrlich null zurück (Laufrichtung nicht ableitbar, 422 upstream)", () => {
    expect(buildDayunPayload({ ...base, gender: "Divers" })).toBeNull();
    expect(buildDayunPayload({ ...base, gender: "" })).toBeNull();
  });
});

describe("extractSoulprintSectors", () => {
  const SECTORS = [0.5, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8, 0.1, 0.55, 0.35, 0.65, 0.45];

  it("returns the 12-sector array from a BootstrapResponse", () => {
    expect(extractSoulprintSectors({ soulprint_sectors: SECTORS })).toEqual(SECTORS);
  });

  it("returns null for a missing/short/non-numeric sector array (no fabrication)", () => {
    expect(extractSoulprintSectors({})).toBeNull();
    expect(extractSoulprintSectors({ soulprint_sectors: [0.1, 0.2] })).toBeNull();
    expect(extractSoulprintSectors({ soulprint_sectors: Array(12).fill("x") })).toBeNull();
    expect(extractSoulprintSectors(null)).toBeNull();
  });
});
