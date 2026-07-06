/**
 * End-to-end BFF regression tests with the REAL FuFirE response fixtures
 * (verbatim live captures, see src/__fixtures__/fufire/). This is the direct
 * proof that the prod 500 — POST /api/azodiac/profile ->
 * {"error":"internal_error","message":"rawPlanets.map is not a function"} —
 * is fixed: the exact upstream bodies that triggered it now flow through the
 * exact production route code.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "./app";

import chartFixture from "../__fixtures__/fufire/chart.json";
import westernFixture from "../__fixtures__/fufire/western.json";
import baziFixture from "../__fixtures__/fufire/bazi.json";
import wuxingFixture from "../__fixtures__/fufire/wuxing.json";
import fusionFixture from "../__fixtures__/fufire/fusion.json";
import bootstrapFixture from "../__fixtures__/fufire/bootstrap.json";
import dailyFixture from "../__fixtures__/fufire/daily.json";

const ORIGINAL_ENV = { ...process.env };

const VALID_BODY = {
  name: "Live Smoke",
  birthDate: "1990-06-15",
  birthTime: "14:30",
  placeId: "live-smoke-berlin",
  birthPlaceLabel: "Berlin",
  lat: 52.52,
  lon: 13.405,
  tz: "Europe/Berlin",
  gender: "Divers"
};

const REAL_RESPONSES: Record<string, unknown> = {
  "/chart": chartFixture,
  "/v1/calculate/western": westernFixture,
  "/v1/calculate/bazi": baziFixture,
  "/v1/calculate/wuxing": wuxingFixture,
  "/v1/calculate/fusion": fusionFixture,
  "/v1/experience/bootstrap": bootstrapFixture,
  "/v1/experience/daily": dailyFixture
};

function mockFetchWithRealFixtures(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string, _opts: any) => {
    const path = new URL(url).pathname;
    const body = REAL_RESPONSES[path];
    return {
      ok: Boolean(body),
      status: body ? 200 : 404,
      json: async () => body ?? { detail: "not found" }
    };
  });
  global.fetch = fetchMock as any;
  return fetchMock;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.FUFIRE_API_URL = "https://fufire.example.com";
  process.env.FUFIRE_API_KEY = "secret-key-123";
  delete process.env.FUFIRE_API_PATH_PREFIX;
  delete process.env.FUFIRE_API_VERSION;
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("POST /api/azodiac/profile with REAL engine responses", () => {
  it("returns 200 (regression: rawPlanets.map is not a function -> 500)", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
  });

  it("delivers a fully populated view model from the real shapes", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.western.sunSign).toBe("Zwillinge");
    expect(res.body.western.moonSign).toBe("Fische");
    expect(res.body.western.ascendant).toBe("Waage");
    expect(res.body.western.planets.length).toBeGreaterThanOrEqual(10);
    expect(res.body.bazi.available).toBe(true);
    expect(res.body.bazi.dayMaster.element).toBe("Metall");
    expect(res.body.wuxing.available).toBe(true);
    // CALIBRATED coherence (calibration.h_calibrated 0.6144), not raw 0.908.
    expect(res.body.fusion.coherenceIndex).toBeCloseTo(61.4, 1);
    expect(res.body.fusion.coherenceCalibrated).toBe(true);
    expect(res.body.source).toBe("fufire-orchestrated");
  });
});

describe("detail endpoints with REAL engine responses", () => {
  it("POST /api/azodiac/western returns mapped planets from the bodies object", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/western").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.western.sunSign).toBe("Zwillinge");
    expect(res.body.western.planets.length).toBeGreaterThanOrEqual(10);
  });

  it("POST /api/azodiac/bazi resolves German pillar keys (stamm/zweig/tier)", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/bazi").send(VALID_BODY);
    expect(res.status).toBe(200);
    const day = res.body.bazi.pillars.find((p: any) => p.pillarKey === "Tag");
    expect(day.stemChinese).toBe("辛");
    expect(day.branchAnimal).toBe("Schwein");
  });

  it("POST /api/azodiac/wuxing converts the 0..1 vector into percentage shares", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/wuxing").send(VALID_BODY);
    expect(res.status).toBe(200);
    const dist = res.body.wuxing.distribution;
    const sum = (Object.values(dist) as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 0);
  });

  it("POST /api/azodiac/fusion maps the CALIBRATED harmony into the 0..100 coherence index", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/fusion").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.fusion.coherenceIndex).toBeCloseTo(61.4, 1);
    expect(res.body.fusion.coherenceCalibrated).toBe(true);
    expect(res.body.fusion.coherenceRating).toBe("Überdurchschnittliche Kongruenz");
  });
});

describe("POST /api/azodiac/daily with REAL bootstrap + daily responses", () => {
  it("returns the fusion synthesis as the daily description", async () => {
    mockFetchWithRealFixtures();
    const res = await request(createApp()).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.source).toBe("fufire");
    expect(res.body.description).toBe((dailyFixture as any).fusion.synthesis);
    expect(res.body.date).toBe((dailyFixture as any).date);
  });

  it("delivers the FULL daily content: west/ost cards, fusion, action, push, context notes", async () => {
    mockFetchWithRealFixtures();
    const fx = dailyFixture as any;
    const res = await request(createApp()).post("/api/azodiac/daily").send(VALID_BODY);
    expect(res.status).toBe(200);

    // West card — everything the engine sends, nothing invented.
    expect(res.body.western).toEqual({
      summary: fx.western.summary,
      themes: fx.western.themes,
      caution: fx.western.caution,
      opportunity: fx.western.opportunity
    });

    // Ost card incl. the day-master daily reference from evidence.
    expect(res.body.eastern).toEqual({
      summary: fx.eastern.summary,
      themes: fx.eastern.themes,
      caution: fx.eastern.caution,
      opportunity: fx.eastern.opportunity,
      dayMaster: fx.eastern.evidence.day_master,
      dailyPillar: fx.eastern.evidence.daily_pillar,
      relationToDayMaster: fx.eastern.evidence.relation_to_day_master,
      jieqi: fx.eastern.evidence.jieqi
    });

    // Fusion card + the action as its own Impuls block.
    expect(res.body.fusion).toEqual({ summary: fx.fusion.summary, synthesis: fx.fusion.synthesis });
    expect(res.body.action).toBe(fx.fusion.action);

    // Push groundwork + context notes.
    expect(res.body.pushText).toBe(fx.fusion.push_text);
    expect(res.body.pushworthy).toBe(fx.fusion.pushworthy);
    expect(res.body.jieqiNote).toBe(fx.fusion.jieqi_note);
    expect(res.body.weekdayNote).toBe(fx.fusion.weekday_note);

    // The ghost metrics never existed in the engine response — gone from the VM.
    expect(res.body).not.toHaveProperty("qiResonance");
    expect(res.body).not.toHaveProperty("dominantPhase");
    expect(res.body).not.toHaveProperty("coachingKeyword");
  });
});
