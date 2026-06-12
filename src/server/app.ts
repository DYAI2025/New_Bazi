import express, { Express, Request, Response, NextFunction } from "express";
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
import { fuseElementalWeights } from "../utils/tensionPair";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function localFallbackEnabled(): boolean {
  return process.env.ENABLE_LOCAL_ASTROLOGY_FALLBACK === "true";
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
  res.status(status).json({
    error: (err && err.code) || "internal_error",
    message: err && err.message ? String(err.message) : "Unerwarteter Fehler."
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
function normalizeDaily(daily: any): DailyPulseVM {
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

  // Available = the engine delivered real user-facing content for the day.
  const available = Boolean(description || western || eastern);
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
    available
  };
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
  app.use(express.json());

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
        { feature: "dayun", appEndpoint: "/api/azodiac/bazi/dayun", upstream: "—", status: "missing-capability", source: "missing" },
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
    try {
      res.json(await getTimezone(Number(lat), Number(lon), timestamp ? Number(timestamp) : undefined));
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
      const bootstrap = await FuFirEClient.postExperienceBootstrap(buildBootstrapPayload(value));
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
      res.json(normalizeDaily(daily));
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
      res.json({
        ...comparison,
        source: "fufire-profiles-local-comparison",
        userRef: { name: a.viewModel.identity.name, sunSign: a.viewModel.western.sunSign, dayMaster: a.viewModel.bazi.dayMaster.element },
        partnerRef: { name: b.viewModel.identity.name, sunSign: b.viewModel.western.sunSign, dayMaster: b.viewModel.bazi.dayMaster.element },
        // Additiv (Spannungsnavigator-Paar-Modus): per-Element-Verteilung beider
        // Personen aus deren bereits aufgelösten Fusion-Daten — die Route holt
        // ohnehin beide vollen FuFirE-Profile, kein zusätzlicher Engine-Call.
        // Leer ([]), wenn ein Profil kein elemental_comparison liefert.
        elementalA: fuseElementalWeights(a.viewModel.fusion.elementalComparison),
        elementalB: fuseElementalWeights(b.viewModel.fusion.elementalComparison)
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // --- Dayun: honest missing-capability ---

  app.post("/api/azodiac/bazi/dayun", (_req, res) => {
    res.json({
      available: false,
      status: "missing-capability",
      source: "missing",
      message: "Da Yun ist nicht berechenbar, weil FuFirE aktuell keinen stabilen Dayun-Endpunkt liefert."
    });
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

  return app;
}
