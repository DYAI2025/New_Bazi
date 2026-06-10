import express, { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

import { FuFirEClient } from "../utils/fufireClient";
import {
  getAutocompletePredictions,
  getPlaceDetails,
  getTimezone
} from "../utils/mapsService";
import { validateBirthInput, ValidatedBirthInput } from "../utils/birthInputValidation";
import {
  buildProfile,
  buildLocalFallbackProfile,
  buildFuFirEPayload,
  pickSection,
  ProfileServiceResult
} from "../utils/profileService";
import { normalizeFuFireProfile } from "../utils/fufireNormalizer";
import { compareProfiles } from "../utils/synastry";

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

function normalizeDaily(daily: any): {
  date: string;
  qiResonance: number | null;
  dominantPhase: string | null;
  coachingKeyword: string | null;
  description: string | null;
  source: "fufire" | "missing";
  available: boolean;
} {
  const d = daily || {};
  const qiResonance = typeof d.qiResonance === "number" ? d.qiResonance
    : typeof d.qi_resonance === "number" ? d.qi_resonance : null;
  const dominantPhase = d.dominantPhase || d.dominant_phase || null;
  const coachingKeyword = d.coachingKeyword || d.coaching_keyword || null;
  const description = d.description || d.text || null;

  // Require user-facing text: a bare metric without a description is treated as missing.
  const available = Boolean(description) && (qiResonance !== null || Boolean(dominantPhase));
  return {
    date: new Date().toISOString().split("T")[0],
    qiResonance,
    dominantPhase,
    coachingKeyword,
    description,
    source: available ? "fufire" : "missing",
    available
  };
}

// --- Detail endpoint factory ---

type ChartMethod = "postWestern" | "postBazi" | "postWuxing" | "postFusion";
function detailHandler(method: ChartMethod, key: "western" | "bazi" | "wuxing" | "fusion") {
  return async (req: Request, res: Response): Promise<void> => {
    const { valid, errors, value } = validateBirthInput(req.body || {});
    if (!valid || !value) {
      logInvalidBirthInput(req.path, errors);
      res.status(400).json({ error: "invalid_birth_input", fields: errors });
      return;
    }
    try {
      const payload = buildFuFirEPayload(value);
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
        { feature: "profile", appEndpoint: "/api/azodiac/profile", upstream: "/v1/chart (+ /v1/calculate/*)", status: fufire.url && fufire.key ? "server-used" : "missing", source: fufire.url && fufire.key ? "fufire" : "missing" },
        { feature: "western", appEndpoint: "/api/azodiac/western", upstream: "/v1/calculate/western", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "bazi", appEndpoint: "/api/azodiac/bazi", upstream: "/v1/calculate/bazi", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "wuxing", appEndpoint: "/api/azodiac/wuxing", upstream: "/v1/calculate/wuxing", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "fusion", appEndpoint: "/api/azodiac/fusion", upstream: "/v1/calculate/fusion", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "daily", appEndpoint: "/api/azodiac/daily", upstream: "/v1/experience/bootstrap + /v1/experience/daily", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire" },
        { feature: "synastry", appEndpoint: "/api/azodiac/synastry", upstream: "2× /v1/chart + lokaler Vergleich", status: fufire.url && fufire.key ? "server-used" : "missing", source: "fufire-profiles-local-comparison" },
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
      endpoints: ["/v1/chart", "/v1/calculate/western", "/v1/calculate/bazi", "/v1/calculate/wuxing", "/v1/calculate/fusion", "/v1/calculate/tst", "/v1/experience/bootstrap", "/v1/experience/daily", "/v1/info/wuxing-mapping"]
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
    try {
      const payload = buildFuFirEPayload(value);
      await FuFirEClient.postExperienceBootstrap(payload);
      const daily = await FuFirEClient.postExperienceDaily(payload);
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
        partnerRef: { name: b.viewModel.identity.name, sunSign: b.viewModel.western.sunSign, dayMaster: b.viewModel.bazi.dayMaster.element }
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

  return app;
}
