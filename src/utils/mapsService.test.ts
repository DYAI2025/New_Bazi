import { describe, it, expect, vi, afterEach } from "vitest";
import { getAutocompletePredictions, getPlaceDetails, getTimezone, PlacesError } from "./mapsService";
import { normalizeFuFireProfile } from "./fufireNormalizer";
import { ElementType } from "../types";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Maps and Geocoding Service (REST / Fallbacks)", () => {
  it("should return mock autocomplete entries on missing Google key in dev mode", async () => {
    // We assume GOOGLE_MAPS_API_KEY environment helper returns empty
    const results = await getAutocompletePredictions("Ber");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].description).toContain("Berlin");
    expect(results[0].placeId).toBeDefined();
  });

  it("should fail gracefully on invalid input or empty placeId", async () => {
    const results = await getAutocompletePredictions("");
    expect(results).toEqual([]);
    
    await expect(getPlaceDetails("")).rejects.toThrow("Missing placeId");
  });

  it("should return mock detail results matching standard IANA codes inside Germany", async () => {
    const berlinId = "ChIJ2V-RNo9SkFMRAL6clg6IPvs";
    const details = await getPlaceDetails(berlinId);
    expect(details.name).toBe("Berlin");
    expect(details.lat).toBe(52.52);
    expect(details.lon).toBe(13.405);

    const tz = await getTimezone(52.52, 13.405);
    expect(tz.tz).toBe("Europe/Berlin");
    expect(tz.utcOffsetMinutes).toBe(120); // standard CEST
  });
});

describe("Strict Places mode (no demo mocks in production)", () => {
  it("throws missing_places_key in production without GOOGLE_MAPS_API_KEY", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_PLATFORM_KEY;
    process.env.ENABLE_DEMO_PROFILES = "false";

    await expect(getAutocompletePredictions("Ber")).rejects.toMatchObject({ code: "missing_places_key" });
    await expect(getPlaceDetails("ChIJ2V-RNo9SkFMRAL6clg6IPvs")).rejects.toMatchObject({ code: "missing_places_key" });
    await expect(getTimezone(52.52, 13.405)).rejects.toMatchObject({ code: "missing_places_key" });
  });

  it("allows demo mocks in non-production when ENABLE_DEMO_PROFILES=true", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_PLATFORM_KEY;
    process.env.ENABLE_DEMO_PROFILES = "true";

    const results = await getAutocompletePredictions("Ber");
    expect(results.length).toBeGreaterThan(0);
  });

  it("blocks demo mocks in development when ENABLE_DEMO_PROFILES is not set", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_PLATFORM_KEY;
    delete process.env.ENABLE_DEMO_PROFILES;

    await expect(getPlaceDetails("ChIJ2V-RNo9SkFMRAL6clg6IPvs")).rejects.toMatchObject({ code: "missing_places_key" });
  });

  it("PlacesError carries httpStatus 503", () => {
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
