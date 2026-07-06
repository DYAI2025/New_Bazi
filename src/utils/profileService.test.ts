import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ValidatedBirthInput } from "./birthInputValidation";

// Mock the upstream client so the service is tested in isolation.
vi.mock("./fufireClient", () => {
  return {
    FuFirEClient: {
      postChart: vi.fn(),
      postWestern: vi.fn(),
      postBazi: vi.fn(),
      postWuxing: vi.fn(),
      postFusion: vi.fn(),
      postTst: vi.fn(),
      getWuxingMapping: vi.fn()
    }
  };
});

import { FuFirEClient } from "./fufireClient";
import { buildFuFirEPayload, buildProfile, buildLocalFallbackProfile } from "./profileService";

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

const FULL_CHART = {
  western: { sunSign: "Waage", moonSign: "Stier", ascendant: "Krebs", planets: [], aspects: [], houses: [] },
  bazi: { dayMaster: "Holz", pillars: {} },
  wuxing: { wu_xing_vector: { Holz: 30, Feuer: 10, Erde: 20, Metall: 10, Wasser: 30 } },
  fusion: { coherenceIndex: 82 }
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildFuFirEPayload", () => {
  it("maps validated input to the FuFirE chart contract", () => {
    const payload = buildFuFirEPayload(INPUT);
    expect(payload.local_datetime).toBe("1906-10-14T21:15:00");
    expect(payload.tz_id).toBe("Europe/Berlin");
    expect(payload.geo_lat_deg).toBe(52.37);
    expect(payload.geo_lon_deg).toBe(9.73);
    expect(payload.include_validation).toBe(true);
  });
});

describe("buildProfile", () => {
  it("uses /chart and reports source=fufire-chart when chart is complete", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue(FULL_CHART);

    const result = await buildProfile(INPUT);

    expect(FuFirEClient.postChart).toHaveBeenCalledTimes(1);
    expect(FuFirEClient.postWestern).not.toHaveBeenCalled();
    expect(FuFirEClient.postBazi).not.toHaveBeenCalled();
    expect(result.source).toBe("fufire-chart");
    expect(result.viewModel.source).toBe("fufire-chart");
    expect(result.viewModel.western.sunSign).toBe("Waage");
  });

  it("orchestrates calculate/* for missing sections and reports source=fufire-orchestrated", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue({ western: FULL_CHART.western }); // bazi + wuxing missing
    (FuFirEClient.postBazi as any).mockResolvedValue({ dayMaster: "Wasser", pillars: {} });
    (FuFirEClient.postWuxing as any).mockResolvedValue({ wu_xing_vector: { Holz: 10, Feuer: 10, Erde: 20, Metall: 30, Wasser: 30 } });
    (FuFirEClient.postFusion as any).mockResolvedValue({ coherenceIndex: 71 });

    const result = await buildProfile(INPUT);

    expect(FuFirEClient.postBazi).toHaveBeenCalledTimes(1);
    expect(FuFirEClient.postWuxing).toHaveBeenCalledTimes(1);
    expect(FuFirEClient.postWestern).not.toHaveBeenCalled(); // western already present in chart
    expect(result.source).toBe("fufire-orchestrated");
    expect(result.viewModel.source).toBe("fufire-orchestrated");
  });

  it("orchestrates with the ENDPOINT-SPECIFIC request models, never the chart shape", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue({}); // everything missing
    (FuFirEClient.postWestern as any).mockResolvedValue({});
    (FuFirEClient.postBazi as any).mockResolvedValue({});
    (FuFirEClient.postWuxing as any).mockResolvedValue({});
    (FuFirEClient.postFusion as any).mockResolvedValue({});

    await buildProfile(INPUT);

    // /chart keeps the chart contract.
    expect((FuFirEClient.postChart as any).mock.calls[0][0]).toMatchObject({
      local_datetime: "1906-10-14T21:15:00",
      tz_id: "Europe/Berlin"
    });
    // /v1/calculate/* get their own request models (date/tz/lon/lat).
    expect((FuFirEClient.postWestern as any).mock.calls[0][0]).toEqual({
      date: "1906-10-14T21:15:00",
      tz: "Europe/Berlin",
      lat: 52.37,
      lon: 9.73,
      ambiguousTime: "earlier",
      nonexistentTime: "error",
      birth_time_known: true,
      zodiac_mode: "tropical"
    });
    expect((FuFirEClient.postBazi as any).mock.calls[0][0]).toMatchObject({
      date: "1906-10-14T21:15:00",
      standard: "CIVIL",
      boundary: "midnight"
    });
    for (const method of [FuFirEClient.postWestern, FuFirEClient.postBazi, FuFirEClient.postWuxing, FuFirEClient.postFusion]) {
      const sent = (method as any).mock.calls[0][0];
      expect(sent).not.toHaveProperty("local_datetime");
      expect(sent).not.toHaveProperty("tz_id");
      expect(sent).not.toHaveProperty("geo_lat_deg");
      expect(sent).not.toHaveProperty("geo_lon_deg");
    }
  });

  it("propagates upstream FuFirEError instead of falling back silently", async () => {
    const err: any = new Error("auth");
    err.code = "fufire_auth_failed";
    err.httpStatus = 502;
    (FuFirEClient.postChart as any).mockRejectedValue(err);

    await expect(buildProfile(INPUT)).rejects.toMatchObject({ code: "fufire_auth_failed" });
  });
});

describe("buildLocalFallbackProfile", () => {
  it("marks every section fallback-local and source=fallback-local", () => {
    const result = buildLocalFallbackProfile(INPUT);
    expect(result.source).toBe("fallback-local");
    expect(result.viewModel.source).toBe("fallback-local");
    for (const prov of result.viewModel.provenance) {
      expect(prov.status).toBe("fallback-local");
      expect(prov.source).toBe("fallback-local");
    }
  });
});
