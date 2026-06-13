/**
 * MANUAL live smoke test against the real Photon API (network!).
 * NOT part of the CI/vitest suite — run on demand:
 *
 *   npx tsx scripts/photon-live-smoke.mts
 *
 * Expects >= 1 prediction containing "Berlin" for the input "Berl" and a
 * working pl1: placeId round-trip + offline timezone resolution.
 */
import { getAutocompletePredictions, getPlaceDetails, getTimezone } from "../src/utils/mapsService";

const predictions = await getAutocompletePredictions("Berl");
console.log("Photon predictions for 'Berl':");
for (const p of predictions) console.log(`  - ${p.description} (${p.placeId.slice(0, 24)}…)`);

const berlin = predictions.find(p => p.description.includes("Berlin"));
if (!berlin) {
  console.error("FAIL: no prediction containing 'Berlin'");
  process.exit(1);
}

const details = await getPlaceDetails(berlin.placeId);
console.log("Resolved details:", details);

const tz = await getTimezone(details.lat, details.lon, Math.floor(Date.UTC(2026, 0, 15) / 1000));
console.log("Timezone (2026-01-15):", tz);

if (tz.tz !== "Europe/Berlin" || tz.utcOffsetMinutes !== 60) {
  console.error("FAIL: unexpected timezone result");
  process.exit(1);
}
console.log("PHOTON LIVE SMOKE PASSED");
