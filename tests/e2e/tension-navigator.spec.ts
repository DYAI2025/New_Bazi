import { test, expect, Page } from "@playwright/test";
import { dismissLanding } from "./_landing";

const SHOT_DIR = "docs/qa/screenshots/spannungsnavigator";

// Mock fusion (tests/e2e/mock-fufire.mjs): Metall difference −0.299 is the clear
// top axis → structure_flow (Struktur ↔ Fluss), BaZi-Überschuss (Blau). The
// second-strongest axis is Holz +0.222 → tradition_innovation. sigma_above
// 1.015 → signalLevel "spuerbar".
//
// Natal-Modus: seit dem Signatur-Redesign (User-Entscheid 2026-07-08) zeigt der
// Fusions-Tab die 3D-Signatur (SignatureView) statt der Frage-Mechanik. Die
// Frage-Mechanik lebt weiter im Paar-Modus (Synastrie, TensionNavigator).

async function fillNameDateTime(page: Page) {
  await page.fill("#input-name", "Test Persona");
  await page.fill("#input-date", "1990-05-15");
  await page.fill("#input-time", "14:30");
}

async function selectBerlin(page: Page) {
  await page.fill("#input-place", "Ber");
  // Demo provider returns "Berlin, Deutschland" via /api/places/autocomplete.
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("place-coords")).toBeVisible();
}

async function computeProfile(page: Page) {
  await fillNameDateTime(page);
  await selectBerlin(page);
  await page.click("#submit-calculate-btn");
  await expect(page.getByText("Waage").first()).toBeVisible({ timeout: 15000 });
}

async function openSignature(page: Page) {
  await page.click("#nav-tab-fusion");
  await expect(page.getByTestId("signature-view")).toBeVisible();
}

test("signature view shows pole-pair kicker + honesty footer — and NO percent sign", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openSignature(page);

  const view = page.getByTestId("signature-view");

  // Top axis from the mock: Metall → Struktur ↔ Fluss, Ausprägung spürbar (sprachlich, nie Zahl).
  await expect(page.getByTestId("signature-kicker")).toContainText("Struktur ↔ Fluss");
  await expect(page.getByTestId("signature-kicker")).toContainText("spürbar");

  // 3D-Canvas ODER der ehrliche WebGL-Fallback — nie ein leerer Screen.
  const canvasOrFallback = page
    .getByTestId("signature-canvas")
    .or(page.getByTestId("signature-webgl-fallback"));
  await expect(canvasOrFallback.first()).toBeVisible();

  // Every view carries the honesty footer.
  await expect(page.getByTestId("signature-footer")).toHaveText("Modellergebnis, keine Eigenschaft.");

  // NO percent signs anywhere in the view (Konzept-Regel: keine Prozente/Scores
  // im Visual). Scoped with the Herkunft layer CLOSED — the origin layer is the
  // only place numbers live.
  await expect(view.getByTestId("signature-origin")).toHaveCount(0);
  await expect(view.locator("text=/%/")).toHaveCount(0);

  await page.screenshot({ path: `${SHOT_DIR}/signature-natal.png`, fullPage: true });
});

test("Herkunft & Methode layer reveals the numbers — and only there", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openSignature(page);

  await page.getByTestId("signature-origin-toggle").click();
  const origin = page.getByTestId("signature-origin");
  await expect(origin).toBeVisible();
  await expect(origin).toContainText("Kohärenzindex");
  // Element table carries the real West/BaZi weights from the mock.
  await expect(origin).toContainText("Metall");
  await expect(origin).toContainText("Holz");

  // Container-Screenshot statt fullPage (Sticky-Header-Stitching).
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.getByTestId("signature-view").screenshot({ path: `${SHOT_DIR}/signature-origin.png` });

  await page.getByTestId("signature-origin-toggle").click();
  await expect(page.getByTestId("signature-origin")).toHaveCount(0);
});

test("cosmic slider overrides the live source — Live button returns control", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openSignature(page);

  // Anfangsquelle ist nie OVERRIDE (STATISCH bis zum ersten Dynamik-Tick,
  // danach LIVE (NOAA) oder SIMULIERT — jede Zahl trägt ihre Quelle).
  await expect(page.getByTestId("signature-cosmic-source")).not.toHaveText("OVERRIDE");

  const slider = page.getByTestId("signature-cosmic-slider");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("signature-cosmic-source")).toHaveText("OVERRIDE");

  await page.getByTestId("signature-live-btn").click();
  await expect(page.getByTestId("signature-cosmic-source")).not.toHaveText("OVERRIDE");
});

test("pair mode: synastry renders the pair card with the pair question", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#nav-tab-synastry");

  // Partner persona (mock: any birth date other than 1990-05-15 → variant
  // fusion distribution with a clear Metall pair difference → structure_flow).
  await page.fill("#partner-name", "Partner Persona");
  await page.fill("#partner-date", "1985-03-20");
  await page.fill("#partner-time", "09:15");
  await page.fill("#partner-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("partner-place-resolved")).toBeVisible();

  await page.click("#submit-synastry-btn");
  await expect(page.getByTestId("synastry-source")).toBeVisible({ timeout: 15000 });

  // Pair card: PAAR-SPANNUNG kicker with both names + the curated pair question.
  const nav = page.getByTestId("tension-navigator");
  await expect(nav).toBeVisible();
  await expect(page.getByTestId("tension-kicker")).toContainText("Paar-Spannung");
  await expect(page.getByTestId("tension-kicker")).toContainText("Test Persona ↔ Partner Persona");
  await expect(page.getByTestId("tension-question")).toHaveText(
    "Wo gibt die Form des einen dem Fluss des anderen Halt – und wo bremst sie ihn?"
  );
  await expect(page.getByTestId("tension-footer")).toHaveText("Modellergebnis, keine Eigenschaft.");

  // The synastry score (%) lives OUTSIDE the navigator container — the pair
  // card itself stays free of percent signs (origin layer closed).
  await expect(nav.locator("text=/%/")).toHaveCount(0);

  await page.screenshot({ path: `${SHOT_DIR}/navigator-paar.png`, fullPage: true });
});
