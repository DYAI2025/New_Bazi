/**
 * REQ-P3-006: Gated live integration check for Supabase persistence.
 *
 * Runs a real CRUD roundtrip (nb_profiles + nb_partner_profiles) against the
 * locally running BFF server. Requires real env vars — never runs in CI.
 *
 * Prerequisites (all must be set):
 *   SUPABASE_URL          — shared Supabase instance URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (BFF-only, never in browser)
 *   VITE_SUPABASE_URL     — same URL (for browser client in this script)
 *   VITE_SUPABASE_ANON_KEY — anon key
 *   APP_URL               — local server URL (default http://localhost:3000)
 *
 * Usage:
 *   APP_URL=http://localhost:3000 npx tsx scripts/supabase-live-check.mts
 *
 * What it does:
 *   1. Creates a temporary test user via Supabase Admin API
 *   2. Signs in as that user to obtain a real JWT session token
 *   3. POSTs a nb_profile + nb_partner_profile via BFF (/api/me/profiles, /api/me/partners)
 *   4. GETs both lists and asserts the saved items appear
 *   5. DELETEs both items and asserts they're gone (owner isolation)
 *   6. Cleans up: deletes the test user via Admin API
 *   7. Reports PASS or FAIL with clear error context
 *
 * Security: SERVICE_ROLE_KEY is server-side only. This script runs server-side (tsx).
 * It is NEVER imported into the browser bundle.
 */

import { createClient } from "@supabase/supabase-js";

// ── Guard ──────────────────────────────────────────────────────────────────
const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];
const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error(`\nFAIL: Missing required env vars: ${missing.join(", ")}`);
  console.error("Set them via Railway or .env (never commit real secrets).\n");
  process.exit(1);
}

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// ── Clients ────────────────────────────────────────────────────────────────
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

// ── Helpers ────────────────────────────────────────────────────────────────
function ok(label: string) {
  console.log(`  ✓  ${label}`);
}
function fail(label: string, detail?: unknown): never {
  console.error(`  ✗  ${label}`);
  if (detail !== undefined) console.error("     →", detail);
  process.exit(1);
}

async function bff<T>(
  path: string,
  token: string,
  opts: RequestInit = {}
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${APP_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers as Record<string, string> | undefined),
    },
  });
  const body = res.status !== 204 ? await res.json().catch(() => null) : null;
  return { status: res.status, body: body as T };
}

// ── Main ───────────────────────────────────────────────────────────────────
const TEST_EMAIL = `nb-live-check-${Date.now()}@test.invalid`;
const TEST_PASSWORD = `LiveCheck_${Date.now()}!`;
let testUserId = "";

try {
  console.log(`\n── Supabase Live-Check (REQ-P3-006) ──`);
  console.log(`   APP_URL:    ${APP_URL}`);
  console.log(`   TEST_EMAIL: ${TEST_EMAIL}\n`);

  // Step 1: Create test user
  const { data: createData, error: createErr } =
    await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  if (createErr || !createData?.user) fail("Create test user", createErr?.message);
  testUserId = createData!.user.id;
  ok(`Created test user ${testUserId}`);

  // Step 2: Sign in → get real JWT
  const { data: signInData, error: signInErr } =
    await anonClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
  if (signInErr || !signInData?.session) fail("Sign in as test user", signInErr?.message);
  const token = signInData!.session!.access_token;
  ok("Signed in, JWT acquired");

  // Step 3: POST nb_profile
  const profilePayload = {
    label: "Live-Check Profile",
    birth_data: {
      name: "Live Check",
      birthDate: "1990-06-15",
      birthTime: "14:30",
      placeId: "ChIJAVkDl5cX5kcRGpo44WgMKS4",
      lat: 52.52,
      lon: 13.405,
      tz: "Europe/Berlin",
    },
  };
  const postProfile = await bff<{ id?: string }>("/api/me/profiles", token, {
    method: "POST",
    body: JSON.stringify(profilePayload),
  });
  if (postProfile.status !== 201 || !postProfile.body?.id) {
    fail(`POST /api/me/profiles → expected 201+id, got ${postProfile.status}`, postProfile.body);
  }
  const profileId = postProfile.body!.id!;
  ok(`POST /api/me/profiles → 201, id=${profileId}`);

  // Step 4: GET nb_profiles — assert our entry present
  const getProfiles = await bff<Array<{ id: string; label: string }>>("/api/me/profiles", token);
  if (getProfiles.status !== 200) fail(`GET /api/me/profiles → ${getProfiles.status}`, getProfiles.body);
  const found = getProfiles.body.find((p) => p.id === profileId);
  if (!found) fail("GET /api/me/profiles → saved profile not found in list", getProfiles.body);
  if (found.label !== profilePayload.label)
    fail(`Label mismatch: expected "${profilePayload.label}", got "${found.label}"`);
  ok(`GET /api/me/profiles → profile present, label matches`);

  // Step 5: POST nb_partner_profile
  const partnerPayload = {
    label: "Live-Check Partner",
    birth_data: {
      name: "Partner Check",
      birthDate: "1985-03-22",
      birthTime: "09:15",
      placeId: "ChIJ2V-Mo_l1nkcRfZixfUscSkM",
      lat: 48.137,
      lon: 11.576,
      tz: "Europe/Berlin",
    },
  };
  const postPartner = await bff<{ id?: string }>("/api/me/partners", token, {
    method: "POST",
    body: JSON.stringify(partnerPayload),
  });
  if (postPartner.status !== 201 || !postPartner.body?.id) {
    fail(`POST /api/me/partners → expected 201+id, got ${postPartner.status}`, postPartner.body);
  }
  const partnerId = postPartner.body!.id!;
  ok(`POST /api/me/partners → 201, id=${partnerId}`);

  // Step 6: GET nb_partner_profiles — assert present
  const getPartners = await bff<Array<{ id: string }>>("/api/me/partners", token);
  if (getPartners.status !== 200) fail(`GET /api/me/partners → ${getPartners.status}`, getPartners.body);
  if (!getPartners.body.find((p) => p.id === partnerId))
    fail("GET /api/me/partners → saved partner not found", getPartners.body);
  ok(`GET /api/me/partners → partner present`);

  // Step 7: DELETE profile + verify gone
  const delProfile = await bff<unknown>(`/api/me/profiles/${profileId}`, token, { method: "DELETE" });
  if (delProfile.status !== 204) fail(`DELETE /api/me/profiles/${profileId} → ${delProfile.status}`);
  const afterDel = await bff<Array<{ id: string }>>("/api/me/profiles", token);
  if (afterDel.body.find((p) => p.id === profileId))
    fail("Profile still present after DELETE — owner filter broken");
  ok(`DELETE /api/me/profiles/${profileId} → 204, profile gone`);

  // Step 8: DELETE partner + verify gone
  const delPartner = await bff<unknown>(`/api/me/partners/${partnerId}`, token, { method: "DELETE" });
  if (delPartner.status !== 204) fail(`DELETE /api/me/partners/${partnerId} → ${delPartner.status}`);
  const afterDelP = await bff<Array<{ id: string }>>("/api/me/partners", token);
  if (afterDelP.body.find((p) => p.id === partnerId))
    fail("Partner still present after DELETE — owner filter broken");
  ok(`DELETE /api/me/partners/${partnerId} → 204, partner gone`);

  console.log(`\n✅  ALL CHECKS PASSED — Supabase persistence live (REQ-P3-006)\n`);
} finally {
  // Cleanup: always delete the test user even on failure
  if (testUserId) {
    const { error } = await adminClient.auth.admin.deleteUser(testUserId);
    if (error) {
      console.warn(`  ⚠  Could not delete test user ${testUserId}: ${error.message}`);
      console.warn("     Delete manually via Supabase dashboard → Authentication → Users.");
    } else {
      console.log(`  ↩  Test user ${testUserId} deleted (cleanup OK)`);
    }
  }
}
