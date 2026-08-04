import { FuFirEClient, FuFirePayload } from "./fufireClient";
import {
  buildWesternPayload,
  buildBaziPayload,
  buildWuxingPayload,
  buildFusionPayload
} from "./fufirePayloadMappers";
import { normalizeFuFireProfile, getRawSimulatedProfileFromLocal } from "./fufireNormalizer";
import { ProfileViewModel, ProfileSource } from "../viewmodels/profileViewModel";
import type { ValidatedBirthInput } from "./birthInputValidation";

export interface ProfileServiceResult {
  viewModel: ProfileViewModel;
  source: ProfileSource;
}

/** Map validated birth input to the FuFirE /chart contract (chart is mounted outside /v1). */
export function buildFuFirEPayload(input: ValidatedBirthInput): FuFirePayload {
  return {
    local_datetime: `${input.birthDate}T${input.birthTime}:00`,
    tz_id: input.tz,
    geo_lat_deg: input.lat,
    geo_lon_deg: input.lon,
    time_standard: "CIVIL",
    day_boundary: "midnight",
    include_validation: true
  };
}

/**
 * Extract a known section from an upstream response that may either return the
 * section directly or wrap it under its key. Shapes are not contractually
 * verified yet, so we accept both forms.
 */
export function pickSection(resp: any, key: string): any {
  if (!resp || typeof resp !== "object") return undefined;
  if (resp[key]) return resp[key];
  return resp;
}

/**
 * Primary product path. Calls FuFirE /chart (unprefixed); if the chart is missing core
 * sections, orchestrates the matching /v1/calculate/* endpoints and merges.
 * Throws FuFirEError (with httpStatus) on any upstream/config failure — never
 * falls back silently.
 */
export async function buildProfile(input: ValidatedBirthInput): Promise<ProfileServiceResult> {
  const payload = buildFuFirEPayload(input);
  const chart = await FuFirEClient.postChart(payload);

  const raw: any = { ...(chart || {}) };
  let orchestrated = false;

  const needs = {
    western: !raw.western,
    bazi: !raw.bazi,
    wuxing: !raw.wuxing,
    fusion: !raw.fusion
  };

  if (needs.western || needs.bazi || needs.wuxing || needs.fusion) {
    // The /v1/calculate/* endpoints use their OWN request models (date/tz/lon/lat),
    // not the /chart shape — each call gets its endpoint-specific mapped payload.
    //
    // FUFIRE-ORCH-01: allSettled statt all. Ein einzelner transienter Upstream-Fehler
    // (429/503/Timeout) einer Sektion darf NICHT das gesamte Profil scheitern lassen —
    // der Normalizer rendert für eine fehlende Sektion einen ehrlichen Missing-State.
    // Nur wenn KEINE Sektion (weder aus /chart noch aus der Orchestrierung) verfügbar
    // ist, wird der erste Fehler geworfen, damit ein Totalausfall als retrybarer 502
    // sichtbar bleibt statt als hohles Profil. Config-Lücken werfen immer weiter,
    // damit der Local-Fallback-Pfad in resolveProfile weiter greift.
    const jobs: Array<{ section: "western" | "bazi" | "wuxing" | "fusion"; run: Promise<any> }> = [];
    if (needs.western) jobs.push({ section: "western", run: FuFirEClient.postWestern(buildWesternPayload(input)) });
    if (needs.bazi) jobs.push({ section: "bazi", run: FuFirEClient.postBazi(buildBaziPayload(input)) });
    if (needs.wuxing) jobs.push({ section: "wuxing", run: FuFirEClient.postWuxing(buildWuxingPayload(input)) });
    if (needs.fusion) jobs.push({ section: "fusion", run: FuFirEClient.postFusion(buildFusionPayload(input)) });

    const settled = await Promise.allSettled(jobs.map((j) => j.run));
    let firstError: any = null;
    settled.forEach((result, i) => {
      const { section } = jobs[i];
      if (result.status === "fulfilled") {
        raw[section] = pickSection(result.value, section);
      } else {
        const reason = result.reason;
        // Config-Lücke (fehlende FuFirE-URL/-Key) ist nicht transient: sofort weiterwerfen,
        // damit resolveProfile den opt-in Local-Fallback auslösen kann.
        if (reason?.code === "missing_fufire_url" || reason?.code === "missing_fufire_key") throw reason;
        if (!firstError) firstError = reason;
      }
    });

    const haveAnySection = Boolean(raw.western || raw.bazi || raw.wuxing || raw.fusion);
    if (!haveAnySection && firstError) throw firstError;
    orchestrated = true;
  }

  const source: ProfileSource = orchestrated ? "fufire-orchestrated" : "fufire-chart";
  const viewModel = normalizeFuFireProfile(raw, input, source);
  return { viewModel, source };
}

/**
 * Explicit, clearly-labelled local fallback. Only invoked by the route when
 * ENABLE_LOCAL_ASTROLOGY_FALLBACK=true. The resulting viewModel is marked
 * fallback-local across every provenance entry.
 */
export function buildLocalFallbackProfile(input: ValidatedBirthInput): ProfileServiceResult {
  const raw = getRawSimulatedProfileFromLocal(input);
  const viewModel = normalizeFuFireProfile(raw, input, "fallback-local");
  return { viewModel, source: "fallback-local" };
}
