import { BirthData } from "../types";
import { ProfileViewModel, ElementalComparisonEntry } from "../viewmodels/profileViewModel";
import type { FieldError } from "../utils/birthInputValidation";
import type { ElementalWeight, PairAxis } from "../utils/tensionPair";
import type { InterAspect } from "../utils/interAspects";
import type { PillarComparison } from "../utils/baziCompare";

export interface SynastryResponse {
  score: number;
  westernScore: number;
  baziScore: number;
  harmonyAnalysis: string;
  advice: string;
  source: string;
  userRef: { name: string; sunSign: string; dayMaster: string };
  partnerRef: { name: string; sunSign: string; dayMaster: string };
  /** Per-Element-Verteilung beider Personen (Paar-Spannungsnavigator); leer wenn ein Fusionsfeld fehlt. */
  elementalA: ElementalWeight[];
  elementalB: ElementalWeight[];
  /** P7 — Western Inter-Aspekte A×B; leer wenn keine berechenbaren Körper. */
  interAspects: InterAspect[];
  /** P7 — BaZi-Säulenvergleich (Stamm-Element + Zweig/Tier); leer bei unvollständigen Säulen. */
  pillarComparison: PillarComparison[];
  /** P7 — vorzeichenbehaftetes West-vs-BaZi-Elementfeld je Person (für Paar-Polachsen); leer wenn Fusionsfeld fehlt. */
  comparisonA: ElementalComparisonEntry[];
  comparisonB: ElementalComparisonEntry[];
  /** P7 — fünf Paar-Polachsen aus comparisonA/B; leer wenn ein Feld fehlt. */
  pairAxes: PairAxis[];
}

export interface DailyPulseSection {
  summary: string | null;
  themes: string[];
  caution: string | null;
  opportunity: string | null;
}

export interface DailyPulseEastern extends DailyPulseSection {
  dayMaster: string | null;
  dailyPillar: { stem: string; branch: string } | null;
  relationToDayMaster: string | null;
  jieqi: string | null;
}

/**
 * Mirrors the BFF view model for /api/azodiac/daily, which itself mirrors the
 * engine DailyResponse: three content sections (West/Ost/Fusion), the fusion
 * action as its own Impuls, push groundwork and jieqi/weekday context notes.
 * No invented metrics.
 */
/** Tagespuls 2.0 — westliche Rohanker (Sektoren-Indizes roh, Labeling ist Etappe 2). */
export interface DailyWestEvidence {
  transitSectors: number[];
  natalFocus: string[];
}

/** Tagespuls 2.0 — Natal-Profil + stabile 5D-Signatur aus dem Bootstrap. */
export interface DailyNatal {
  sunSign: string | null;
  moonSign: string | null;
  ascendantSign: string | null;
  dayMaster: string | null;
  harmonyIndex: number | null;
  elements: Record<string, number> | null;
}

export interface DailyPulseResponse {
  date: string;
  western: DailyPulseSection | null;
  eastern: DailyPulseEastern | null;
  fusion: { summary: string | null; synthesis: string | null } | null;
  action: string | null;
  pushText: string | null;
  pushworthy: boolean;
  jieqiNote: string | null;
  weekdayNote: string | null;
  description: string | null;
  source: "fufire" | "missing";
  available: boolean;
  /** Tagespuls 2.0 — optional: null/fehlend, wenn Engine oder älterer BFF sie nicht liefert. */
  westEvidence?: DailyWestEvidence | null;
  natal?: DailyNatal | null;
  qualityFlags?: Record<string, unknown> | null;
  /** PRD Day Pulse Stufe 1 — Mode/Intensität aus Harmony-Index + Rat der Sechs mit availability. */
  mode?: "spannung" | "pulse" | "trace" | null;
  intensity?: number | null;
  council?: {
    key: "sun" | "moon" | "ascendant" | "day_master" | "year_animal" | "dominant_wuxing";
    label: string;
    value: string | null;
    available: boolean;
    unavailableReason: string | null;
  }[] | null;
}

/** Ein 10-Jahres-Zyklus (Dekaden-Säule) aus dem BFF /api/azodiac/bazi/dayun. Alle Felder honest-nullable. */
export interface DayunCycle {
  sequence: number | null;
  ageLabel: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  stem: string | null;
  stemHanzi: string | null;
  branch: string | null;
  branchHanzi: string | null;
  /** Englischer Element-Key der Engine ("wood" | "fire" | "earth" | "metal" | "water"). */
  element: string | null;
  polarity: string | null;
  tenGodDe: string | null;
  isCurrent: boolean;
}

export interface DayunResponse {
  available: boolean;
  source: string;
  status?: string;
  message?: string;
  labelDe?: string;
  direction?: string | null;
  startAgeYears?: number | null;
  cycles: DayunCycle[];
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
  timeKnown?: boolean;
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
    gender: raw.gender,
    timeKnown: raw.timeKnown !== false ? undefined : false
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
    if (error.code === "invalid_birth_time_dst") {
      return error.message;
    }

    if ((error.status === 400 || error.status === 422) && error.code === "invalid_birth_input") {
      return `Geburtsdaten konnten nicht verarbeitet werden. Bitte prüfe Datum, Uhrzeit, Geburtsort und Zeitzone. Fehlercode: ${error.code || "invalid_birth_input"}.${formatValidationFields(error.fields)}`;
    }

    if (error.status && error.status >= 500) {
      return error.message || `Serverfehler beim Laden des kosmischen Profils. Fehlercode: ${error.code || error.status}.`;
    }
    if (error.isNetworkError) {
      return "Verbindung offline. Bitte prüfe Netzwerk, DNS/CORS oder Timeout und versuche es erneut.";
    }

    const code = error.code || "unbekannter_fehler";
    return `Es ist ein Fehler bei der Anfrage aufgetreten. Bitte versuche es erneut. Fehlercode: ${code}.`;
  }
  return error instanceof Error && error.message ? error.message : "Fehler beim Laden des kosmischen Profils.";
}

export function getUserFacingErrorTitle(error: unknown): string {
  if (error instanceof BazodiacRequestError) {
    if (error.code === "invalid_birth_time_dst") return "Geburtszeit existiert nicht (Zeitumstellung)";
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
  try {
    return await res.json();
  } catch {
    throw new BazodiacRequestError("Antwort konnte nicht gelesen werden.", {
      code: "response_parse_error",
      status: res.status,
      isNetworkError: false
    });
  }
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

  static fetchDailyPulse(birthData: BirthData, targetDate?: string): Promise<DailyPulseResponse> {
    const payload = toBirthInputPayload(birthData);
    return postJson<DailyPulseResponse>(
      "/api/azodiac/daily",
      targetDate ? { ...payload, targetDate } : payload
    );
  }

  /** Echte Dekaden-Zyklen (Da Yun) aus dem BFF; gleiches POST-/Fehler-Muster wie fetchDailyPulse. */
  static async fetchDayun(data: BirthData): Promise<DayunResponse> {
    return postJson<DayunResponse>("/api/azodiac/bazi/dayun", toBirthInputPayload(data));
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
