/**
 * MANUAL fixture capture against the REAL FuFirE engine (network + API key!).
 * Dumps the full JSON response of every consumed endpoint into
 * src/__fixtures__/fufire/ (one pretty-printed file per endpoint) so the
 * normalizer tests run against REAL shapes instead of guessed ones.
 *
 *   FUFIRE_API_KEY=ff_..._yourkey npx tsx scripts/fufire-dump-fixtures.mts
 *
 * Optional: FUFIRE_API_URL (default https://api.fufire.space).
 *
 * The dumped responses are calculation results for the fixed reference birth
 * (Berlin 1990-06-15 14:30) — NOT secrets — and are committed as fixtures.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  console.error("FAIL: FUFIRE_API_KEY env var is required (never hardcoded).");
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

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "__fixtures__", "fufire");
mkdirSync(OUT_DIR, { recursive: true });

let failures = 0;

async function dump(file: string, label: string, run: () => Promise<any>): Promise<any> {
  try {
    const resp = await run();
    writeFileSync(join(OUT_DIR, file), JSON.stringify(resp, null, 2) + "\n");
    console.log(`DUMPED  ${label} -> src/__fixtures__/fufire/${file}`);
    return resp;
  } catch (err: any) {
    failures += 1;
    console.error(`FAIL    ${label}: ${err?.code || err?.name || "error"} — ${err?.message || err}`);
    return null;
  }
}

console.log(`FuFirE fixture dump against ${process.env.FUFIRE_API_URL} (Berlin 1990-06-15 14:30)\n`);

await dump("chart.json", "POST /chart", () => FuFirEClient.postChart(buildFuFirEPayload(BERLIN)));
await dump("western.json", "POST /v1/calculate/western", () => FuFirEClient.postWestern(buildWesternPayload(BERLIN)));
await dump("bazi.json", "POST /v1/calculate/bazi", () => FuFirEClient.postBazi(buildBaziPayload(BERLIN)));
await dump("wuxing.json", "POST /v1/calculate/wuxing", () => FuFirEClient.postWuxing(buildWuxingPayload(BERLIN)));
await dump("fusion.json", "POST /v1/calculate/fusion", () => FuFirEClient.postFusion(buildFusionPayload(BERLIN)));
const bootstrap = await dump("bootstrap.json", "POST /v1/experience/bootstrap",
  () => FuFirEClient.postExperienceBootstrap(buildBootstrapPayload(BERLIN)));
const sectors = extractSoulprintSectors(bootstrap);
if (sectors) {
  // Fixed target_date so the committed fixture is deterministic.
  await dump("daily.json", "POST /v1/experience/daily",
    () => FuFirEClient.postExperienceDaily(buildDailyPayload(BERLIN, sectors, "2026-06-10")));
} else {
  failures += 1;
  console.error("FAIL    POST /v1/experience/daily: skipped — bootstrap delivered no soulprint sectors");
}

console.log("");
if (failures > 0) {
  console.error(`FIXTURE DUMP INCOMPLETE (${failures} failing endpoint(s))`);
  process.exit(1);
}
console.log("FIXTURE DUMP COMPLETE");
