import dotenv from "dotenv";

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

export type PlacesErrorCode = "missing_places_key" | "places_provider_error";

const PLACES_ERROR_MESSAGES: Record<PlacesErrorCode, string> = {
  missing_places_key: "Geocoding-Anbieter ist serverseitig nicht konfiguriert (GOOGLE_MAPS_API_KEY fehlt).",
  places_provider_error: "Ortsdienst ist derzeit nicht verfuegbar."
};
const PLACES_ERROR_STATUS: Record<PlacesErrorCode, number> = {
  missing_places_key: 503,
  places_provider_error: 502
};

/**
 * Typed places/timezone error with an httpStatus for the route layer.
 * Carries only stable codes + safe messages — never the upstream Google
 * error_message (which can disclose key/referer/quota/project details).
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

const PLACEHOLDER_KEYS = new Set(["", "YOUR_API_KEY", "MY_GOOGLE_MAPS_PLATFORM_KEY", "replace_me"]);

// Helper to get Google API Key
export function getGoogleApiKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
}

function hasRealKey(): boolean {
  return !PLACEHOLDER_KEYS.has(getGoogleApiKey().trim());
}

/**
 * Demo / mock places are NOT a product path. They are only allowed under the
 * automated test runner, or explicitly in non-production via ENABLE_DEMO_PROFILES.
 * Everywhere else a missing key must surface as missing_places_key (503).
 */
function demoMocksAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NODE_ENV === "test") return true;
  return process.env.ENABLE_DEMO_PROFILES === "true";
}

/** Throws PlacesError unless demo mocks are explicitly permitted. */
function requireKeyOrDemo(): void {
  if (!hasRealKey() && !demoMocksAllowed()) {
    throw new PlacesError("missing_places_key");
  }
}

/**
 * Fetch autocomplete predictions from Google Places API or mock list in fallback
 */
export async function getAutocompletePredictions(input: string): Promise<PlaceAutocompletePrediction[]> {
  if (!input || input.trim().length === 0) {
    return [];
  }

  requireKeyOrDemo();
  const key = getGoogleApiKey();
  if (!hasRealKey()) {
    // Demo-only path (test runner or explicit ENABLE_DEMO_PROFILES).
    const mockPlaces = [
      { description: "Berlin, Deutschland", placeId: "ChIJ2V-RNo9SkFMRAL6clg6IPvs" },
      { description: "München, Deutschland", placeId: "ChIJu4xoSpC1nkcR8gYqg_9nQgM" },
      { description: "Frankfurt am Main, Deutschland", placeId: "ChIJ674vE6QLv0cR8V30u3U0-AE" },
      { description: "Hamburg, Deutschland", placeId: "ChIJuS7_8jqXsUcR8V6N4sO_Sgw" },
      { description: "Wien, Österreich", placeId: "ChIJ_ZPBE3gXbUcR7M6i_X-4Sgw" },
      { description: "Zürich, Schweiz", placeId: "ChIJO_4y37GgmkcRMqWf_SgwSgw" }
    ];
    return mockPlaces.filter(p => p.description.toLowerCase().includes(input.toLowerCase()));
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${key}&language=de&types=(cities)`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Autocomplete HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data.status === "ZERO_RESULTS") {
      return [];
    }
    if (data.status !== "OK") {
      throw new Error(`Google Autocomplete API error: ${data.status} ${data.error_message || ""}`);
    }
    return (data.predictions || []).map((pred: any) => ({
      description: pred.description,
      placeId: pred.place_id,
    }));
  } catch (error: any) {
    if (error instanceof PlacesError) throw error;
    console.error("Autocomplete provider error (server-side only):", error?.message);
    throw new PlacesError("places_provider_error");
  }
}

/**
 * Fetch place details from Google Details API or fallback
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
  if (!placeId) {
    throw new Error("Missing placeId parameter in details lookup");
  }

  requireKeyOrDemo();
  const key = getGoogleApiKey();
  if (!hasRealKey()) {
    // Demo-only path (test runner or explicit ENABLE_DEMO_PROFILES).
    if (placeId === "ChIJ2V-RNo9SkFMRAL6clg6IPvs") {
      return { name: "Berlin", formattedAddress: "Berlin, Deutschland", lat: 52.52, lon: 13.405 };
    }
    if (placeId === "ChIJu4xoSpC1nkcR8gYqg_9nQgM") {
      return { name: "München", formattedAddress: "München, Deutschland", lat: 48.1351, lon: 11.582 };
    }
    if (placeId === "ChIJ674vE6QLv0cR8V30u3U0-AE") {
      return { name: "Frankfurt am Main", formattedAddress: "Frankfurt am Main, Deutschland", lat: 50.1109, lon: 8.6821 };
    }
    if (placeId === "ChIJuS7_8jqXsUcR8V6N4sO_Sgw") {
      return { name: "Hamburg", formattedAddress: "Hamburg, Deutschland", lat: 53.5511, lon: 9.9937 };
    }
    if (placeId === "ChIJ_ZPBE3gXbUcR7M6i_X-4Sgw") {
      return { name: "Wien", formattedAddress: "Wien, Österreich", lat: 48.2082, lon: 16.3738 };
    }
    if (placeId === "ChIJO_4y37GgmkcRMqWf_SgwSgw") {
      return { name: "Zürich", formattedAddress: "Zürich, Schweiz", lat: 47.3769, lon: 8.5417 };
    }
    throw new Error("Missing place in mock data for this placeId.");
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${key}&language=de`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Place Details HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(`Google Place Details API error: ${data.status} ${data.error_message || ""}`);
    }
    const result = data.result;
    if (!result?.geometry?.location) {
      throw new Error("No coordinate data returned for this placeId");
    }
    return {
      name: result.name || "",
      formattedAddress: result.formatted_address || "",
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
    };
  } catch (error: any) {
    if (error instanceof PlacesError) throw error;
    console.error("Place Details provider error (server-side only):", error?.message);
    throw new PlacesError("places_provider_error");
  }
}

/**
 * Fetch timezone details from Google Timezone API or fallback
 */
export async function getTimezone(lat: number, lon: number, timestamp?: number): Promise<TimezoneResult> {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  requireKeyOrDemo();
  const key = getGoogleApiKey();
  if (!hasRealKey()) {
    // Demo-only path (test runner or explicit ENABLE_DEMO_PROFILES).
    if (Math.abs(lat - 52.52) < 0.5) return { tz: "Europe/Berlin", utcOffsetMinutes: 120 }; // CEST
    if (Math.abs(lat - 48.1351) < 0.5) return { tz: "Europe/Berlin", utcOffsetMinutes: 120 };
    if (Math.abs(lat - 48.2082) < 0.5) return { tz: "Europe/Vienna", utcOffsetMinutes: 120 };
    if (Math.abs(lat - 47.3769) < 0.5) return { tz: "Europe/Zurich", utcOffsetMinutes: 120 };
    return { tz: "Europe/Berlin", utcOffsetMinutes: 120 };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${ts}&key=${key}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Timezone HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(`Google Timezone API error: ${data.status} ${data.error_message || ""}`);
    }
    const rawOffset = data.rawOffset || 0;
    const dstOffset = data.dstOffset || 0;
    return {
      tz: data.timeZoneId || "Europe/Berlin",
      utcOffsetMinutes: Math.round((rawOffset + dstOffset) / 60)
    };
  } catch (error: any) {
    if (error instanceof PlacesError) throw error;
    console.error("Timezone provider error (server-side only):", error?.message);
    throw new PlacesError("places_provider_error");
  }
}
