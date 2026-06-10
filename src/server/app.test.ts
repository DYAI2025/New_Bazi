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
  it("uses experience bootstrap + daily and never builds local prose", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({ ok: true });
    (FuFirEClient.postExperienceDaily as any).mockResolvedValue({
      qiResonance: 64,
      dominantPhase: "Wasser",
      coachingKeyword: "Fluss",
      description: "Von FuFirE geliefert."
    });
    const res = await request(app).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(FuFirEClient.postExperienceBootstrap).toHaveBeenCalled();
    expect(FuFirEClient.postExperienceDaily).toHaveBeenCalled();
    expect(res.body.source).toBe("fufire");
    expect(res.body.qiResonance).toBe(64);
  });

  it("treats a daily payload without description as missing", async () => {
    (FuFirEClient.postExperienceBootstrap as any).mockResolvedValue({});
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
