/**
 * MANUAL live smoke test against the REAL FuFirE engine (network + API key!).
 * NOT part of the CI/vitest suite — run on demand:
 *
 *   FUFIRE_API_KEY=ff_..._yourkey npx tsx scripts/fufire-live-smoke.mts
 *
 * Optional: FUFIRE_API_URL (default https://api.fufire.space).
 *
 * Exercises the EXACT production code path (FuFirEClient + the per-endpoint
 * payload mappers) for Berlin 1990-06-15 14:30 and asserts upstream 200 plus
 * a plausible response field per endpoint. This is the decisive proof that
 * the mapped payloads satisfy the live engine schemas — green unit tests
 * alone do not prove that.
 */
import { FuFirEClient } from "../src/utils/fufireClient";
import { buildFuFirEPayload } from "../src/utils/profileService";
import {
  buildWesternPayload,
  buildBaziPayload,
  buildWuxingPayload,
  buildFusionPayload,
  buildBootstrapPayload,
  buildDailyPayload,
  extractSoulprintSectors
} from "../src/utils/fufirePayloadMappers";
import type { ValidatedBirthInput } from "../src/utils/birthInputValidation";

if (!process.env.FUFIRE_API_URL) process.env.FUFIRE_API_URL = "https://api.fufire.space";
if (!(process.env.FUFIRE_API_KEY || "").trim()) {
  console.error("FAIL: FUFIRE_API_KEY env var is required (never hardcoded). Run:");
  console.error("  FUFIRE_API_KEY=ff_..._yourkey npx tsx scripts/fufire-live-smoke.mts");
  process.exit(1);
}

const BERLIN: ValidatedBirthInput = {
  name: "Live Smoke",
  birthDate: "1990-06-15",
  birthTime: "14:30",
  placeId: "live-smoke-berlin",
  birthPlaceLabel: "Berlin",
  lat: 52.52,
  lon: 13.405,
  tz: "Europe/Berlin",
  gender: "Divers",
  timeKnown: true
};

let failures = 0;

async function check(label: string, run: () => Promise<any>, plausible: (resp: any) => string | null): Promise<any> {
  try {
    const resp = await run();
    const problem = plausible(resp);
    if (problem) {
      failures += 1;
      console.error(`FAIL  ${label}: 200 but implausible response — ${problem}`);
    } else {
      console.log(`PASS  ${label}`);
    }
    return resp;
  } catch (err: any) {
    failures += 1;
    console.error(`FAIL  ${label}: ${err?.code || err?.name || "error"} — ${err?.message || err}`);
    return null;
  }
}

console.log(`FuFirE live smoke against ${process.env.FUFIRE_API_URL} (Berlin 1990-06-15 14:30)\n`);

await check("POST /chart (regression — unchanged contract)",
  () => FuFirEClient.postChart(buildFuFirEPayload(BERLIN)),
  (r) => (r?.positions && r?.bazi ? null : `missing positions/bazi keys: ${Object.keys(r || {}).join(", ")}`));

await check("POST /v1/calculate/western",
  () => FuFirEClient.postWestern(buildWesternPayload(BERLIN)),
  (r) => (r?.bodies && r?.houses ? null : `missing bodies/houses keys: ${Object.keys(r || {}).join(", ")}`));

await check("POST /v1/calculate/bazi",
  () => FuFirEClient.postBazi(buildBaziPayload(BERLIN)),
  (r) => (r?.pillars ? null : `missing pillars key: ${Object.keys(r || {}).join(", ")}`));

await check("POST /v1/calculate/wuxing",
  () => FuFirEClient.postWuxing(buildWuxingPayload(BERLIN)),
  (r) => (r?.wu_xing_vector ? null : `missing wu_xing_vector key: ${Object.keys(r || {}).join(", ")}`));

await check("POST /v1/calculate/fusion",
  () => FuFirEClient.postFusion(buildFusionPayload(BERLIN)),
  (r) => (typeof r?.harmony_index === "number" || r?.wu_xing_vectors ? null : `missing harmony_index/wu_xing_vectors: ${Object.keys(r || {}).join(", ")}`));

const bootstrap = await check("POST /v1/experience/bootstrap",
  () => FuFirEClient.postExperienceBootstrap(buildBootstrapPayload(BERLIN)),
  (r) => (extractSoulprintSectors(r) ? null : `no valid 12-sector soulprint: ${Object.keys(r || {}).join(", ")}`));

const sectors = extractSoulprintSectors(bootstrap);
if (sectors) {
  await check("POST /v1/experience/daily",
    () => FuFirEClient.postExperienceDaily(buildDailyPayload(BERLIN, sectors)),
    (r) => (r?.fusion && (r.fusion.synthesis || r.fusion.summary) ? null : `missing fusion synthesis/summary: ${Object.keys(r || {}).join(", ")}`));
} else {
  failures += 1;
  console.error("FAIL  POST /v1/experience/daily: skipped — bootstrap delivered no soulprint sectors");
}

console.log("");
if (failures > 0) {
  console.error(`FUFIRE LIVE SMOKE FAILED (${failures} failing endpoint(s))`);
  process.exit(1);
}
console.log("FUFIRE LIVE SMOKE PASSED");
