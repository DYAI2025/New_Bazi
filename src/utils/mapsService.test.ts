import { describe, it, expect, vi, afterEach } from "vitest";
import { getAutocompletePredictions, getPlaceDetails, getTimezone, PlacesError } from "./mapsService";
import { normalizeFuFireProfile } from "./fufireNormalizer";
import { ElementType } from "../types";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A captured Photon (photon.komoot.io) response shape. */
const PHOTON_BERLIN_RESPONSE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [13.3888599, 52.5170365] },
      properties: {
        osm_id: 240109189,
        osm_type: "N",
        country: "Deutschland",
        countrycode: "DE",
        osm_key: "place",
        osm_value: "city",
        name: "Berlin",
        state: "Berlin",
        type: "city"
      }
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [10.4541194, 52.0277121] },
      properties: {
        osm_id: 62650,
        osm_type: "R",
        country: "Deutschland",
        countrycode: "DE",
        osm_key: "place",
        osm_value: "town",
        name: "Salzgitter-Bad",
        state: "Niedersachsen",
        type: "district"
      }
    }
  ]
};

function mockPhotonFetch(payload: unknown = PHOTON_BERLIN_RESPONSE) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => payload
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function asProduction() {
  process.env.NODE_ENV = "production";
  delete process.env.ENABLE_DEMO_PROFILES;
}

describe("Demo mocks (test runner / ENABLE_DEMO_PROFILES only)", () => {
  it("returns mock autocomplete entries under the test runner without network", async () => {
    const fetchMock = mockPhotonFetch();
    const results = await getAutocompletePredictions("Ber");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].description).toContain("Berlin");
    expect(results[0].placeId).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails gracefully on invalid input or empty placeId", async () => {
    const results = await getAutocompletePredictions("");
    expect(results).toEqual([]);

    await expect(getPlaceDetails("")).rejects.toThrow("Missing placeId");
  });

  it("resolves the known demo placeIds to mock details", async () => {
    const berlinId = "ChIJ2V-RNo9SkFMRAL6clg6IPvs";
    const details = await getPlaceDetails(berlinId);
    expect(details.name).toBe("Berlin");
    expect(details.lat).toBe(52.52);
    expect(details.lon).toBe(13.405);
  });

  it("allows demo mocks in non-production when ENABLE_DEMO_PROFILES=true", async () => {
    process.env.NODE_ENV = "development";
    process.env.ENABLE_DEMO_PROFILES = "true";
    const results = await getAutocompletePredictions("Ber");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].description).toBe("Berlin, Deutschland");
  });
});

describe("Autocomplete via Photon (keyless, production path)", () => {
  it("maps Photon features to predictions with self-contained pl1: placeIds", async () => {
    asProduction();
    const fetchMock = mockPhotonFetch();

    const results = await getAutocompletePredictions("Berl");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.length).toBe(2);
    // name === state → deduped, no "Berlin, Berlin, Deutschland"
    expect(results[0].description).toBe("Berlin, Deutschland");
    expect(results[1].description).toBe("Salzgitter-Bad, Niedersachsen, Deutschland");
    expect(results[0].placeId.startsWith("pl1:")).toBe(true);
  });

  it("calls Photon with the query, German language and an identifying User-Agent", async () => {
    asProduction();
    const fetchMock = mockPhotonFetch();

    await getAutocompletePredictions("Berl");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("photon.komoot.io/api/");
    expect(url).toContain("q=Berl");
    expect(url).toContain("lang=de");
    expect((init?.headers as Record<string, string>)["User-Agent"]).toContain("New_Bazi");
  });

  it("pl1: placeIds round-trip through getPlaceDetails without a network call", async () => {
    asProduction();
    const fetchMock = mockPhotonFetch();

    const [berlin] = await getAutocompletePredictions("Berl");
    fetchMock.mockClear();

    const details = await getPlaceDetails(berlin.placeId);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(details.name).toBe("Berlin");
    expect(details.formattedAddress).toBe("Berlin, Deutschland");
    expect(details.lat).toBeCloseTo(52.5170365, 5);
    expect(details.lon).toBeCloseTo(13.3888599, 5);
  });

  it("maps provider failures to places_provider_error (502) without leaking upstream details", async () => {
    asProduction();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));

    const err = await getAutocompletePredictions("Berl").catch((e) => e);
    expect(err).toBeInstanceOf(PlacesError);
    expect(err.code).toBe("places_provider_error");
    expect(err.httpStatus).toBe(502);
    expect(err.message).not.toContain("500");
    expect(err.message).not.toContain("photon");
  });

  it("works in production WITHOUT any API key (providers are keyless)", async () => {
    asProduction();
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_PLATFORM_KEY;
    mockPhotonFetch();

    const results = await getAutocompletePredictions("Berl");
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("getPlaceDetails legacy ids", () => {
  it("rejects legacy Google place-ids with places_provider_error (502)", async () => {
    asProduction();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const err = await getPlaceDetails("ChIJ2V-RNo9SkFMRAL6clg6IPvs").catch((e) => e);
    expect(err).toBeInstanceOf(PlacesError);
    expect(err.code).toBe("places_provider_error");
    expect(err.httpStatus).toBe(502);
  });

  it("rejects corrupted pl1: payloads with places_provider_error", async () => {
    asProduction();
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(getPlaceDetails("pl1:%%%not-base64%%%")).rejects.toMatchObject({ code: "places_provider_error" });
  });
});

describe("getTimezone via offline tz-lookup", () => {
  const JAN_15_2026 = Math.floor(Date.UTC(2026, 0, 15, 12, 0, 0) / 1000);
  const JUL_15_2026 = Math.floor(Date.UTC(2026, 6, 15, 12, 0, 0) / 1000);

  it("resolves Berlin to Europe/Berlin with CET offset in January", async () => {
    const tz = await getTimezone(52.52, 13.405, JAN_15_2026);
    expect(tz.tz).toBe("Europe/Berlin");
    expect(tz.utcOffsetMinutes).toBe(60);
  });

  it("resolves Berlin to Europe/Berlin with CEST offset in July", async () => {
    const tz = await getTimezone(52.52, 13.405, JUL_15_2026);
    expect(tz.tz).toBe("Europe/Berlin");
    expect(tz.utcOffsetMinutes).toBe(120);
  });

  it("resolves Tokyo with a fixed +540 offset (no DST)", async () => {
    const tz = await getTimezone(35.6762, 139.6503, JAN_15_2026);
    expect(tz.tz).toBe("Asia/Tokyo");
    expect(tz.utcOffsetMinutes).toBe(540);
  });

  it("works offline — never performs a network call", async () => {
    const fetchMock = mockPhotonFetch();
    await getTimezone(48.2082, 16.3738, JUL_15_2026);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps out-of-range coordinates to places_provider_error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(getTimezone(999, 999)).rejects.toMatchObject({ code: "places_provider_error" });
  });
});

describe("PlacesError contract", () => {
  it("places_provider_error carries httpStatus 502", () => {
    const err = new PlacesError("places_provider_error");
    expect(err.httpStatus).toBe(502);
    expect(err.code).toBe("places_provider_error");
  });

  it("missing_places_key stays typed (503) for API-doc compat, even though providers are keyless", () => {
    const err = new PlacesError("missing_places_key");
    expect(err.httpStatus).toBe(503);
    expect(err.code).toBe("missing_places_key");
  });
});

describe("FuFirE Input Normalization and Provenance Mapping", () => {
  it("should successfully normalize raw FuFirE structure to ProfileViewModel", () => {
    const rawFakeData = {
      source: "Berechnet von FuFirE",
      western: {
        sunSign: "Widder",
        moonSign: "Waage",
        ascendant: "Steinbock",
        planets: [
          { name: "Sonne", sign: "Widder", house: 1, degree: 14.5, retrograde: false }
        ],
        aspects: [
          { planet1: "Sonne", planet2: "Moon", type: "Opposition", orb: 2.1, harmony: "spannend" }
        ],
        houses: [
          { number: 1, title: "1st House", sign: "Widder", degree: 10 }
        ]
      },
      bazi: {
        dayMaster: ElementType.WOOD,
        dayMasterName: "Jiǎ",
        dayMasterChinese: "甲",
        dayMasterPolarity: "Yang",
        pillars: {
          Jahr: { stem: { name: "Jiǎ", chinese: "甲", element: ElementType.WOOD, yinYang: "Yang" }, branch: { name: "Zǐ", chinese: "子", element: ElementType.WATER, animal: "Ratte", hiddenStems: [] } }
        }
      },
      wuxing: {
        wu_xing_vector: {
          [ElementType.WOOD]: 30,
          [ElementType.FIRE]: 10,
          [ElementType.EARTH]: 20,
          [ElementType.METAL]: 10,
          [ElementType.WATER]: 30
        }
      },
      fusion: {
        coherenceIndex: 85,
        westernContributors: ["Sonne in Widder"]
      }
    };

    const inputData = {
      name: "Hannah Arendt",
      birthDate: "1906-10-14",
      birthTime: "21:15",
      birthPlaceLabel: "Linden, Hannover",
      gender: "Weiblich"
    };

    const result = normalizeFuFireProfile(rawFakeData, inputData);

    expect(result.identity.name).toBe("Hannah Arendt");
    expect(result.western.sunSign).toBe("Widder");
    expect(result.bazi.dayMaster.element).toBe(ElementType.WOOD);
    expect(result.fusion.coherenceIndex).toBe(85);
    expect(result.fusion.source).toBe("fufire");
    expect(result.provenance[0].status).toBe("server-used");
    expect(result.provenance[0].source).toBe("fufire");
  });
});
