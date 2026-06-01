import { BirthData } from "../types";
import { ProfileViewModel } from "../viewmodels/profileViewModel";
import type { FieldError } from "../utils/birthInputValidation";

export interface SynastryResponse {
  score: number;
  westernScore: number;
  baziScore: number;
  harmonyAnalysis: string;
  advice: string;
  source: string;
  userRef: { name: string; sunSign: string; dayMaster: string };
  partnerRef: { name: string; sunSign: string; dayMaster: string };
}

export interface DailyPulseResponse {
  date: string;
  qiResonance: number | null;
  dominantPhase: string | null;
  coachingKeyword: string | null;
  description: string | null;
  source: "fufire" | "missing";
  available: boolean;
}

export interface PlacePrediction {
  description: string;
  placeId: string;
}

export interface ResolvedPlace {
  placeId: string;
  label: string;
  lat: number;
  lon: number;
  tz: string;
}

export interface BirthInputPayload {
  name: string;
  birthDate: string;
  birthTime: string;
  placeId: string;
  birthPlaceLabel: string;
  lat?: number;
  lon?: number;
  tz?: string;
  gender?: BirthData["gender"];
}

export class BazodiacRequestError extends Error {
  status?: number;
  code?: string;
  fields?: unknown;
  isNetworkError: boolean;

  constructor(message: string, options: { status?: number; code?: string; fields?: unknown; isNetworkError?: boolean } = {}) {
    super(message);
    this.name = "BazodiacRequestError";
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
    this.isNetworkError = Boolean(options.isNetworkError);
  }
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Frontend adapter for the server-side BirthInput contract.
 *
 * The UI stores a broader, backward-compatible BirthData shape. Before any
 * profile-like request leaves the browser, normalize it to the backend schema:
 * birthDate/birthTime, placeId, lat/lon and IANA tz. This also tolerates older
 * aliases such as birthPlace.latitude/longitude/timezone without sending an
 * ambiguous payload downstream.
 */
export function toBirthInputPayload(data: BirthData): BirthInputPayload {
  const raw = data as any;
  const birthPlace = raw.birthPlace && typeof raw.birthPlace === "object" ? raw.birthPlace : undefined;
  const labelFromPlace = birthPlace
    ? getString(birthPlace.label || birthPlace.description || birthPlace.name || birthPlace.formattedAddress)
    : getString(raw.birthPlace);
  const tzCandidate = raw.tz ?? raw.timezone ?? birthPlace?.tz ?? birthPlace?.timezone;

  return {
    name: getString(raw.name),
    birthDate: getString(raw.birthDate ?? raw.date),
    birthTime: getString(raw.birthTime ?? raw.time),
    placeId: getString(raw.placeId ?? birthPlace?.placeId ?? birthPlace?.id),
    birthPlaceLabel: getString(raw.birthPlaceLabel) || labelFromPlace,
    lat: getNumber(raw.lat ?? raw.latitude ?? birthPlace?.lat ?? birthPlace?.latitude),
    lon: getNumber(raw.lon ?? raw.lng ?? raw.longitude ?? birthPlace?.lon ?? birthPlace?.lng ?? birthPlace?.longitude),
    tz: typeof tzCandidate === "string" ? tzCandidate.trim() : undefined,
    gender: raw.gender
  };
}

function formatValidationFields(fields: unknown): string {
  const names: string[] = [];

  const collectFromArray = (arr: unknown[], prefix?: string) => {
    for (const item of arr) {
      if (item && typeof item === "object" && "field" in item) {
        const fieldName = String((item as FieldError).field);
        names.push(prefix ? `${prefix}.${fieldName}` : fieldName);
      }
    }
  };

  // Flat FieldError[]
  if (Array.isArray(fields)) {
    if (fields.length === 0) return "";
    collectFromArray(fields);
  } else if (fields && typeof fields === "object") {
    // Nested structures, e.g. { user: FieldError[]; partner: FieldError[] }
    for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
      if (Array.isArray(value) && value.length > 0) {
        collectFromArray(value, key);
      }
    }
  }

  return names.length > 0 ? ` Betroffene Felder: ${names.join(", ")}.` : "";
}

export function getUserFacingRequestMessage(error: unknown): string {
  if (error instanceof BazodiacRequestError) {
    if ((error.status === 400 || error.status === 422) && error.code === "invalid_birth_input") {
      return `Geburtsdaten konnten nicht verarbeitet werden. Bitte prüfe Datum, Uhrzeit, Geburtsort und Zeitzone. Fehlercode: ${error.code || "invalid_birth_input"}.${formatValidationFields(error.fields)}`;
    }

    const code = error.code || "unbekannter_fehler";
    return `Es ist ein Fehler bei der Anfrage aufgetreten. Bitte versuche es erneut. Fehlercode: ${code}.`;
    if (error.status && error.status >= 500) {
      return error.message || `Serverfehler beim Laden des kosmischen Profils. Fehlercode: ${error.code || error.status}.`;
    }
    if (error.isNetworkError) {
      return "Verbindung offline. Bitte prüfe Netzwerk, DNS/CORS oder Timeout und versuche es erneut.";
    }
  }
  return error instanceof Error && error.message ? error.message : "Fehler beim Laden des kosmischen Profils.";
}

export function getUserFacingErrorTitle(error: unknown): string {
  if (error instanceof BazodiacRequestError) {
    if (error.status === 400 || error.status === 422) return "Geburtsdaten ungültig";
    if (error.status && error.status >= 500) return "Serverfehler";
    if (error.isNetworkError) return "Kosmische Verbindung offline";
  }
  return "Profil konnte nicht geladen werden";
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new BazodiacRequestError(err instanceof Error && err.message ? err.message : "Network error", {
      code: "network_error",
      isNetworkError: true
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const code = err.error || `http_${res.status}`;
    const message = err.message || code || `HTTP error ${res.status}`;
    throw new BazodiacRequestError(message, { code, status: res.status, fields: err.fields });
  }
  return res.json();
}

export class BazodiacClient {
  static fetchProfile(birthData: BirthData): Promise<ProfileViewModel> {
    return postJson<ProfileViewModel>("/api/azodiac/profile", toBirthInputPayload(birthData));
  }

  static fetchSynastry(userBirthData: BirthData, partnerBirthData: BirthData): Promise<SynastryResponse> {
    return postJson<SynastryResponse>("/api/azodiac/synastry", {
      userBirthData: toBirthInputPayload(userBirthData),
      partnerBirthData: toBirthInputPayload(partnerBirthData)
    });
  }

  static fetchDailyPulse(birthData: BirthData): Promise<DailyPulseResponse> {
    return postJson<DailyPulseResponse>("/api/azodiac/daily", toBirthInputPayload(birthData));
  }

  static async searchPlaces(input: string): Promise<PlacePrediction[]> {
    if (!input || input.trim().length < 2) return [];
    return postJson<PlacePrediction[]>("/api/places/autocomplete", { input });
  }

  /** Server-side resolution of a placeId into coordinates + IANA timezone. */
  static async resolvePlace(placeId: string, label: string): Promise<ResolvedPlace> {
    const geo = await postJson<{ latitude: number; longitude: number; tz: string; place: string }>(
      "/api/geocode",
      { placeId }
    );
    return { placeId, label: label || geo.place, lat: geo.latitude, lon: geo.longitude, tz: geo.tz };
  }

  static async fetchConfig(): Promise<any> {
    const res = await fetch("/api/config");
    if (!res.ok) throw new BazodiacRequestError(`HTTP error ${res.status}`, { status: res.status, code: `http_${res.status}` });
    return res.json();
  }
}
