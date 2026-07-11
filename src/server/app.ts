import express, { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { getServerSupabase } from "./supabase";
import { requireUserAuth } from "./requireUserAuth";
import { GoogleGenAI } from "@google/genai";

import { FuFirEClient } from "../utils/fufireClient";
import {
  getAutocompletePredictions,
  getPlaceDetails,
  getTimezone
} from "../utils/mapsService";
import { validateBirthInput, ValidatedBirthInput } from "../utils/birthInputValidation";
import {
  buildWesternPayload,
  buildBaziPayload,
  buildWuxingPayload,
  buildFusionPayload,
  buildBootstrapPayload,
  buildDailyPayload,
  buildDayunPayload,
  extractSoulprintSectors
} from "../utils/fufirePayloadMappers";
import {
  buildProfile,
  buildLocalFallbackProfile,
  pickSection,
  ProfileServiceResult
} from "../utils/profileService";
import { normalizeFuFireProfile } from "../utils/fufireNormalizer";
import { compareProfiles } from "../utils/synastry";
import { fuseElementalWeights, derivePairAxes } from "../utils/tensionPair";
import { computeInterAspects, bodyPositionsFromViewModel } from "../utils/interAspects";
import { compareBaziPillars } from "../utils/baziCompare";
import { CouncilEntry, DayPulseMode, councilOfSix, deriveIntensity, deriveMode } from "../utils/daily/dayPulse";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function localFallbackEnabled(): boolean {
  return process.env.ENABLE_LOCAL_ASTROLOGY_FALLBACK === "true";
}

// --- Rate limiting (SEC-RATELIMIT-01) -------------------------------------------
// Skipped under test (NODE_ENV=test / DISABLE_RATE_LIMIT=true) so the supertest
// suite is never throttled; RATE_LIMIT_FORCE re-enables it for the dedicated
// rate-limit test. Only POST requests are counted, so the cheap GET probes
// (/api/health is Railway's healthcheck) are never throttled.
function rateLimitSkipped(): boolean {
  if (process.env.RATE_LIMIT_FORCE === "true") return false;
  return process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true";
}

function makeRateLimiter(limit: number, skipExtra?: (req: Request) => boolean) {
  return rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    skip: (req: Request) => rateLimitSkipped() || req.method !== "POST" || (skipExtra ? skipExtra(req) : false),
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: "rate_limited",
        message: "Zu viele Anfragen in kurzer Zeit. Bitte versuche es gleich noch einmal."
      });
    }
  });
}

function logInvalidBirthInput(route: string, errors: unknown): void {
  const fields = Array.isArray(errors)
    ? errors
        .map((error: any) => {
          const field = error?.field;
          const side = error?.side;

          if (!field) return null;

          // Normalize to dot-notation: "user.tz", "partner.birthDate"
          return side ? `${side}.${field}` : String(field);
        })
        .filter((value): value is string => Boolean(value))
    : typeof errors === "string"
      ? [errors]
      : [];

  console.warn("invalid_birth_input", { route, fields });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Send a typed error, never leaking secrets or stack traces to the browser. */
function sendError(res: Response, err: any, fallbackStatus = 500): void {
  const status = err && typeof err.httpStatus === "number" ? err.httpStatus : fallbackStatus;
  // API-DP-005 (PRD Day Pulse): typisierte Fehler tragen retryable + correlationId.
  // retryable folgt der Status-Semantik (transiente Upstream-/Limit-Fehler),
  // explizites err.retryable gewinnt. Die correlationId landet auch im Log,
  // damit Nutzer-Reports serverseitig auffindbar sind — nie Stacktraces nach außen.
  const retryable = typeof err?.retryable === "boolean"
    ? err.retryable
    : status === 429 || status === 502 || status === 503 || status === 504;
  const correlationId = randomUUID();
  console.error("api_error", { correlationId, status, code: (err && err.code) || "internal_error" });
  res.status(status).json({
    error: (err && err.code) || "internal_error",
    message: err && err.message ? String(err.message) : "Unerwarteter Fehler.",
    retryable,
    correlationId
  });
}

function getFuFireConfigSummary(): { pathPrefix: string; releaseVersion: string | null; versionPrefix: string } {
  const pathPrefix = FuFirEClient.getPathPrefix();
  return {
    pathPrefix,
    releaseVersion: FuFirEClient.getReleaseVersion(),
    // Backward compatibility: versionPrefix now means actual route prefix, not release metadata.
    versionPrefix: pathPrefix
  };
}

/** FuFirE-first with explicit, opt-in local fallback only on missing config. */
async function resolveProfile(value: ValidatedBirthInput): Promise<ProfileServiceResult> {
  try {
    return await buildProfile(value);
  } catch (err: any) {
    const isConfigGap = err?.code === "missing_fufire_url" || err?.code === "missing_fufire_key";
    if (isConfigGap && localFallbackEnabled()) {
      return buildLocalFallbackProfile(value);
    }
    throw err;
  }
}

// --- Daily pulse from FuFirE experience (no local prose fabrication) ---

interface DailySectionVM {
  summary: string | null;
  themes: string[];
  caution: string | null;
  opportunity: string | null;
}

interface DailyEasternVM extends DailySectionVM {
  dayMaster: string | null;
  dailyPillar: { stem: string; branch: string } | null;
  relationToDayMaster: string | null;
  jieqi: string | null;
}

/** Westliche Evidenz — Tagespuls 2.0 braucht die Rohanker, nicht nur Prosa. */
interface DailyWestEvidenceVM {
  transitSectors: number[];
  natalFocus: string[];
}

/** Natal-Profil + 5D-Signatur aus dem Bootstrap — bisher nach extractSoulprintSectors verworfen. */
interface DailyNatalVM {
  sunSign: string | null;
  moonSign: string | null;
  ascendantSign: string | null;
  dayMaster: string | null;
  harmonyIndex: number | null;
  /** 5 WuXing-Gewichte der stabilen Signatur (signature_blueprint.elements). */
  elements: Record<string, number> | null;
}

interface DailyPulseVM {
  date: string;
  western: DailySectionVM | null;
  eastern: DailyEasternVM | null;
  fusion: { summary: string | null; synthesis: string | null } | null;
  action: string | null;
  pushText: string | null;
  pushworthy: boolean;
  jieqiNote: string | null;
  weekdayNote: string | null;
  description: string | null;
  source: "fufire" | "missing";
  available: boolean;
  /** Tagespuls 2.0 — Rohanker statt Wegwerfen (null = Engine liefert sie nicht). */
  westEvidence: DailyWestEvidenceVM | null;
  natal: DailyNatalVM | null;
  qualityFlags: Record<string, unknown> | null;
  /** PRD Day Pulse Stufe 1 — FR-DP-001/002/008: serverseitig, deterministisch. */
  mode: DayPulseMode | null;
  intensity: number | null;
  council: CouncilEntry[] | null;
}

function dailyText(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function dailySection(raw: any): DailySectionVM | null {
  if (!raw || typeof raw !== "object") return null;
  const section: DailySectionVM = {
    summary: dailyText(raw.summary),
    themes: Array.isArray(raw.themes) ? raw.themes.filter((t: unknown) => typeof t === "string" && t.trim() !== "") : [],
    caution: dailyText(raw.caution),
    opportunity: dailyText(raw.opportunity)
  };
  const hasContent = section.summary || section.caution || section.opportunity || section.themes.length > 0;
  return hasContent ? section : null;
}

/**
 * Maps the engine DailyResponse (see DailyFusion in the FuFirE OpenAPI spec)
 * into the view model. The engine sends western.*, eastern.* (incl. the
 * day-master daily reference under evidence), fusion.{summary,synthesis,action},
 * push_text/pushworthy and jieqi/weekday context notes — all of it is surfaced.
 * No metrics are invented: fields the engine does not send do not exist here.
 */
/** Zahlenliste defensiv extrahieren (Sektoren-Indizes bleiben roh — Labeling ist Etappe 2). */
function numberList(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((n): n is number => typeof n === "number" && Number.isFinite(n)) : [];
}

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.trim() !== "") : [];
}

/** 5D-Elementgewichte defensiv extrahieren; < 2 valide Einträge → null (nichts erfinden). */
function elementWeights(v: unknown): Record<string, number> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, number> = {};
  for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
    if (typeof raw === "number" && Number.isFinite(raw)) out[k] = raw;
  }
  return Object.keys(out).length >= 2 ? out : null;
}

/** Natal-Profil + Signatur aus der Bootstrap-Antwort — die Felder, die bisher verworfen wurden. */
function extractNatal(bootstrap: unknown): DailyNatalVM | null {
  if (!bootstrap || typeof bootstrap !== "object") return null;
  const b = bootstrap as any;
  const profile = b.profile && typeof b.profile === "object" ? b.profile : {};
  const blueprint = b.signature_blueprint && typeof b.signature_blueprint === "object" ? b.signature_blueprint : {};
  const natal: DailyNatalVM = {
    sunSign: dailyText(profile.sun_sign),
    moonSign: dailyText(profile.moon_sign),
    ascendantSign: dailyText(profile.ascendant_sign),
    dayMaster: dailyText(profile.day_master),
    harmonyIndex: typeof profile.harmony_index === "number" && Number.isFinite(profile.harmony_index)
      ? profile.harmony_index
      : null,
    elements: elementWeights(blueprint.elements)
  };
  const hasContent = natal.sunSign || natal.dayMaster || natal.elements;
  return hasContent ? natal : null;
}

function normalizeDaily(daily: any, bootstrap?: unknown): DailyPulseVM {
  const d = daily || {};
  const western = dailySection(d.western);

  const easternBase = dailySection(d.eastern);
  const evidence = d.eastern && typeof d.eastern === "object" && d.eastern.evidence && typeof d.eastern.evidence === "object"
    ? d.eastern.evidence
    : {};
  const pillarRaw = evidence.daily_pillar;
  const dailyPillar = pillarRaw && typeof pillarRaw === "object" && dailyText(pillarRaw.stem) && dailyText(pillarRaw.branch)
    ? { stem: String(pillarRaw.stem), branch: String(pillarRaw.branch) }
    : null;
  const eastern: DailyEasternVM | null = easternBase
    ? {
        ...easternBase,
        dayMaster: dailyText(evidence.day_master),
        dailyPillar,
        relationToDayMaster: dailyText(evidence.relation_to_day_master),
        jieqi: dailyText(evidence.jieqi)
      }
    : null;

  const f = d.fusion && typeof d.fusion === "object" ? d.fusion : null;
  const fusion = f ? { summary: dailyText(f.summary), synthesis: dailyText(f.synthesis) } : null;
  const fusionText = fusion ? fusion.synthesis || fusion.summary : null;
  const description = dailyText(d.description) || dailyText(d.text) || fusionText;

  // Context notes: fusion-level first, section-level as fallback.
  const jieqiNote = dailyText(f?.jieqi_note) || dailyText(d.eastern?.jieqi_note) || dailyText(d.western?.jieqi_note);
  const weekdayNote = dailyText(f?.weekday_note) || dailyText(d.western?.weekday_note) || dailyText(d.eastern?.weekday_note);

  // Tagespuls 2.0: westliche Rohanker durchreichen statt verwerfen.
  const westEv = d.western && typeof d.western === "object" && d.western.evidence && typeof d.western.evidence === "object"
    ? d.western.evidence
    : null;
  const westEvidence: DailyWestEvidenceVM | null = westEv
    ? { transitSectors: numberList(westEv.transit_sectors), natalFocus: stringList(westEv.natal_focus) }
    : null;

  const qualityFlags = d.quality_flags && typeof d.quality_flags === "object" && !Array.isArray(d.quality_flags)
    ? (d.quality_flags as Record<string, unknown>)
    : null;

  // Available = the engine delivered real user-facing content for the day.
  const available = Boolean(description || western || eastern);
  const natal = extractNatal(bootstrap);
  return {
    date: dailyText(d.date) || dailyText(d.target_date) || new Date().toISOString().split("T")[0],
    western,
    eastern,
    fusion: fusion && (fusion.summary || fusion.synthesis) ? fusion : null,
    action: f ? dailyText(f.action) : null,
    pushText: f ? dailyText(f.push_text) : null,
    pushworthy: Boolean(f?.pushworthy),
    jieqiNote,
    weekdayNote,
    description,
    source: available ? "fufire" : "missing",
    available,
    westEvidence: westEvidence && (westEvidence.transitSectors.length || westEvidence.natalFocus.length) ? westEvidence : null,
    natal,
    qualityFlags,
    // FR-DP-001/002: Mode + Intensität deterministisch aus dem autoritativen
    // Harmony-Index; FR-DP-008: Rat der Sechs als sechs stabile Sitze mit
    // availability + Grund. Kein Index / kein Profil → ehrlich null.
    mode: deriveMode(natal?.harmonyIndex),
    intensity: deriveIntensity(natal?.harmonyIndex),
    council: natal
      ? councilOfSix({
          sunSign: natal.sunSign,
          moonSign: natal.moonSign,
          ascendantSign: natal.ascendantSign,
          dayMaster: natal.dayMaster,
          elements: natal.elements
        })
      : null
  };
}

/**
 * Bootstrap-Cache: die Bootstrap-Antwort hängt nur von den Geburtsdaten ab,
 * nicht vom Zieldatum — bisher wurden pro Tagesklick ZWEI Upstream-Calls
 * ausgelöst und die Bootstrap-Antwort bis auf soulprint_sectors verworfen.
 * Der Cache ist bewusst klein und kurzlebig (kein persistenter User-Store).
 */
const BOOTSTRAP_TTL_MS = 60 * 60 * 1000;
const BOOTSTRAP_CACHE_MAX = 200;
const bootstrapCache = new Map<string, { at: number; data: unknown }>();

function bootstrapCacheKey(value: ValidatedBirthInput): string {
  // Nur chart-relevante Felder — der Name ändert die Berechnung nicht.
  return JSON.stringify([value.birthDate, value.birthTime, value.lat, value.lon, value.tz, value.gender, value.timeKnown]);
}

async function getBootstrapCached(value: ValidatedBirthInput): Promise<unknown> {
  const key = bootstrapCacheKey(value);
  const hit = bootstrapCache.get(key);
  if (hit && Date.now() - hit.at < BOOTSTRAP_TTL_MS) return hit.data;
  const data = await FuFirEClient.postExperienceBootstrap(buildBootstrapPayload(value));
  bootstrapCache.delete(key);
  bootstrapCache.set(key, { at: Date.now(), data });
  if (bootstrapCache.size > BOOTSTRAP_CACHE_MAX) {
    const oldest = bootstrapCache.keys().next().value;
    if (oldest !== undefined) bootstrapCache.delete(oldest);
  }
  return data;
}

/** Für Tests: deterministischer Zustand ohne Prozess-Neustart. */
export function clearBootstrapCache(): void {
  bootstrapCache.clear();
}

// --- Transit-Now: globaler Himmel (nicht profilspezifisch) — 10-min-Cache ---
const TRANSIT_TTL_MS = 10 * 60 * 1000;
let transitCache: { at: number; data: unknown } | null = null;

/** Für Tests: deterministischer Zustand ohne Prozess-Neustart. */
export function clearTransitCache(): void {
  transitCache = null;
}

/**
 * Tagesnavigation: the UI may request a specific target_date (±7 days around
 * today). One extra day of tolerance absorbs the timezone skew between the
 * browser's local date and the server clock.
 */
const DAILY_TARGET_RANGE_DAYS = 7;

function resolveTargetDate(raw: unknown): { value?: string; error?: string } {
  if (raw === undefined || raw === null || raw === "") return {};
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: "targetDate muss das Format YYYY-MM-DD haben." };
  }
  const target = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(target.getTime()) || target.toISOString().slice(0, 10) !== raw) {
    return { error: "targetDate ist kein gueltiger Kalendertag." };
  }
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (Math.abs(diffDays) > DAILY_TARGET_RANGE_DAYS + 1) {
    return { error: `targetDate darf hoechstens ${DAILY_TARGET_RANGE_DAYS} Tage vom heutigen Datum abweichen.` };
  }
  return { value: raw };
}

// --- Detail endpoint factory ---

type ChartMethod = "postWestern" | "postBazi" | "postWuxing" | "postFusion";

// Each /v1/calculate/* endpoint has its own request model (NOT the /chart
// shape) — pick the matching mapper per upstream method.
const DETAIL_PAYLOAD_BUILDERS: Record<ChartMethod, (input: ValidatedBirthInput) => unknown> = {
  postWestern: buildWesternPayload,
  postBazi: buildBaziPayload,
  postWuxing: buildWuxingPayload,
  postFusion: buildFusionPayload
};

function detailHandler(method: ChartMethod, key: "western" | "bazi" | "wuxing" | "fusion") {
  return async (req: Request, res: Response): Promise<void> => {
    const { valid, errors, value } = validateBirthInput(req.body || {});
    if (!valid || !value) {
      logInvalidBirthInput(req.path, errors);
      res.status(400).json({ error: "invalid_birth_input", fields: errors });
      return;
    }
    try {
      const payload = DETAIL_PAYLOAD_BUILDERS[method](value);
      const resp = await (FuFirEClient[method] as (p: any) => Promise<any>)(payload);
      const raw: any = { [key]: pickSection(resp, key) };
      const vm = normalizeFuFireProfile(raw, value, "fufire-orchestrated");
      res.json({ source: "fufire", [key]: (vm as any)[key], provenance: vm.provenance });
    } catch (err) {
      sendError(res, err);
    }
  };
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

export function createApp(): Express {
  const app = express();
  // Behind Railway's single edge proxy: trust exactly one hop so req.ip is the real
  // client (from X-Forwarded-For), not the proxy — and not client-spoofable past that
  // one hop. Never `true` (fully spoofable, would defeat the limiter).
  app.set("trust proxy", 1);
  app.use(express.json());

  // SEC-RATELIMIT-01: cap anonymous abuse of the billable upstream routes (paid
  // Gemini tokens, FuFirE quota). A generous global net over all POSTs (autocomplete
  // is exempt — it fires per debounced keystroke and must not 429 a typing user),
  // plus a strict cap on /api/azodiac + /api/gemini. All thresholds env-tunable.
  app.use("/api", makeRateLimiter(
    Number(process.env.RATE_LIMIT_GLOBAL_MAX || 300),
    (req) => req.path === "/places/autocomplete"
  ));
  app.use(["/api/azodiac", "/api/gemini"], makeRateLimiter(Number(process.env.RATE_LIMIT_COMPUTE_MAX || 20)));

  // --- Config / Health ---

  app.get("/api/config", (_req, res) => {
    const fufire = FuFirEClient.isConfigured();
    res.json({
      status: "operational",
      version: "2.0.0-fufire-bff",
      fufire: {
        baseUrlConfigured: fufire.url,
        apiKeyConfigured: fufire.key,
        ...getFuFireConfigSummary()
      },
      places: {
        // Keyless providers: Photon (OSM) for search, tz-lookup offline for timezones.
        provider: "photon+tz-lookup",
        keyRequired: false
      },
      flags: {
        localAstrologyFallback: localFallbackEnabled(),
        demoProfiles: process.env.ENABLE_DEMO_PROFILES === "true"
      },
      capabilities: [
        { feature: "profile", appEndpoint: "/api/azodiac/profile", upstream: "/chart (+ /v1/calculate/*)", status: fufire.url && fufire.key ? "server-used" : "missing", source: fufire.url && fufire.key ? "fufire" : "missing" },
        { feature: "western", appEndpoint: "/api/azodiac/western", upstream: "/v1/calculate/western", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "bazi", appEndpoint: "/api/azodiac/bazi", upstream: "/v1/calculate/bazi", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "wuxing", appEndpoint: "/api/azodiac/wuxing", upstream: "/v1/calculate/wuxing", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "fusion", appEndpoint: "/api/azodiac/fusion", upstream: "/v1/calculate/fusion", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "daily", appEndpoint: "/api/azodiac/daily", upstream: "/v1/experience/bootstrap + /v1/experience/daily", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "synastry", appEndpoint: "/api/azodiac/synastry", upstream: "2× /chart + lokaler Vergleich", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire-profiles-local-comparison" },
        { feature: "dayun", appEndpoint: "/api/azodiac/bazi/dayun", upstream: "/v1/calculate/bazi/dayun", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "places", appEndpoint: "/api/places/*", upstream: "Photon (OSM) + tz-lookup (offline)", status: "server-used", source: "photon" }
      ]
    });
  });

  app.get("/api/health", async (_req, res) => {
    const fufire = await FuFirEClient.probeHealth();
    res.json({ status: "ok", app: "ok", fufire, time: new Date().toISOString() });
  });

  app.get("/api/fufire/health", async (_req, res) => {
    const fufire = await FuFirEClient.probeHealth();
    res.status(fufire === "ok" ? 200 : 503).json({ fufire });
  });

  app.get("/api/fufire/capabilities", (_req, res) => {
    const fufire = FuFirEClient.isConfigured();
    res.json({
      baseUrlConfigured: fufire.url,
      apiKeyConfigured: fufire.key,
      ...getFuFireConfigSummary(),
      endpoints: ["/chart", "/v1/calculate/western", "/v1/calculate/bazi", "/v1/calculate/wuxing", "/v1/calculate/fusion", "/v1/calculate/tst", "/v1/experience/bootstrap", "/v1/experience/daily", "/v1/info/wuxing-mapping"]
    });
  });

  // --- Places / Timezone ---

  app.post("/api/places/autocomplete", async (req, res) => {
    try {
      const predictions = await getAutocompletePredictions(req.body?.input || "");
      res.json(predictions);
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post("/api/places/details", async (req, res) => {
    const { placeId } = req.body || {};
    if (!placeId) {
      res.status(400).json({ error: "missing_place_id" });
      return;
    }
    try {
      res.json(await getPlaceDetails(placeId));
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post("/api/timezone", async (req, res) => {
    const { lat, lon, timestamp } = req.body || {};
    if (lat === undefined || lon === undefined) {
      res.status(400).json({ error: "missing_coordinates" });
      return;
    }
    const latN = Number(lat);
    const lonN = Number(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN) || latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
      res.status(400).json({ error: "invalid_coordinates" });
      return;
    }
    let tsN: number | undefined;
    if (timestamp !== undefined && timestamp !== null && timestamp !== "") {
      tsN = Number(timestamp);
      if (!Number.isFinite(tsN)) {
        res.status(400).json({ error: "invalid_timestamp" });
        return;
      }
    }
    try {
      res.json(await getTimezone(latN, lonN, tsN));
    } catch (err) {
      sendError(res, err);
    }
  });

  // Geocode: server-side delegation only. No default location ever.
  app.post("/api/geocode", async (req, res) => {
    const { placeId } = req.body || {};
    if (!placeId) {
      res.status(400).json({ error: "missing_place_id", message: "Ein placeId aus der Vorschlagsliste ist erforderlich." });
      return;
    }
    try {
      const det = await getPlaceDetails(placeId);
      const tz = await getTimezone(det.lat, det.lon);
      // tz_id is the timestamp-independent contract used downstream. We do NOT
      // return a utcOffsetMinutes here because it would reflect "now", not the
      // birth instant, and would be wrong for historical births.
      res.json({
        place: det.name,
        formattedAddress: det.formattedAddress,
        latitude: det.lat,
        longitude: det.lon,
        tz: tz.tz,
        status: "resolved"
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Profile (FuFirE-first) ---

  app.post("/api/azodiac/profile", async (req, res) => {
    const { valid, errors, value } = validateBirthInput(req.body || {});
    if (!valid || !value) {
      logInvalidBirthInput(req.path, errors);
      res.status(400).json({ error: "invalid_birth_input", fields: errors });
      return;
    }
    try {
      const { viewModel } = await resolveProfile(value);
      res.json(viewModel);
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Detail endpoints ---

  app.post("/api/azodiac/western", detailHandler("postWestern", "western"));
  app.post("/api/azodiac/bazi", detailHandler("postBazi", "bazi"));
  app.post("/api/azodiac/wuxing", detailHandler("postWuxing", "wuxing"));
  app.post("/api/azodiac/fusion", detailHandler("postFusion", "fusion"));

  // --- Daily pulse (FuFirE experience) ---

  app.post("/api/azodiac/daily", async (req, res) => {
    const { valid, errors, value } = validateBirthInput(req.body || {});
    if (!valid || !value) {
      logInvalidBirthInput(req.path, errors);
      res.status(400).json({ error: "invalid_birth_input", fields: errors });
      return;
    }
    const targetDate = resolveTargetDate((req.body || {}).targetDate);
    if (targetDate.error) {
      res.status(400).json({ error: "invalid_target_date", message: targetDate.error });
      return;
    }
    try {
      // BootstrapRequest/DailyRequest wrap a BirthInput — NOT the /chart shape.
      // Gecacht pro Geburtsdaten: die Tagesnavigation (±7 Tage) löst sonst
      // zwei Upstream-Calls pro Klick aus.
      const bootstrap = await getBootstrapCached(value);
      // DailyRequest requires the 12-sector soulprint from the bootstrap
      // response. Never fabricate sectors — missing ring = upstream failure.
      const sectors = extractSoulprintSectors(bootstrap);
      if (!sectors) {
        sendError(res, {
          code: "fufire_unavailable",
          httpStatus: 502,
          message: "FuFirE-Bootstrap lieferte keine gueltigen Soulprint-Sektoren."
        });
        return;
      }
      const daily = await FuFirEClient.postExperienceDaily(buildDailyPayload(value, sectors, targetDate.value));
      // Tagespuls 2.0: Bootstrap-Profil + 5D-Signatur wandern mit ins VM,
      // statt nach extractSoulprintSectors verworfen zu werden.
      res.json(normalizeDaily(daily, bootstrap));
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Transit-Now: aktueller Himmel für alle Nutzer gleich ---

  app.get("/api/azodiac/transit/now", async (_req, res) => {
    if (transitCache && Date.now() - transitCache.at < TRANSIT_TTL_MS) {
      res.json(transitCache.data);
      return;
    }
    try {
      const raw: any = await FuFirEClient.getTransitNow();
      // Ehrliche Durchreichung: Planet-Shapes (0-Index-Sektoren) bleiben roh,
      // das Labeling ist Client-Sache. Fehler werden bewusst NICHT gecacht.
      const planets = raw?.planets && typeof raw.planets === "object" && !Array.isArray(raw.planets) ? raw.planets : {};
      const vm = { computedAt: dailyText(raw?.computed_at), planets };
      transitCache = { at: Date.now(), data: vm };
      res.json(vm);
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Synastry (two FuFirE profiles, local comparison) ---

  app.post("/api/azodiac/synastry", async (req, res) => {
    const { userBirthData, partnerBirthData } = req.body || {};
    const userV = validateBirthInput(userBirthData || {});
    const partnerV = validateBirthInput(partnerBirthData || {});
    if (!userV.valid || !partnerV.valid || !userV.value || !partnerV.value) {
      logInvalidBirthInput(req.path, { user: userV.errors, partner: partnerV.errors });
      res.status(400).json({
        error: "invalid_birth_input",
        fields: { user: userV.errors, partner: partnerV.errors }
      });
      return;
    }
    try {
      const [a, b] = await Promise.all([resolveProfile(userV.value), resolveProfile(partnerV.value)]);
      const comparison = compareProfiles(a.viewModel, b.viewModel);
      // P7 (additiv, LOKAL): alle Paar-Felder werden aus den zwei bereits
      // aufgelösten ProfileViewModels abgeleitet — kein zusätzlicher FuFirE-Call.
      // Fehlt ein Datum, bleibt das Feld ehrlich leer ([]) statt erfundener Defaults.
      const comparisonA = a.viewModel.fusion.elementalComparison ?? [];
      const comparisonB = b.viewModel.fusion.elementalComparison ?? [];
      res.json({
        ...comparison,
        source: "fufire-profiles-local-comparison",
        userRef: { name: a.viewModel.identity.name, sunSign: a.viewModel.western.sunSign, dayMaster: a.viewModel.bazi.dayMaster.element },
        partnerRef: { name: b.viewModel.identity.name, sunSign: b.viewModel.western.sunSign, dayMaster: b.viewModel.bazi.dayMaster.element },
        // Spannungsnavigator-Paar-Modus: per-Element-Verteilung beider Personen.
        elementalA: fuseElementalWeights(comparisonA),
        elementalB: fuseElementalWeights(comparisonB),
        // P7 Partner-Journey-Ebenen:
        interAspects: computeInterAspects(bodyPositionsFromViewModel(a.viewModel), bodyPositionsFromViewModel(b.viewModel)),
        pillarComparison: compareBaziPillars(a.viewModel.bazi.pillars, b.viewModel.bazi.pillars),
        comparisonA,
        comparisonB,
        pairAxes: derivePairAxes(comparisonA, comparisonB)
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Dayun: echter FuFirE-Endpunkt (der frühere "nicht berechenbar"-Stub war faktisch falsch) ---

  app.post("/api/azodiac/bazi/dayun", async (req, res) => {
    const { valid, errors, value } = validateBirthInput(req.body || {});
    if (!valid || !value) {
      logInvalidBirthInput(req.path, errors);
      res.status(400).json({ error: "invalid_birth_input", fields: errors });
      return;
    }
    if (value.timeKnown === false) {
      // Ehrlich: Dayun-Start hängt an der exakten Geburtszeit (Distanz zum Jieqi);
      // mit der 12:00-Platzhalterzeit würde ein potenziell falscher Zyklus als echt
      // ausgeliefert (BIRTH-TIME-01-Klasse). Lieber sichtbar leer als still falsch.
      res.json({
        available: false,
        status: "missing-birth-time",
        source: "missing",
        message: "Die Dekaden-Säulen sind ohne belastbare Geburtszeit nicht seriös bestimmbar — der Startpunkt hängt an der exakten Zeit. Es wird bewusst nichts erfunden.",
        cycles: []
      });
      return;
    }
    const payload = buildDayunPayload(value);
    if (!payload) {
      // Ehrlich: ohne sex_at_birth keine Laufrichtung (Engine: 422 direction_basis_missing).
      res.json({
        available: false,
        status: "missing-direction-basis",
        source: "missing",
        message: "Die Dekaden-Laufrichtung ist ohne Geburtsgeschlecht nicht ableitbar — es wird bewusst keine Richtung erfunden.",
        cycles: []
      });
      return;
    }
    try {
      const resp = await FuFirEClient.postBaziDayun(payload);
      const d = resp?.dayun && typeof resp.dayun === "object" ? resp.dayun : null;
      const cyclesRaw = Array.isArray(d?.cycles) ? d.cycles : [];
      const cycles = cyclesRaw
        .filter((c: any) => c && c.pillar && typeof c.pillar === "object")
        .map((c: any) => ({
          sequence: typeof c.sequence === "number" ? c.sequence : null,
          ageLabel: Number.isFinite(c.age_start) && Number.isFinite(c.age_end)
            ? `${Math.round(c.age_start)}–${Math.round(c.age_end)}`
            : null,
          dateStart: dailyText(c.date_start),
          dateEnd: dailyText(c.date_end),
          stem: dailyText(c.pillar.stem),
          stemHanzi: dailyText(c.pillar.stem_cn),
          branch: dailyText(c.pillar.branch),
          branchHanzi: dailyText(c.pillar.branch_cn),
          element: dailyText(c.pillar.element),
          polarity: dailyText(c.pillar.polarity),
          tenGodDe: dailyText(c.relation_to_day_master?.label_de),
          isCurrent: Boolean(c.is_current)
        }));
      if (!d || cycles.length === 0) {
        res.json({ available: false, status: "missing", source: "missing", message: "FuFirE lieferte keine auswertbaren Dekaden-Zyklen.", cycles: [] });
        return;
      }
      res.json({
        available: true,
        source: "fufire",
        labelDe: dailyText(d.display_label_de) || "Dekaden-Säule",
        direction: dailyText(d.direction),
        startAgeYears: Number.isFinite(d.start?.start_age?.decimal_years) ? d.start.start_age.decimal_years : null,
        cycles
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Optional Gemini poetic reading (server-side key only) ---

  app.post("/api/gemini/reading", async (req, res) => {
    try {
      const { prompt } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "replace_me_optional") {
        res.json({
          text: "Gemini-Deutung ist optional und derzeit nicht konfiguriert (GEMINI_API_KEY fehlt).",
          fallback: true
        });
        return;
      }
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "Du bist ein weiser Astrologe für westliche Astrologie sowie chinesisches BaZi und Wu-Xing. Antworte in gehobenem, präzisem Deutsch ohne Emojis. Deine Deutung ist reflektierend, nicht deterministisch.",
          temperature: 0.8
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      // Never forward the raw SDK error text to the browser.
      console.error("Gemini provider error (server-side only):", error?.message);
      sendError(res, { code: "gemini_error", httpStatus: 502, message: "Gemini-Deutung ist derzeit nicht verfügbar." });
    }
  });

  // --- Profil-Routen (hinter requireUserAuth; Service-Role + expliziter Owner-Filter) ---

  app.get("/api/me/profiles", requireUserAuth, async (req, res) => {
    const supabase = getServerSupabase()!;
    const { data, error } = await supabase
      .from("nb_profiles")
      .select("id, label, birth_data, is_default, updated_at")
      .eq("user_id", req.userId!)
      .order("updated_at", { ascending: false });
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.json(data ?? []);
  });

  app.post("/api/me/profiles", requireUserAuth, async (req, res) => {
    const { label = "Mein Profil", birth_data, makeDefault = false } = req.body ?? {};
    const validation = validateBirthInput(birth_data ?? {});
    if (!validation.valid) {
      res.status(400).json({ error: "invalid_birth_input", fields: validation.errors });
      return;
    }
    const supabase = getServerSupabase()!;
    const userId = req.userId!;
    if (makeDefault) {
      const { error: clearErr } = await supabase
        .from("nb_profiles")
        .update({ is_default: false })
        .eq("user_id", userId);
      if (clearErr) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    }
    const { data, error } = await supabase
      .from("nb_profiles")
      .insert({ user_id: userId, label, birth_data, is_default: !!makeDefault })
      .select()
      .single();
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(201).json(data);
  });

  app.delete("/api/me/profiles/:id", requireUserAuth, async (req, res) => {
    if (!UUID_RE.test(req.params.id)) { res.status(400).json({ error: "invalid_id" }); return; }
    const supabase = getServerSupabase()!;
    const { error } = await supabase
      .from("nb_profiles")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId!);
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(204).send();
  });

  app.get("/api/me/partners", requireUserAuth, async (req, res) => {
    const supabase = getServerSupabase()!;
    const { data, error } = await supabase
      .from("nb_partner_profiles")
      .select("id, label, birth_data, created_at")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false });
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.json(data ?? []);
  });

  app.post("/api/me/partners", requireUserAuth, async (req, res) => {
    const { label, birth_data } = req.body ?? {};
    if (!label) {
      res.status(400).json({ error: "invalid_input", message: "label ist erforderlich." });
      return;
    }
    const validation = validateBirthInput(birth_data ?? {});
    if (!validation.valid) {
      res.status(400).json({ error: "invalid_birth_input", fields: validation.errors });
      return;
    }
    const supabase = getServerSupabase()!;
    const { data, error } = await supabase
      .from("nb_partner_profiles")
      .insert({ user_id: req.userId!, label, birth_data })
      .select()
      .single();
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(201).json(data);
  });

  app.delete("/api/me/partners/:id", requireUserAuth, async (req, res) => {
    if (!UUID_RE.test(req.params.id)) { res.status(400).json({ error: "invalid_id" }); return; }
    const supabase = getServerSupabase()!;
    const { error } = await supabase
      .from("nb_partner_profiles")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId!);
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(204).send();
  });

  // --- Tages-Reflexionen (Sync-Layer; localStorage bleibt Primärquelle) ---

  app.get("/api/me/reflections", requireUserAuth, async (req, res) => {
    const supabase = getServerSupabase()!;
    const { data, error } = await supabase
      .from("nb_daily_reflections")
      .select("date, day_type, reaction, encounter_choice, veto_choice, updated_at_ms")
      .eq("user_id", req.userId!)
      .order("date", { ascending: true });
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.json(data ?? []);
  });

  app.put("/api/me/reflections", requireUserAuth, async (req, res) => {
    const items = Array.isArray(req.body?.reflections) ? req.body.reflections : null;
    if (!items || items.length === 0 || items.length > 400) {
      res.status(400).json({ error: "invalid_input", message: "reflections (1–400 Einträge) erforderlich." });
      return;
    }
    const DAY_TYPES = ["ressource", "ausdruck", "einfluss", "struktur", "gleichrang"];
    const REACTIONS = [null, "kenne_ich", "teils", "gegenseite"];
    const rows = [];
    for (const r of items) {
      if (typeof r?.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) { res.status(400).json({ error: "invalid_input", message: "date muss YYYY-MM-DD sein." }); return; }
      if (!DAY_TYPES.includes(r.dayType)) { res.status(400).json({ error: "invalid_input", message: "unbekannter dayType." }); return; }
      if (!REACTIONS.includes(r.reaction ?? null)) { res.status(400).json({ error: "invalid_input", message: "unbekannte reaction." }); return; }
      rows.push({
        user_id: req.userId!,
        date: r.date,
        day_type: r.dayType,
        reaction: r.reaction ?? null,
        encounter_choice: typeof r.encounterChoice === "string" ? r.encounterChoice.slice(0, 120) : null,
        veto_choice: typeof r.vetoChoice === "string" ? r.vetoChoice.slice(0, 120) : null,
        updated_at_ms: Number.isFinite(r.updatedAt) ? r.updatedAt : Date.now()
      });
    }
    const supabase = getServerSupabase()!;
    const { error } = await supabase
      .from("nb_daily_reflections")
      .upsert(rows, { onConflict: "user_id,date" });
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(204).send();
  });

  app.delete("/api/me/reflections", requireUserAuth, async (req, res) => {
    const supabase = getServerSupabase()!;
    const { error } = await supabase
      .from("nb_daily_reflections")
      .delete()
      .eq("user_id", req.userId!);
    if (error) { sendError(res, { code: "db_error", httpStatus: 502, message: "Datenbankfehler." }); return; }
    res.status(204).send();
  });

  return app;
}
