import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "./app";

const ORIGINAL_ENV = { ...process.env };

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

const SECTION_RESPONSES: Record<string, unknown> = {
  "/v1/calculate/western": {
    western: { sunSign: "Waage", moonSign: "Stier", ascendant: "Krebs", planets: [], aspects: [], houses: [] }
  },
  "/v1/calculate/bazi": {
    bazi: { dayMaster: "Holz", pillars: {} }
  },
  "/v1/calculate/fusion": {
    fusion: { coherenceIndex: 82 }
  }
};

function configureFuFireEnv(): void {
  process.env.FUFIRE_API_URL = "https://fufire.example.com";
  process.env.FUFIRE_API_KEY = "secret-key-123";
  process.env.REQUEST_TIMEOUT_MS = "12000";
  delete process.env.FUFIRE_API_PATH_PREFIX;
  delete process.env.FUFIRE_API_VERSION;
}

function mockFetchByPath(statusByPath: Record<string, number> = {}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string, _opts: any) => {
    const path = new URL(url).pathname;
    const status = statusByPath[path] ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => SECTION_RESPONSES[path] ?? { ok: true }
    };
  });
  global.fetch = fetchMock as any;
  return fetchMock;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  configureFuFireEnv();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("FuFirE BFF routing with real client", () => {
  it("valid western input reaches /v1/calculate/western when FUFIRE_API_VERSION is a release label", async () => {
    process.env.FUFIRE_API_VERSION = "1.0.0-rc1-20260220";
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/western").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v1/calculate/western");
  });

  it("sends the exact WesternRequest body (date/tz/lon/lat — never the chart shape)", async () => {
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/western").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
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

  it("valid bazi input reaches explicit FUFIRE_API_PATH_PREFIX /v1/calculate/bazi", async () => {
    process.env.FUFIRE_API_PATH_PREFIX = "v1";
    process.env.FUFIRE_API_VERSION = "1.0.0-rc1-20260220";
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/bazi").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v1/calculate/bazi");
  });

  it("sends the exact BaziRequest body (standard/boundary — not time_standard/day_boundary)", async () => {
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/bazi").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
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

  it("sends the exact WxRequest body to /v1/calculate/wuxing", async () => {
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/wuxing").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v1/calculate/wuxing");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error"
    });
  });

  it("valid fusion input reaches /v1/calculate/fusion with legacy FUFIRE_API_VERSION=v1", async () => {
    process.env.FUFIRE_API_VERSION = "v1";
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/fusion").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v1/calculate/fusion");
  });

  it("sends the exact FusionRequest body (bazi_pillars omitted — engine auto-computes)", async () => {
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/fusion").send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error",
      birth_time_known: true
    });
  });

  it("missing enriched location fields still returns 400 invalid_birth_input before upstream call", async () => {
    const fetchMock = mockFetchByPath();

    const res = await request(createApp()).post("/api/azodiac/western").send({ ...VALID_BODY, lat: undefined, lon: undefined, tz: undefined });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_birth_input");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mocked upstream 404 is classified as fufire_route_not_found without leaking secrets or stack traces", async () => {
    process.env.FUFIRE_API_KEY = "secret-key-123";
    const fetchMock = mockFetchByPath({ "/v1/calculate/western": 404 });

    const res = await request(createApp()).post("/api/azodiac/western").send(VALID_BODY);

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("fufire_route_not_found");
    expect(JSON.stringify(res.body)).not.toContain("secret-key-123");
    expect(JSON.stringify(res.body).toLowerCase()).not.toContain("stack");
    expect(fetchMock.mock.calls[0][0]).toBe("https://fufire.example.com/v1/calculate/western");
  });
});
