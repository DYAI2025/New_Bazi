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
    const jobs: Promise<void>[] = [];
    if (needs.western) {
      jobs.push(FuFirEClient.postWestern(buildWesternPayload(input)).then((r) => { raw.western = pickSection(r, "western"); }));
    }
    if (needs.bazi) {
      jobs.push(FuFirEClient.postBazi(buildBaziPayload(input)).then((r) => { raw.bazi = pickSection(r, "bazi"); }));
    }
    if (needs.wuxing) {
      jobs.push(FuFirEClient.postWuxing(buildWuxingPayload(input)).then((r) => { raw.wuxing = pickSection(r, "wuxing"); }));
    }
    if (needs.fusion) {
      jobs.push(FuFirEClient.postFusion(buildFusionPayload(input)).then((r) => { raw.fusion = pickSection(r, "fusion"); }));
    }
    await Promise.all(jobs);
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
