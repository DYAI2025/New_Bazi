import dotenv from "dotenv";
import tzlookup from "tz-lookup";

dotenv.config();

export interface PlaceAutocompletePrediction {
  description: string;
  placeId: string;
}

export interface PlaceDetailsResult {
  name: string;
  formattedAddress: string;
  lat: number;
  lon: number;
}

export interface TimezoneResult {
  tz: string;
  utcOffsetMinutes: number;
}

/**
 * "missing_places_key" is kept in the type for API-doc compatibility (clients
 * may still branch on it), but it is UNREACHABLE since the move to keyless
 * providers (Photon + tz-lookup): there is no key that could be missing.
 */
export type PlacesErrorCode = "missing_places_key" | "places_provider_error";

const PLACES_ERROR_MESSAGES: Record<PlacesErrorCode, string> = {
  missing_places_key: "Geocoding-Anbieter ist serverseitig nicht konfiguriert.",
  places_provider_error: "Ortsdienst ist derzeit nicht verfuegbar."
};
const PLACES_ERROR_STATUS: Record<PlacesErrorCode, number> = {
  missing_places_key: 503,
  places_provider_error: 502
};

/**
 * Typed places/timezone error with an httpStatus for the route layer.
 * Carries only stable codes + safe messages — never the raw upstream
 * error text (which could disclose provider/infrastructure details).
 */
export class PlacesError extends Error {
  code: PlacesErrorCode;
  httpStatus: number;
  constructor(code: PlacesErrorCode) {
    super(PLACES_ERROR_MESSAGES[code]);
    this.name = "PlacesError";
    this.code = code;
    this.httpStatus = PLACES_ERROR_STATUS[code];
  }
}

// ---------------------------------------------------------------------------
// Providers (keyless)
//
// Autocomplete: Photon (photon.komoot.io) — typo-tolerant OSM search, free,
//   no API key. OSM etiquette: identify with a User-Agent.
// Details:      no provider call needed. Photon already returns coordinates,
//   so predictions carry a self-contained "pl1:" placeId (base64url JSON).
// Timezone:     tz-lookup (offline) + Intl for the historical UTC offset.
// ---------------------------------------------------------------------------

const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_USER_AGENT = "New_Bazi/1.0 (bazodiac.space)";
const PLACE_ID_PREFIX = "pl1:";

interface PlaceIdPayload {
  n: string; // name
  a: string; // formattedAddress
  lat: number;
  lon: number;
}

function encodePlaceId(payload: PlaceIdPayload): string {
  return PLACE_ID_PREFIX + Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePlaceId(placeId: string): PlaceIdPayload | null {
  if (!placeId.startsWith(PLACE_ID_PREFIX)) return null;
  try {
    const json = Buffer.from(placeId.slice(PLACE_ID_PREFIX.length), "base64url").toString("utf8");
    const data = JSON.parse(json);
    if (typeof data?.n !== "string" || typeof data?.a !== "string" || typeof data?.lat !== "number" || typeof data?.lon !== "number") {
      return null;
    }
    return data as PlaceIdPayload;
  } catch {
    return null;
  }
}

/**
 * Demo / mock places are NOT a product path. They are only allowed under the
 * automated test runner, or explicitly in non-production via ENABLE_DEMO_PROFILES.
 */
function demoMocksAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NODE_ENV === "test") return true;
  return process.env.ENABLE_DEMO_PROFILES === "true";
}

const DEMO_PLACES: PlaceAutocompletePrediction[] = [
  { description: "Berlin, Deutschland", placeId: "ChIJ2V-RNo9SkFMRAL6clg6IPvs" },
  { description: "München, Deutschland", placeId: "ChIJu4xoSpC1nkcR8gYqg_9nQgM" },
  { description: "Frankfurt am Main, Deutschland", placeId: "ChIJ674vE6QLv0cR8V30u3U0-AE" },
  { description: "Hamburg, Deutschland", placeId: "ChIJuS7_8jqXsUcR8V6N4sO_Sgw" },
  { description: "Wien, Österreich", placeId: "ChIJ_ZPBE3gXbUcR7M6i_X-4Sgw" },
  { description: "Zürich, Schweiz", placeId: "ChIJO_4y37GgmkcRMqWf_SgwSgw" }
];

const DEMO_DETAILS: Record<string, PlaceDetailsResult> = {
  "ChIJ2V-RNo9SkFMRAL6clg6IPvs": { name: "Berlin", formattedAddress: "Berlin, Deutschland", lat: 52.52, lon: 13.405 },
  "ChIJu4xoSpC1nkcR8gYqg_9nQgM": { name: "München", formattedAddress: "München, Deutschland", lat: 48.1351, lon: 11.582 },
  "ChIJ674vE6QLv0cR8V30u3U0-AE": { name: "Frankfurt am Main", formattedAddress: "Frankfurt am Main, Deutschland", lat: 50.1109, lon: 8.6821 },
  "ChIJuS7_8jqXsUcR8V6N4sO_Sgw": { name: "Hamburg", formattedAddress: "Hamburg, Deutschland", lat: 53.5511, lon: 9.9937 },
  "ChIJ_ZPBE3gXbUcR7M6i_X-4Sgw": { name: "Wien", formattedAddress: "Wien, Österreich", lat: 48.2082, lon: 16.3738 },
  "ChIJO_4y37GgmkcRMqWf_SgwSgw": { name: "Zürich", formattedAddress: "Zürich, Schweiz", lat: 47.3769, lon: 8.5417 }
};

/** Build "Name, Staat?, Land" — dropping duplicate segments (e.g. Berlin/Berlin). */
function buildDescription(props: any): string {
  const segments: string[] = [];
  for (const part of [props?.name, props?.state, props?.country]) {
    if (typeof part === "string" && part.length > 0 && !segments.includes(part)) {
      segments.push(part);
    }
  }
  return segments.join(", ");
}

/**
 * Autocomplete via Photon (keyless). Demo mocks only under the test runner or
 * explicit ENABLE_DEMO_PROFILES in non-production.
 */
export async function getAutocompletePredictions(input: string): Promise<PlaceAutocompletePrediction[]> {
  if (!input || input.trim().length === 0) {
    return [];
  }

  if (demoMocksAllowed()) {
    return DEMO_PLACES.filter(p => p.description.toLowerCase().includes(input.toLowerCase()));
  }

  try {
    const url = `${PHOTON_URL}?q=${encodeURIComponent(input)}&lang=de&limit=6&layer=city&layer=district`;
    const response = await fetch(url, { headers: { "User-Agent": PHOTON_USER_AGENT } });
    if (!response.ok) {
      throw new Error(`Photon HTTP error ${response.status}`);
    }
    const data = await response.json();
    const predictions: PlaceAutocompletePrediction[] = [];
    const seen = new Set<string>();
    for (const feature of data?.features || []) {
      const props = feature?.properties;
      const coords = feature?.geometry?.coordinates;
      if (!props?.name || !Array.isArray(coords) || coords.length < 2) continue;
      const description = buildDescription(props);
      if (seen.has(description)) continue;
      seen.add(description);
      predictions.push({
        description,
        placeId: encodePlaceId({ n: props.name, a: description, lat: coords[1], lon: coords[0] })
      });
    }
    return predictions;
  } catch (error: any) {
    if (error instanceof PlacesError) throw error;
    console.error("Autocomplete provider error (server-side only):", error?.message);
    throw new PlacesError("places_provider_error");
  }
}

/**
 * Resolve a placeId. "pl1:" ids are self-contained (no network call). Legacy
 * Google place-ids (old sessions/bookmarks) cannot be resolved without Google
 * → honest places_provider_error (502).
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
  if (!placeId) {
    throw new Error("Missing placeId parameter in details lookup");
  }

  if (demoMocksAllowed() && DEMO_DETAILS[placeId]) {
    return DEMO_DETAILS[placeId];
  }

  const decoded = decodePlaceId(placeId);
  if (decoded) {
    return { name: decoded.n, formattedAddress: decoded.a, lat: decoded.lat, lon: decoded.lon };
  }

  console.error("Place Details error (server-side only): unresolvable placeId scheme", placeId.slice(0, 8));
  throw new PlacesError("places_provider_error");
}

/** UTC offset in minutes for a timezone at a given instant — no network, via Intl. */
function offsetMinutes(tz: string, atMs: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
  const part = dtf.formatToParts(new Date(atMs)).find(p => p.type === "timeZoneName")?.value ?? "GMT+0";
  const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2]) * 60 + (m[3] ? parseInt(m[3]) : 0));
}

/**
 * Offline timezone resolution via tz-lookup + Intl. `timestamp` is in seconds
 * (kept from the old Google Timezone API contract) and determines the
 * historical DST-aware offset.
 */
export async function getTimezone(lat: number, lon: number, timestamp?: number): Promise<TimezoneResult> {
  const atMs = (timestamp ?? Math.floor(Date.now() / 1000)) * 1000;
  try {
    const tz = tzlookup(lat, lon);
    return { tz, utcOffsetMinutes: offsetMinutes(tz, atMs) };
  } catch (error: any) {
    if (error instanceof PlacesError) throw error;
    console.error("Timezone provider error (server-side only):", error?.message);
    throw new PlacesError("places_provider_error");
  }
}
