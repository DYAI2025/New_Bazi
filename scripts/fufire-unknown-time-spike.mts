/**
 * REQ-P4-001: Engine Spike — FuFirE behavior at birth_time_known:false
 *
 * Calls all 6 endpoints with the unknown-time convention (12:00:00 + birth_time_known:false),
 * saves full responses as fixtures, and prints a contract-verification matrix.
 *
 * GATE: if engine behavior diverges from contract → FAIL, implementation stops.
 *
 * Usage:
 *   FUFIRE_API_KEY=ff_... npx tsx scripts/fufire-unknown-time-spike.mts
 *
 * Output: src/__fixtures__/fufire/unknown-time/*.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const API_URL = (process.env.FUFIRE_API_URL || "https://api.fufire.space").replace(/\/$/, "");
const API_KEY = (process.env.FUFIRE_API_KEY || "").trim();

if (!API_KEY) {
  console.error("FAIL: FUFIRE_API_KEY env var is required. Run:");
  console.error("  FUFIRE_API_KEY=ff_..._yourkey npx tsx scripts/fufire-unknown-time-spike.mts");
  process.exit(1);
}

const FIXTURE_DIR = join(process.cwd(), "src/__fixtures__/fufire/unknown-time");
mkdirSync(FIXTURE_DIR, { recursive: true });

// Flat format for /v1/calculate/* endpoints (date = local ISO8601 datetime)
const CALC_BIRTH = {
  date: "1990-06-15T12:00:00",
  tz: "Europe/Berlin",
  lat: 52.52,
  lon: 13.405,
  birth_time_known: false,
};

// BirthInput wrapper format for /v1/experience/* endpoints
const EXP_BIRTH = {
  date: "1990-06-15",
  time: "12:00:00",
  tz: "Europe/Berlin",
  lat: 52.52,
  lon: 13.405,
  birth_time_known: false,
};

const LOCALE = "de-DE";
const TARGET_DATE = "2026-06-15";

async function post(path: string, body: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { status: res.status, json };
}

function saveFixture(name: string, data: unknown) {
  const path = join(FIXTURE_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`  → saved ${path}`);
}

interface FindingEntry {
  label: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const findings: FindingEntry[] = [];

function assert(label: string, condition: boolean, detail: string): void {
  findings.push({ label, status: condition ? "PASS" : "FAIL", detail });
}

function info(label: string, detail: string): void {
  findings.push({ label, status: "WARN", detail });
}

// ── 1. bazi ──────────────────────────────────────────────────────────────────
console.log("\n[1/6] POST /v1/calculate/bazi");
const bazi = await post("/v1/calculate/bazi", {
  ...CALC_BIRTH,
  standard: "CIVIL",
  boundary: "midnight",
  ambiguousTime: "earlier",
  nonexistentTime: "error",
});
saveFixture("bazi", { _spike_meta: { endpoint: "/v1/calculate/bazi", birth_time_known: false }, ...bazi.json });
assert("bazi: HTTP 200", bazi.status === 200, `got ${bazi.status}`);
assert(
  "bazi: precision.provisional_fields includes 'hour'",
  Array.isArray(bazi.json?.precision?.provisional_fields) &&
    bazi.json.precision.provisional_fields.includes("hour"),
  `provisional_fields=${JSON.stringify(bazi.json?.precision?.provisional_fields)}`
);
assert(
  "bazi: pillars.hour is null (honest degradation)",
  bazi.json?.pillars?.hour === null || bazi.json?.pillars?.hour === undefined,
  `pillars.hour=${JSON.stringify(bazi.json?.pillars?.hour)}`
);
info("bazi: angles.Ascendant present?", `value=${JSON.stringify(bazi.json?.angles?.Ascendant)}`);
info("bazi: calibration block present?", `keys=${Object.keys(bazi.json?.calibration || {}).join(",") || "none"}`);

// ── 2. western ───────────────────────────────────────────────────────────────
console.log("\n[2/6] POST /v1/calculate/western");
const western = await post("/v1/calculate/western", {
  ...CALC_BIRTH,
  ambiguousTime: "earlier",
  nonexistentTime: "error",
  zodiac_mode: "tropical",
});
saveFixture("western", { _spike_meta: { endpoint: "/v1/calculate/western", birth_time_known: false }, ...western.json });
assert("western: HTTP 200", western.status === 200, `got ${western.status}`);
assert(
  "western: precision.provisional_fields includes 'ascendant'",
  Array.isArray(western.json?.precision?.provisional_fields) &&
    western.json.precision.provisional_fields.includes("ascendant"),
  `provisional_fields=${JSON.stringify(western.json?.precision?.provisional_fields)}`
);
assert(
  "western: precision.provisional_fields includes 'houses'",
  Array.isArray(western.json?.precision?.provisional_fields) &&
    western.json.precision.provisional_fields.includes("houses"),
  `provisional_fields=${JSON.stringify(western.json?.precision?.provisional_fields)}`
);
info(
  "western: angles.Ascendant value (CRITICAL for F-01 test)",
  `angles.Ascendant=${JSON.stringify(western.json?.angles?.Ascendant)} — normalizer must short-circuit this even when non-null`
);
info("western: ascendant direct field", `ascendant=${JSON.stringify(western.json?.ascendant)}`);
info("western: houses array length", `${western.json?.houses?.length ?? "undefined"}`);

// ── 3. fusion ─────────────────────────────────────────────────────────────────
console.log("\n[3/6] POST /v1/calculate/fusion");
const fusion = await post("/v1/calculate/fusion", {
  ...CALC_BIRTH,
  ambiguousTime: "earlier",
  nonexistentTime: "error",
});
saveFixture("fusion", { _spike_meta: { endpoint: "/v1/calculate/fusion", birth_time_known: false }, ...fusion.json });
assert("fusion: HTTP 200", fusion.status === 200, `got ${fusion.status}`);
assert(
  "fusion: precision.provisional_fields includes 'hour'",
  Array.isArray(fusion.json?.precision?.provisional_fields) &&
    fusion.json.precision.provisional_fields.includes("hour"),
  `provisional_fields=${JSON.stringify(fusion.json?.precision?.provisional_fields)}`
);
assert(
  "fusion: precision.provisional_fields includes 'ascendant'",
  Array.isArray(fusion.json?.precision?.provisional_fields) &&
    fusion.json.precision.provisional_fields.includes("ascendant"),
  `provisional_fields=${JSON.stringify(fusion.json?.precision?.provisional_fields)}`
);
info("fusion: calibration.quality present?", `calibration.quality=${JSON.stringify(fusion.json?.calibration?.quality)}`);
info("fusion: westernContributors present?", `westernContributors=${JSON.stringify(fusion.json?.westernContributors)?.slice(0, 80)}`);

// ── 4. bootstrap ─────────────────────────────────────────────────────────────
console.log("\n[4/6] POST /v1/experience/bootstrap");
const bootstrap = await post("/v1/experience/bootstrap", {
  birth: EXP_BIRTH,
  locale: LOCALE,
});
saveFixture("bootstrap", { _spike_meta: { endpoint: "/v1/experience/bootstrap", birth_time_known: false }, ...bootstrap.json });
assert("bootstrap: HTTP 200", bootstrap.status === 200, `got ${bootstrap.status}`);
assert(
  "bootstrap: chart_type_quality === 'assumed_day'",
  bootstrap.json?.chart_type_quality === "assumed_day",
  `chart_type_quality=${JSON.stringify(bootstrap.json?.chart_type_quality)}`
);
info("bootstrap: quality_flags present?", `quality_flags=${JSON.stringify(bootstrap.json?.quality_flags)}`);

const soulprintSectors = bootstrap.json?.soulprint_sectors;

// ── 5. daily ─────────────────────────────────────────────────────────────────
console.log("\n[5/6] POST /v1/experience/daily");
if (!Array.isArray(soulprintSectors)) {
  info("daily: SKIPPED", "bootstrap returned no soulprint_sectors — cannot call daily");
  saveFixture("daily", { _spike_meta: { skipped: true, reason: "no soulprint_sectors from bootstrap" } });
} else {
  const daily = await post("/v1/experience/daily", {
    birth: EXP_BIRTH,
    soulprint_sectors: soulprintSectors,
    quiz_sectors: soulprintSectors,
    target_date: TARGET_DATE,
    locale: LOCALE,
  });
  saveFixture("daily", { _spike_meta: { endpoint: "/v1/experience/daily", birth_time_known: false }, ...daily.json });
  assert("daily: HTTP 200", daily.status === 200, `got ${daily.status}`);
  assert(
    "daily: quality_flags.chart_type_quality === 'assumed_day'",
    daily.json?.quality_flags?.chart_type_quality === "assumed_day",
    `quality_flags.chart_type_quality=${JSON.stringify(daily.json?.quality_flags?.chart_type_quality)}`
  );
  info("daily: top-level chart_type_quality (deprecated?)", `${JSON.stringify(daily.json?.chart_type_quality)}`);
}

// ── 6. dayun ─────────────────────────────────────────────────────────────────
console.log("\n[6/6] POST /v1/calculate/bazi/dayun");
const dayun = await post("/v1/calculate/bazi/dayun", {
  ...CALC_BIRTH,
  direction_method: "explicit",
  flow_direction: "forward",
});
saveFixture("dayun", { _spike_meta: { endpoint: "/v1/calculate/bazi/dayun", birth_time_known: false }, ...dayun.json });
assert("dayun: HTTP 200", dayun.status === 200, `got ${dayun.status}`);
assert(
  "dayun: precision.birth_time_known === false",
  dayun.json?.precision?.birth_time_known === false,
  `precision.birth_time_known=${JSON.stringify(dayun.json?.precision?.birth_time_known)}`
);
assert(
  "dayun: precision.provisional_fields is array",
  Array.isArray(dayun.json?.precision?.provisional_fields),
  `provisional_fields=${JSON.stringify(dayun.json?.precision?.provisional_fields)}`
);

// ── 7. missing time → 422 ────────────────────────────────────────────────────
console.log("\n[7/7] 422 check — time field omitted (date without time component)");
const no422 = await post("/v1/calculate/bazi", {
  date: "1990-06-15",   // no time component → should 422
  tz: "Europe/Berlin",
  lat: 52.52,
  lon: 13.405,
  standard: "CIVIL",
  boundary: "midnight",
  ambiguousTime: "earlier",
  nonexistentTime: "error",
  birth_time_known: false,
});
assert("missing time → HTTP 422", no422.status === 422, `got ${no422.status}`);

// ── Contract Verification Matrix ─────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════");
console.log("  CONTRACT VERIFICATION MATRIX — REQ-P4-001");
console.log("═══════════════════════════════════════════════\n");

const passes = findings.filter((f) => f.status === "PASS").length;
const fails = findings.filter((f) => f.status === "FAIL").length;

for (const f of findings) {
  const icon = f.status === "PASS" ? "✓" : f.status === "FAIL" ? "✗" : "ℹ";
  console.log(`${icon}  [${f.status}] ${f.label}`);
  if (f.status !== "PASS" || f.label.includes("CRITICAL")) {
    console.log(`       ${f.detail}`);
  }
}

console.log(`\n${passes} PASS / ${fails} FAIL / ${findings.filter(f => f.status === "WARN").length} INFO\n`);

if (fails > 0) {
  console.error("═══ SPIKE GATE FAILED — implementation must not start ═══");
  console.error("Engine behavior diverges from contract. Report above divergences to user.");
  process.exit(1);
}

console.log("═══ SPIKE GATE PASSED — all contract assertions confirmed ═══");
console.log(`Fixtures written to: ${FIXTURE_DIR}`);
console.log("Proceed with REQ-P4-002 implementation.");
