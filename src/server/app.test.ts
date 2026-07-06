import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

vi.mock("../utils/fufireClient", () => {
  class FuFirEError extends Error {
    code: string;
    httpStatus: number;
    constructor(code: string, httpStatus = 502) {
      super(code);
      this.code = code;
      this.httpStatus = httpStatus;
    }
  }
  return {
    FuFirEError,
    FuFirEClient: {
      postChart: vi.fn(),
      postWestern: vi.fn(),
      postBazi: vi.fn(),
      postWuxing: vi.fn(),
      postFusion: vi.fn(),
      postTst: vi.fn(),
      getWuxingMapping: vi.fn(),
      getHealth: vi.fn(),
      postExperienceBootstrap: vi.fn(),
      postExperienceDaily: vi.fn(),
      probeHealth: vi.fn(async () => "ok"),
      isConfigured: vi.fn(() => ({ url: true, key: true })),
      getPathPrefix: vi.fn(() => "v1"),
      getReleaseVersion: vi.fn(() => null)
    }
  };
});

vi.mock("../utils/mapsService", () => {
  class PlacesError extends Error {
    code: string;
    httpStatus: number;
    constructor(code: string) {
      super(code);
      this.code = code;
      this.httpStatus = code === "missing_places_key" ? 503 : 502;
    }
  }
  return {
    PlacesError,
    getAutocompletePredictions: vi.fn(),
    getPlaceDetails: vi.fn(),
    getTimezone: vi.fn()
  };
});

import { FuFirEClient } from "../utils/fufireClient";
import { getPlaceDetails, getTimezone, getAutocompletePredictions } from "../utils/mapsService";
import { createApp } from "./app";

const app = createApp();

const VALID_BODY = {
  name: "Hannah Arendt",
  birthDate: "1906-10-14",
  birthTime: "21:15",
  placeId: "ChIJxyz",
  birthPlaceLabel: "Linden, Hannover",
  lat: 52.37,
  lon: 9.73,
  tz: "Europe/Berlin",
  gender: "Weiblich"
};

const FULL_CHART = {
  western: { sunSign: "Waage", moonSign: "Stier", ascendant: "Krebs", planets: [], aspects: [], houses: [] },
  bazi: { dayMaster: "Holz", pillars: {} },
  wuxing: { wu_xing_vector: { Holz: 30, Feuer: 10, Erde: 20, Metall: 10, Wasser: 30 } },
  fusion: { coherenceIndex: 82 }
};

const ORIGINAL_ENV = { ...process.env };
beforeEach(() => {
  vi.clearAllMocks();
  (FuFirEClient.probeHealth as any).mockResolvedValue("ok");
  (FuFirEClient.isConfigured as any).mockReturnValue({ url: true, key: true });
  (FuFirEClient.getPathPrefix as any).mockReturnValue("v1");
  (FuFirEClient.getReleaseVersion as any).mockReturnValue(null);
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("POST /api/timezone", () => {
  it("returns 400 missing_coordinates when lat/lon absent", async () => {
    const res = await request(app).post("/api/timezone").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("missing_coordinates");
    expect(getTimezone).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_coordinates for non-finite / out-of-range coords (not 502)", async () => {
    for (const body of [
      { lat: "Infinity", lon: "-Infinity" },
      { lat: "abc", lon: 13.4 },
      { lat: 91, lon: 13.4 },
      { lat: 52.5, lon: 181 },
    ]) {
      const res = await request(app).post("/api/timezone").send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_coordinates");
    }
    expect(getTimezone).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_timestamp for a non-finite timestamp", async () => {
    const res = await request(app).post("/api/timezone").send({ lat: 52.5, lon: 13.4, timestamp: "Infinity" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_timestamp");
    expect(getTimezone).not.toHaveBeenCalled();
  });

  it("forwards valid coordinates to getTimezone", async () => {
    (getTimezone as any).mockResolvedValue({ tz: "Europe/Berlin", utcOffsetMinutes: 60 });
    const res = await request(app).post("/api/timezone").send({ lat: 52.5, lon: 13.4 });
    expect(res.status).toBe(200);
    expect(res.body.tz).toBe("Europe/Berlin");
    expect(getTimezone).toHaveBeenCalledWith(52.5, 13.4, undefined);
  });
});

describe("POST /api/azodiac/profile", () => {
  it("returns 400 with field errors for invalid input", async () => {
    const res = await request(app).post("/api/azodiac/profile").send({ name: "", birthDate: "", birthTime: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_birth_input");
    expect(Array.isArray(res.body.fields)).toBe(true);
    expect(FuFirEClient.postChart).not.toHaveBeenCalled();
  });

  it("returns 200 with source fufire-chart on complete chart", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue(FULL_CHART);
    const res = await request(app).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe("fufire-chart");
    expect(res.body.western.sunSign).toBe("Waage");
  });

  it("returns 503 (no silent local) when FuFirE unconfigured and fallback disabled", async () => {
    const err: any = new Error("missing_fufire_url");
    err.code = "missing_fufire_url";
    err.httpStatus = 503;
    (FuFirEClient.postChart as any).mockRejectedValue(err);
    delete process.env.ENABLE_LOCAL_ASTROLOGY_FALLBACK;
    const res = await request(app).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(503);
    expect(res.body.error).toBe("missing_fufire_url");
  });

  it("uses labelled fallback-local only when explicitly enabled", async () => {
    const err: any = new Error("missing_fufire_url");
    err.code = "missing_fufire_url";
    err.httpStatus = 503;
    (FuFirEClient.postChart as any).mockRejectedValue(err);
    process.env.ENABLE_LOCAL_ASTROLOGY_FALLBACK = "true";
    const res = await request(app).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe("fallback-local");
  });

  it("maps upstream auth failure to 502", async () => {
    const err: any = new Error("fufire_auth_failed");
    err.code = "fufire_auth_failed";
    err.httpStatus = 502;
    (FuFirEClient.postChart as any).mockRejectedValue(err);
    const res = await request(app).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("fufire_auth_failed");
  });
});

describe("Detail endpoints", () => {
  it("POST /api/azodiac/western calls postWestern and returns source", async () => {
    (FuFirEClient.postWestern as any).mockResolvedValue({ western: FULL_CHART.western });
    const res = await request(app).post("/api/azodiac/western").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(FuFirEClient.postWestern).toHaveBeenCalledTimes(1);
    expect(res.body.source).toBe("fufire");
    expect(res.body.western.sunSign).toBe("Waage");
  });

  it("POST /api/azodiac/bazi validates input first", async () => {
    const res = await request(app).post("/api/azodiac/bazi").send({ name: "" });
    expect(res.status).toBe(400);
    expect(FuFirEClient.postBazi).not.toHaveBeenCalled();
  });
});

describe("POST /api/azodiac/daily", () => {
  const SECTORS = [0.5, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8, 0.1, 0.55, 0.35, 0.65, 0.45];

  it("uses experience bootstrap + daily and never builds local prose", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({
      description: "Von FuFirE geliefert."
    });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(FuFirEClient.postExperienceBootstrap).toHaveBeenCalled();
    expect(FuFirEClient.postExperienceDaily).toHaveBeenCalled();
    expect(res.body.source).toBe("fufire");
    expect(res.body.description).toBe("Von FuFirE geliefert.");
  });

  it("maps the FULL engine DailyResponse into the view model (no ghost metrics)", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({
      date: "2026-06-10",
      western: {
        summary: "West-Zusammenfassung.",
        themes: ["Kommunikation", "Identitaet"],
        caution: "West-Spannung.",
        opportunity: "West-Potenzial.",
        evidence: { transit_sectors: [2, 0], natal_focus: ["sun"], day_master: null, daily_pillar: null, relation_to_day_master: null, jieqi: null, weekday: "Mittwoch" },
        jieqi_note: null,
        weekday_note: "Mittwoch (Merkur)."
      },
      eastern: {
        summary: "Ost-Zusammenfassung.",
        themes: ["Ressourcen"],
        caution: "Ost-Spannung.",
        opportunity: "Ost-Chance.",
        evidence: { day_master: "Xin", daily_pillar: { stem: "Yi", branch: "Mao" }, relation_to_day_master: "wealth", jieqi: "Mangzhong", weekday: "Mittwoch" },
        jieqi_note: "Feuer-Energie steigt.",
        weekday_note: "Mittwoch (Merkur)."
      },
      fusion: {
        summary: "Fusion-Kurz.",
        synthesis: "Fusion-Synthese.",
        action: "Fusion-Impuls.",
        pushworthy: true,
        push_text: "Kurzform des Tages.",
        jieqi_note: "Solarterm faerbt beide Systeme.",
        weekday_note: "Mittwoch-Energie."
      }
    });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.source).toBe("fufire");
    expect(res.body.date).toBe("2026-06-10");
    // Three-card content
    expect(res.body.western).toEqual({
      summary: "West-Zusammenfassung.",
      themes: ["Kommunikation", "Identitaet"],
      caution: "West-Spannung.",
      opportunity: "West-Potenzial."
    });
    expect(res.body.eastern).toEqual({
      summary: "Ost-Zusammenfassung.",
      themes: ["Ressourcen"],
      caution: "Ost-Spannung.",
      opportunity: "Ost-Chance.",
      dayMaster: "Xin",
      dailyPillar: { stem: "Yi", branch: "Mao" },
      relationToDayMaster: "wealth",
      jieqi: "Mangzhong"
    });
    expect(res.body.fusion).toEqual({ summary: "Fusion-Kurz.", synthesis: "Fusion-Synthese." });
    // Action is its own field, not crammed into a keyword chip
    expect(res.body.action).toBe("Fusion-Impuls.");
    // Push groundwork
    expect(res.body.pushText).toBe("Kurzform des Tages.");
    expect(res.body.pushworthy).toBe(true);
    // Context notes
    expect(res.body.jieqiNote).toBe("Solarterm faerbt beide Systeme.");
    expect(res.body.weekdayNote).toBe("Mittwoch-Energie.");
    // Ghost metrics are gone — the engine never sends them
    expect(res.body).not.toHaveProperty("qiResonance");
    expect(res.body).not.toHaveProperty("dominantPhase");
    expect(res.body).not.toHaveProperty("coachingKeyword");
  });

  it("falls back to section notes when fusion carries no jieqi/weekday note", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({
      eastern: { summary: "Ost.", jieqi_note: "Ost-Jieqi-Note." },
      western: { summary: "West.", weekday_note: "West-Wochentag-Note." },
      fusion: { synthesis: "Synthese." }
    });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.jieqiNote).toBe("Ost-Jieqi-Note.");
    expect(res.body.weekdayNote).toBe("West-Wochentag-Note.");
  });

  it("forwards a requested targetDate to the engine DailyRequest", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({ fusion: { synthesis: "Morgen." } });
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const res = await request(app).post("/api/azodiac/daily").send({ ...VALID_BODY, targetDate: tomorrow });
    expect(res.status).toBe(200);
    const dailyPayload = (FuFirEClient.postExperienceDaily as any).mock.calls[0][0];
    expect(dailyPayload.target_date).toBe(tomorrow);
  });

  it("rejects a malformed targetDate with 400", async () => {
    const res = await request(app).post("/api/azodiac/daily").send({ ...VALID_BODY, targetDate: "10.06.2026" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_target_date");
    expect(FuFirEClient.postExperienceBootstrap).not.toHaveBeenCalled();
  });

  it("rejects a targetDate outside the ±7-day window with 400", async () => {
    const farOut = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const res = await request(app).post("/api/azodiac/daily").send({ ...VALID_BODY, targetDate: farOut });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_target_date");
    expect(FuFirEClient.postExperienceDaily).not.toHaveBeenCalled();
  });

  it("sends BirthInput-wrapped payloads (NOT the chart shape) to bootstrap and daily", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({
      fusion: { synthesis: "Echte FuFirE-Synthese.", action: "Fokus" }
    });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);

    const bootstrapPayload = (FuFirEClient.postExperienceBootstrap as any).mock.calls[0][0];
    expect(bootstrapPayload).toEqual({
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

    const dailyPayload = (FuFirEClient.postExperienceDaily as any).mock.calls[0][0];
    expect(dailyPayload.birth).toEqual(bootstrapPayload.birth);
    expect(dailyPayload.soulprint_sectors).toEqual(SECTORS);
    expect(dailyPayload.quiz_sectors).toEqual(SECTORS);
    expect(dailyPayload.target_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dailyPayload).not.toHaveProperty("local_datetime");
    expect(dailyPayload).not.toHaveProperty("tz_id");
  });

  it("maps the engine DailyResponse fusion text as the daily description", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({
      date: "2026-06-10",
      western: { summary: "..." },
      eastern: { summary: "..." },
      fusion: { summary: "Kurz.", synthesis: "Heute zaehlt Klarheit.", action: "Fokus" }
    });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.source).toBe("fufire");
    expect(res.body.description).toBe("Heute zaehlt Klarheit.");
    expect(res.body.action).toBe("Fokus");
    expect(res.body.date).toBe("2026-06-10");
  });

  it("returns 502 when bootstrap delivers no valid soulprint sectors (no fabricated ring)", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({});
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("fufire_unavailable");
    expect(FuFirEClient.postExperienceDaily).not.toHaveBeenCalled();
  });

  it("treats a daily payload without any user-facing content as missing", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ soulprint_sectors: SECTORS });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({ qiResonance: 50 });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.source).toBe("missing");
  });
});

describe("POST /api/azodiac/synastry", () => {
  it("fetches both FuFirE profiles and labels local comparison", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue(FULL_CHART);
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY,
      partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" }
    });
    expect(res.status).toBe(200);
    expect(FuFirEClient.postChart).toHaveBeenCalledTimes(2);
    expect(res.body.source).toBe("fufire-profiles-local-comparison");
    expect(typeof res.body.score).toBe("number");
    // Additive Felder existieren immer; ohne elemental_comparison ehrlich leer.
    expect(res.body.elementalA).toEqual([]);
    expect(res.body.elementalB).toEqual([]);
  });

  it("adds the P7 additive fields (interAspects/pillarComparison/comparisonA/B/pairAxes)", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue(FULL_CHART);
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY,
      partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" }
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.interAspects)).toBe(true);
    expect(Array.isArray(res.body.pillarComparison)).toBe(true);
    // FULL_CHART carries no fusion.elemental_comparison -> comparison + axes honestly empty.
    expect(res.body.comparisonA).toEqual([]);
    expect(res.body.comparisonB).toEqual([]);
    expect(res.body.pairAxes).toEqual([]);
  });

  it("derives pairAxes + comparisonA/B from the two elemental_comparison payloads (P7)", async () => {
    const withFusion = (western: number, bazi: number) => ({
      ...FULL_CHART,
      fusion: {
        harmony_index: { harmony_index: 0.9 },
        elemental_comparison: { Metall: { western, bazi, difference: western - bazi } }
      }
    });
    (FuFirEClient.postChart as any)
      .mockResolvedValueOnce(withFusion(0.6, 0.2))   // A: diff +0.4 -> Pol A (Struktur)
      .mockResolvedValueOnce(withFusion(0.1, 0.3));  // B: diff -0.2 -> Pol B (Fluss)
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY,
      partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" }
    });
    expect(res.status).toBe(200);
    expect(res.body.comparisonA).toHaveLength(1);
    expect(res.body.comparisonA[0]).toMatchObject({ element: "Metall", western: 0.6, bazi: 0.2 });
    expect(res.body.comparisonA[0].difference).toBeCloseTo(0.4, 10);
    expect(res.body.comparisonB[0].element).toBe("Metall");
    expect(res.body.comparisonB[0].difference).toBeLessThan(0);
    expect(res.body.pairAxes).toHaveLength(1);
    expect(res.body.pairAxes[0]).toMatchObject({
      id: "structure_flow", element: "Metall", mode: "reibung", leanA: "Struktur", leanB: "Fluss"
    });
  });

  it("serves both per-element distributions (elementalA/B) from the two fusion payloads", async () => {
    const withFusion = (western: number, bazi: number) => ({
      ...FULL_CHART,
      fusion: {
        harmony_index: { harmony_index: 0.9 },
        elemental_comparison: {
          Metall: { western, bazi, difference: western - bazi }
        }
      }
    });
    (FuFirEClient.postChart as any)
      .mockResolvedValueOnce(withFusion(0.6, 0.2))
      .mockResolvedValueOnce(withFusion(0.1, 0.3));
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY,
      partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" }
    });
    expect(res.status).toBe(200);
    // Personengewicht = Mittel aus West- und BaZi-Gewicht (fuseElementalWeights).
    expect(res.body.elementalA).toEqual([{ element: "Metall", weight: 0.4 }]);
    expect(res.body.elementalB).toEqual([{ element: "Metall", weight: 0.2 }]);
  });

  it("returns 400 when a partner profile is invalid", async () => {
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY,
      partnerBirthData: { name: "" }
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/azodiac/bazi/dayun", () => {
  it("returns honest missing-capability without mystical language", async () => {
    const res = await request(app).post("/api/azodiac/bazi/dayun").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.status).toBe("missing-capability");
    expect(res.body.source).toBe("missing");
    expect(res.body.message.toLowerCase()).not.toContain("kaiser");
    expect(res.body.message.toLowerCase()).not.toContain("kommende version");
  });
});

describe("Config & Health", () => {
  it("GET /api/health reports app + FuFirE health", async () => {
    (FuFirEClient.probeHealth as any).mockResolvedValue("ok");
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.fufire).toBe("ok");
  });

  it("GET /api/config exposes booleans only, never secret values", async () => {
    process.env.FUFIRE_API_KEY = "super-secret-value";
    (FuFirEClient.isConfigured as any).mockReturnValue({ url: true, key: true });
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body.fufire.baseUrlConfigured).toBe(true);
    expect(res.body.fufire.apiKeyConfigured).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain("super-secret-value");
    expect(res.body.fufire.pathPrefix).toBe("v1");
    expect(res.body.fufire.versionPrefix).toBe("v1");
    expect(Array.isArray(res.body.capabilities)).toBe(true);
  });

  it("GET /api/config separates route prefix from FuFirE release version", async () => {
    (FuFirEClient.getPathPrefix as any).mockReturnValue("v1");
    (FuFirEClient.getReleaseVersion as any).mockReturnValue("1.0.0-rc1-20260220");
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body.fufire.pathPrefix).toBe("v1");
    expect(res.body.fufire.versionPrefix).toBe("v1");
    expect(res.body.fufire.releaseVersion).toBe("1.0.0-rc1-20260220");
  });
});

describe("Places routes", () => {
  it("POST /api/places/autocomplete returns predictions", async () => {
    (getAutocompletePredictions as any).mockResolvedValue([{ description: "Berlin", placeId: "x" }]);
    const res = await request(app).post("/api/places/autocomplete").send({ input: "Ber" });
    expect(res.status).toBe(200);
    expect(res.body[0].description).toBe("Berlin");
  });

  it("maps PlacesError for unresolvable legacy placeIds to 502 places_provider_error", async () => {
    const { PlacesError } = await import("../utils/mapsService");
    (getPlaceDetails as any).mockRejectedValue(new PlacesError("places_provider_error"));
    const res = await request(app).post("/api/places/details").send({ placeId: "ChIJlegacyGoogleId" });
    expect(res.status).toBe(502);
    expect(res.body.error).toBe("places_provider_error");
  });

  it("POST /api/geocode never returns a default Munich and requires placeId", async () => {
    const res = await request(app).post("/api/geocode").send({ place: "Nowhere" });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain("München");
    expect(JSON.stringify(res.body)).not.toContain("48.13");
  });

  it("POST /api/geocode delegates to place details when placeId given", async () => {
    (getPlaceDetails as any).mockResolvedValue({ name: "Berlin", formattedAddress: "Berlin, DE", lat: 52.52, lon: 13.405 });
    (getTimezone as any).mockResolvedValue({ tz: "Europe/Berlin", utcOffsetMinutes: 120 });
    const res = await request(app).post("/api/geocode").send({ placeId: "abc" });
    expect(res.status).toBe(200);
    expect(res.body.latitude).toBe(52.52);
    expect(res.body.tz).toBe("Europe/Berlin");
  });

  it("POST /api/geocode returns tz without a now-based offset", async () => {
    (getPlaceDetails as any).mockResolvedValue({ name: "Berlin", formattedAddress: "Berlin, DE", lat: 52.52, lon: 13.405 });
    (getTimezone as any).mockResolvedValue({ tz: "Europe/Berlin", utcOffsetMinutes: 120 });
    const res = await request(app).post("/api/geocode").send({ placeId: "abc" });
    expect(res.status).toBe(200);
    expect(res.body.tz).toBe("Europe/Berlin");
    expect(res.body.utcOffsetMinutes).toBeUndefined();
  });
});
