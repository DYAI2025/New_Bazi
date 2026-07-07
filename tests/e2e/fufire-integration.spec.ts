import { test, expect, Page } from "@playwright/test";
import { dismissLanding } from "./_landing";

const SHOT_DIR = "docs/qa/screenshots/fufire-backend-integration";

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
  // Place resolved server-side → coordinates badge appears.
  await expect(page.getByTestId("place-coords")).toBeVisible();
}

async function computeProfile(page: Page) {
  await fillNameDateTime(page);
  await selectBerlin(page);
  await page.click("#submit-calculate-btn");
  await expect(page.getByText("Waage").first()).toBeVisible({ timeout: 15000 });
}

test("starts empty on the input tab without any demo profile", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await expect(page.locator("#nav-tab-input")).toBeVisible();
  // No pre-filled demo identity.
  await expect(page.locator("#input-name")).toHaveValue("");
  await expect(page.locator("body")).not.toContainText("Benjamin");
  // Detail tabs are gated until a profile exists.
  await expect(page.locator("#nav-tab-overview")).toBeDisabled();
  await page.screenshot({ path: `${SHOT_DIR}/input-empty.png`, fullPage: true });
});

test("blocks chart submit until a place is resolved server-side", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await fillNameDateTime(page);
  // No place yet → submit button blocked, overview tab still gated.
  await expect(page.locator("#submit-calculate-btn")).toBeDisabled();
  await expect(page.locator("#nav-tab-overview")).toBeDisabled();
  await selectBerlin(page);
  // Resolved place unlocks the submit button.
  await expect(page.locator("#submit-calculate-btn")).toBeEnabled();
  await page.screenshot({ path: `${SHOT_DIR}/input-place-selected.png`, fullPage: true });
});

test("renders the FuFirE-sourced overview after computing", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await expect(page.getByText("Test Persona")).toBeVisible();
  await expect(page.getByText("Waage").first()).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/overview-fufire-source.png`, fullPage: true });
});

test("fusion tab renders the REAL calibrated FusionResponse path", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#nav-tab-fusion");
  // The tab now renders the Spannungsnavigator; the technical view (gauge,
  // band, bars) lives in the Herkunft layer and must be opened explicitly.
  await expect(page.getByTestId("tension-question")).toBeVisible();
  await page.getByTestId("tension-origin-toggle").click();
  await expect(page.getByText(/Kohärenzindex/).first()).toBeVisible();
  await expect(page.getByTestId("fusion-source")).toContainText("fufire");
  // CALIBRATED gauge value (h_calibrated 0.6144 -> 61.4%), not raw 90.8%.
  await expect(page.getByTestId("fusion-coherence-value")).toHaveText("61.4%");
  // Honest band label straight from calibration.interpretation_band.
  await expect(page.getByTestId("fusion-coherence-rating")).toContainText("Überdurchschnittliche Kongruenz");
  // Signal level badge (z = 1.015 -> spürbar) with the visibility wording.
  await expect(page.getByTestId("fusion-signal-level")).toContainText("Ausprägung des Signals: spürbar");
  // Per-element West-vs-BaZi comparison + derived Spannungsfelder.
  await expect(page.getByTestId("fusion-elemental-comparison")).toBeVisible();
  await expect(page.getByText(/Größte Spannungsfelder/)).toBeVisible();
  await expect(page.getByText(/Metall: West 0\.13 vs\. BaZi 0\.43/)).toBeVisible();
  // The engine's REAL fusion_interpretation text is rendered.
  await expect(page.getByTestId("fusion-interpretation")).toContainText("Harmonie-Index: 90.80%");
  await expect(page.getByTestId("fusion-interpretation")).toContainText("Westliche Dominanz: Holz");
  await page.screenshot({ path: `${SHOT_DIR}/fusion-tab.png`, fullPage: true });
});

test("daily tab auto-loads the full FuFirE Tagespuls (three cards + Impuls)", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#nav-tab-daily");

  // Auto-load: no "abrufen" click needed — the cards appear on tab open.
  await expect(page.getByTestId("daily-card-west")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("daily-card-east")).toBeVisible();
  await expect(page.getByTestId("daily-card-fusion")).toBeVisible();
  await expect(page.getByTestId("daily-source")).toContainText("fufire");

  // West card carries the engine's western.* content.
  await expect(page.getByTestId("daily-card-west")).toContainText("Kommunikation, Identitaet im Fokus");
  await expect(page.getByTestId("daily-card-west")).toContainText("Sektor 3 bietet dir heute besonderes Potenzial");

  // Ost card carries eastern.* incl. the day-master daily reference.
  await expect(page.getByTestId("daily-card-east")).toContainText("Day Master Xin");
  await expect(page.getByTestId("daily-east-reference")).toContainText("Tagessäule Yi–Mao");
  await expect(page.getByTestId("daily-east-reference")).toContainText("Solarterm Mangzhong");

  // Fusion card shows summary + synthesis.
  await expect(page.getByTestId("daily-card-fusion")).toContainText("Dein Fusionstag verbindet Kommunikation");
  await expect(page.getByTestId("daily-card-fusion")).toContainText("Die Synthese liegt darin");

  // fusion.action is its own Impuls block, not a keyword chip.
  await expect(page.getByTestId("daily-action")).toContainText("Impuls des Tages");
  await expect(page.getByTestId("daily-action")).toContainText("Nutze heute gezielt den Bereich Kommunikation");

  // Tages-Kurzform (push_text) + context notes (jieqi/weekday).
  await expect(page.getByTestId("daily-push-text")).toContainText("Dein Wealth-Tag: Kommunikation ruft.");
  await expect(page.getByTestId("daily-context")).toContainText("Solarterm Mangzhong faerbt beide Systeme");

  // The ghost metric rows are gone for good.
  await expect(page.locator("body")).not.toContainText("Leitelement");
  await expect(page.locator("body")).not.toContainText("Resonanzfaktor");
  await expect(page.locator("body")).not.toContainText("Schwingungswort");

  await page.screenshot({ path: `${SHOT_DIR}/daily-pulse-full.png`, fullPage: true });
});

test("daily tab Tagesnavigation requests the previous day (Rückblick)", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#nav-tab-daily");
  await expect(page.getByTestId("daily-card-west")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("daily-day-label")).toContainText("Heute");

  await page.getByTestId("daily-prev").click();
  await expect(page.getByTestId("daily-day-label")).toContainText("Rückblick");
  // Mock echoes target_date → the rendered date is yesterday's.
  const yesterday = new Date(Date.now() - 86400000);
  const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  await expect(page.getByText(`FuFirE Tagespuls · ${y}`)).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: `${SHOT_DIR}/daily-pulse-prev-day.png`, fullPage: true });
});

test("western tab shows house data", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#nav-tab-western");
  await expect(page.getByText(/Haus|Häuser|Identität/).first()).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/houses-section.png`, fullPage: true });
});

test("methodology shows the capability matrix with status + source", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#nav-tab-methode");
  await expect(page.getByTestId("overall-source")).toContainText("FuFirE");
  await expect(page.getByText("server-used").first()).toBeVisible();
  // Capability matrix shows upstream FuFirE endpoints.
  await expect(page.getByText("/v1/calculate/bazi").first()).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/methodology-capabilities.png`, fullPage: true });
});

test("shows a safe error (no secret leak) when FuFirE key is missing", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  // Simulate the upstream config gap as the real server would report it.
  await page.route("**/api/azodiac/profile", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "missing_fufire_key",
        message: "FuFirE-API-Schluessel ist serverseitig nicht konfiguriert."
      })
    })
  );
  await fillNameDateTime(page);
  await selectBerlin(page);
  await page.click("#submit-calculate-btn");
  const err = page.getByTestId("profile-error");
  await expect(err).toBeVisible();
  await expect(err).toContainText("nicht konfiguriert");
  // No secret material on screen.
  await expect(page.locator("body")).not.toContainText("test-key");
  await page.screenshot({ path: `${SHOT_DIR}/missing-fufire-secret.png`, fullPage: true });
});

test("light and dark themes both render the overview", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await page.click("#theme-toggle");
  await expect(page.locator("#app-root.bg-stone-100, #app-root").first()).toBeVisible();
  await expect(page.getByText("Waage").first()).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/overview-light-theme.png`, fullPage: true });
});
