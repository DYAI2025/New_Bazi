import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BazodiacClient,
  BazodiacRequestError,
  getUserFacingErrorTitle,
  getUserFacingRequestMessage,
  toBirthInputPayload
} from "./bazodiacClient";
import type { BirthData } from "../types";

const LEGACY_INPUT = {
  name: "Ada Lovelace",
  birthDate: "1815-12-10",
  birthTime: "06:15",
  birthPlace: {
    placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
    label: "London, UK",
    latitude: "51.5072",
    longitude: "-0.1276",
    timezone: "Europe/London"
  },
  gender: "Weiblich"
} as unknown as BirthData;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("toBirthInputPayload", () => {
  it("adapts a legacy/nested place shape to the backend BirthInput schema", () => {
    expect(toBirthInputPayload(LEGACY_INPUT)).toEqual({
      name: "Ada Lovelace",
      birthDate: "1815-12-10",
      birthTime: "06:15",
      placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI",
      birthPlaceLabel: "London, UK",
      lat: 51.5072,
      lon: -0.1276,
      tz: "Europe/London",
      gender: "Weiblich"
    });
  });

  it("keeps invalid missing timezone visible instead of fabricating a fallback", () => {
    const payload = toBirthInputPayload({ ...LEGACY_INPUT, birthPlace: { ...(LEGACY_INPUT as any).birthPlace, timezone: "" } as any });
    expect(payload.tz).toBe("");
  });

  it("passes timeKnown:false to BFF payload so BFF can substitute 12:00 placeholder", () => {
    const payload = toBirthInputPayload({ ...LEGACY_INPUT, timeKnown: false } as BirthData);
    expect(payload.timeKnown).toBe(false);
  });

  it("omits timeKnown from BFF payload when timeKnown is true or undefined (default)", () => {
    expect(toBirthInputPayload(LEGACY_INPUT).timeKnown).toBeUndefined();
    expect(toBirthInputPayload({ ...LEGACY_INPUT, timeKnown: true } as BirthData).timeKnown).toBeUndefined();
  });
});

describe("BazodiacClient profile requests", () => {
  it("posts the adapted BirthInput payload", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ source: "fufire-chart" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await BazodiacClient.fetchProfile(LEGACY_INPUT);

    expect(fetchMock).toHaveBeenCalledWith("/api/azodiac/profile", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBirthInputPayload(LEGACY_INPUT))
    }));
  });

  it("classifies 400/422 validation errors separately from offline errors", async () => {
    const fields = [{ field: "tz", message: "Zeitzone fehlt" }];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "invalid_birth_input", fields }), { status: 400 })));

    await expect(BazodiacClient.fetchProfile(LEGACY_INPUT)).rejects.toMatchObject({
      status: 400,
      code: "invalid_birth_input",
      fields
    });

    const err = new BazodiacRequestError("invalid_birth_input", { status: 400, code: "invalid_birth_input", fields });
    expect(getUserFacingErrorTitle(err)).toBe("Geburtsdaten ungültig");
    expect(getUserFacingRequestMessage(err)).toContain("Bitte prüfe Datum, Uhrzeit, Geburtsort und Zeitzone");
    expect(getUserFacingRequestMessage(err)).toContain("Fehlercode: invalid_birth_input");
  });

  it("wraps a malformed-but-200 response body in a BazodiacRequestError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{\"data\": {\"pro", { status: 200 })));

    await expect(BazodiacClient.fetchProfile(LEGACY_INPUT)).rejects.toMatchObject({
      code: "response_parse_error",
      status: 200,
      isNetworkError: false
    });
  });
});
