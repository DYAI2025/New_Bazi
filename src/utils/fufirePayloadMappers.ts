/**
 * Per-endpoint FuFirE payload mappers.
 *
 * The FuFirE engine's request models are HETEROGENEOUS (authoritative spec:
 * https://api.fufire.space/openapi.json):
 *
 * - /chart                  ChartComputeRequest: local_datetime, tz_id,
 *                           geo_lat_deg, geo_lon_deg, time_standard, day_boundary
 * - /v1/calculate/western   WesternRequest:  date (local ISO8601 datetime), tz,
 *                           lon, lat, ambiguousTime, nonexistentTime,
 *                           birth_time_known, zodiac_mode
 * - /v1/calculate/bazi      BaziRequest:     like western, plus standard
 *                           (CIVIL|LMT|TLST) and boundary (midnight|zi)
 * - /v1/calculate/wuxing    WxRequest:       date, tz, lon, lat,
 *                           ambiguousTime, nonexistentTime (required: date, lon, lat)
 * - /v1/calculate/fusion    FusionRequest:   date, tz, lon, lat, ambiguousTime,
 *                           nonexistentTime, birth_time_known, bazi_pillars?
 *                           (required: date, lon, lat)
 * - /v1/calculate/tst       TSTRequest:      date, tz, lon, ambiguousTime,
 *                           nonexistentTime (required: date, lon — no lat)
 * - /v1/experience/*        BirthInput wrapper: { birth: { date YYYY-MM-DD,
 *                           time HH:MM:SS, tz, lat, lon, place_label?,
 *                           birth_time_known }, ... }
 *
 * Sending the /chart shape to the /v1 endpoints is a guaranteed 422 (verified
 * live in Railway logs, 2026-06-10). Only /chart keeps the chart contract —
 * see buildFuFirEPayload in profileService.ts.
 */

import type { ValidatedBirthInput } from "./birthInputValidation";

// --- Request payload types (mirror the engine's OpenAPI request models) ---

export interface WesternRequestPayload {
  date: string; // local ISO8601 datetime, e.g. 1990-06-15T14:30:00
  tz: string;
  lon: number;
  lat: number;
  ambiguousTime: "earlier" | "later";
  nonexistentTime: "error" | "shift_forward";
  birth_time_known: boolean;
  zodiac_mode: "tropical" | "sidereal_lahiri" | "sidereal_fagan_bradley" | "sidereal_raman";
}

export interface BaziRequestPayload {
  date: string;
  tz: string;
  lon: number;
  lat: number;
  standard: "CIVIL" | "LMT" | "TLST";
  boundary: "midnight" | "zi";
  ambiguousTime: "earlier" | "later";
  nonexistentTime: "error" | "shift_forward";
  birth_time_known: boolean;
}

export interface WuxingRequestPayload {
  date: string;
  tz: string;
  lon: number;
  lat: number;
  ambiguousTime: "earlier" | "later";
  nonexistentTime: "error" | "shift_forward";
}

export interface FusionRequestPayload {
  date: string;
  tz: string;
  lon: number;
  lat: number;
  ambiguousTime: "earlier" | "later";
  nonexistentTime: "error" | "shift_forward";
  birth_time_known: boolean;
  // bazi_pillars intentionally omitted — the engine auto-computes them.
}

export interface TstRequestPayload {
  date: string;
  tz: string;
  lon: number; // TSTRequest has no lat
  ambiguousTime: "earlier" | "later";
  nonexistentTime: "error" | "shift_forward";
}

export interface DayunRequestPayload {
  date: string; // "YYYY-MM-DDTHH:mm" lokale Geburtszeit
  tz: string;
  lat: number;
  lon: number;
  sex_at_birth: "male" | "female";
  direction_method: "year_stem_yinyang_and_sex";
}

export interface BirthInputPayload {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  tz: string;
  lat: number;
  lon: number;
  place_label: string | null;
  birth_time_known: boolean;
}

export interface BootstrapRequestPayload {
  birth: BirthInputPayload;
  locale: string;
}

export interface DailyRequestPayload {
  birth: BirthInputPayload;
  soulprint_sectors: number[]; // exactly 12
  quiz_sectors: number[]; // exactly 12
  target_date: string; // YYYY-MM-DD
  locale: string;
}

// --- Shared building blocks ---

/** Local ISO8601 datetime expected by every /v1/calculate/* request model. */
function localIsoDatetime(input: ValidatedBirthInput): string {
  return `${input.birthDate}T${input.birthTime}:00`;
}

/** BirthInput sub-object expected by the /v1/experience/* request models. */
function buildBirthInput(input: ValidatedBirthInput): BirthInputPayload {
  return {
    date: input.birthDate,
    time: `${input.birthTime}:00`,
    tz: input.tz,
    lat: input.lat,
    lon: input.lon,
    place_label: input.birthPlaceLabel || null,
    birth_time_known: input.timeKnown !== false
  };
}

const LOCALE = "de-DE";

// --- Per-endpoint mappers ---

export function buildWesternPayload(input: ValidatedBirthInput): WesternRequestPayload {
  return {
    date: localIsoDatetime(input),
    tz: input.tz,
    lon: input.lon,
    lat: input.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
    birth_time_known: input.timeKnown !== false,
    zodiac_mode: "tropical"
  };
}

export function buildBaziPayload(input: ValidatedBirthInput): BaziRequestPayload {
  return {
    date: localIsoDatetime(input),
    tz: input.tz,
    lon: input.lon,
    lat: input.lat,
    standard: "CIVIL",
    boundary: "midnight",
    ambiguousTime: "earlier",
    nonexistentTime: "error",
    birth_time_known: input.timeKnown !== false
  };
}

export function buildWuxingPayload(input: ValidatedBirthInput): WuxingRequestPayload {
  return {
    date: localIsoDatetime(input),
    tz: input.tz,
    lon: input.lon,
    lat: input.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error"
  };
}

export function buildFusionPayload(input: ValidatedBirthInput): FusionRequestPayload {
  return {
    date: localIsoDatetime(input),
    tz: input.tz,
    lon: input.lon,
    lat: input.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
    birth_time_known: input.timeKnown !== false
  };
}

export function buildTstPayload(input: ValidatedBirthInput): TstRequestPayload {
  return {
    date: localIsoDatetime(input),
    tz: input.tz,
    lon: input.lon,
    ambiguousTime: "earlier",
    nonexistentTime: "error"
  };
}

export function buildBootstrapPayload(input: ValidatedBirthInput): BootstrapRequestPayload {
  return {
    birth: buildBirthInput(input),
    locale: LOCALE
  };
}

/**
 * Dayun braucht sex_at_birth für die Laufrichtung (direction_method
 * year_stem_yinyang_and_sex; ohne → 422 direction_basis_missing, live
 * verifiziert 2026-07-10). "Divers"/unbekannt ⇒ null — die Route liefert
 * dann einen ehrlichen Missing-State statt einer erfundenen Richtung.
 */
export function buildDayunPayload(input: ValidatedBirthInput): DayunRequestPayload | null {
  const g = (input.gender || "").toLowerCase();
  const sex = g === "männlich" || g === "male" ? "male"
    : g === "weiblich" || g === "female" ? "female"
    : null;
  if (!sex) return null;
  return {
    // Live-verifiziertes Schema: Minutenpräzision "YYYY-MM-DDTHH:mm" —
    // bewusst NICHT localIsoDatetime, das hängt ":00"-Sekunden an.
    date: `${input.birthDate}T${input.birthTime}`,
    tz: input.tz,
    lat: input.lat,
    lon: input.lon,
    sex_at_birth: sex,
    direction_method: "year_stem_yinyang_and_sex"
  };
}

/**
 * DailyRequest requires 12 soulprint sectors AND 12 quiz sectors. The
 * soulprint sectors come from the engine's own /v1/experience/bootstrap
 * response — never fabricated locally. The app has no quiz feature, so the
 * soulprint is mirrored into quiz_sectors as the only honest sector signal.
 */
export function buildDailyPayload(
  input: ValidatedBirthInput,
  soulprintSectors: number[],
  targetDate?: string
): DailyRequestPayload {
  return {
    birth: buildBirthInput(input),
    soulprint_sectors: soulprintSectors,
    quiz_sectors: soulprintSectors,
    target_date: targetDate || new Date().toISOString().slice(0, 10),
    locale: LOCALE
  };
}

/**
 * Pull the 12-sector soulprint out of a BootstrapResponse. Returns null when
 * the upstream response does not carry a valid ring — callers must treat that
 * as an upstream failure instead of inventing sector values.
 */
export function extractSoulprintSectors(bootstrapResponse: unknown): number[] | null {
  const sectors = (bootstrapResponse as any)?.soulprint_sectors;
  if (!Array.isArray(sectors) || sectors.length !== 12) return null;
  if (!sectors.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  return sectors;
}
