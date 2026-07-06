import { test, expect, Page } from "@playwright/test";
import { dismissLanding } from "./_landing";

const SHOT_DIR = "docs/qa/screenshots/spannungsnavigator";

// Mock fusion (tests/e2e/mock-fufire.mjs): Metall difference −0.299 is the clear
// top axis → structure_flow (Struktur ↔ Fluss), BaZi-Überschuss (Blau). The
// second-strongest axis is Holz +0.222 → tradition_innovation. sigma_above
// 1.015 → signalLevel "spuerbar".

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

async function openNavigator(page: Page) {
  await page.click("#nav-tab-fusion");
  await expect(page.getByTestId("tension-navigator")).toBeVisible();
  await expect(page.getByTestId("tension-question")).toBeVisible();
}

test("navigator card shows pole pair + question + honesty footer — and NO percent sign", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openNavigator(page);

  const nav = page.getByTestId("tension-navigator");

  // Top axis from the mock: Metall → Struktur ↔ Fluss, Ausprägung spürbar (sprachlich, nie Zahl).
  await expect(page.getByTestId("tension-kicker")).toContainText("Struktur ↔ Fluss");
  await expect(page.getByTestId("tension-kicker")).toContainText("spürbar");

  // The QUESTION is the output (Konzept-Regel 1) — never empty.
  const question = (await page.getByTestId("tension-question").textContent()) ?? "";
  expect(question.trim().length).toBeGreaterThan(10);
  expect(question.trim()).toContain("?");

  // Every card carries the honesty footer.
  await expect(page.getByTestId("tension-footer")).toHaveText("Modellergebnis, keine Eigenschaft.");

  // NO percent signs anywhere in the navigator container (Konzept-Regel 2:
  // keine Prozente/Scores im Visual). Scoped on the container with the
  // Herkunft layer CLOSED — the origin layer is the only place numbers live.
  await expect(nav.getByTestId("tension-origin")).toHaveCount(0);
  await expect(nav.locator("text=/%/")).toHaveCount(0);

  await page.screenshot({ path: `${SHOT_DIR}/navigator-natal.png`, fullPage: true });
});

test("'Passt nicht' switches to the next-strongest pole pair", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openNavigator(page);

  await expect(page.getByTestId("tension-kicker")).toContainText("Struktur ↔ Fluss");
  const questionBefore = await page.getByTestId("tension-question").textContent();

  await page.getByTestId("tension-reaction-passt_nicht").click();

  // Rank 2 by |difference| is Holz (+0.222) → tradition_innovation.
  await expect(page.getByTestId("tension-kicker")).toContainText("Innovation ↔ Tradition");
  await expect(page.getByTestId("tension-kicker")).not.toContainText("Struktur ↔ Fluss");
  await expect(page.getByTestId("tension-question")).not.toHaveText(questionBefore ?? "");

  // Container-Screenshot statt fullPage: fullPage stitcht den Sticky-Header
  // mehrfach über die Karte (Scroll-Stitching-Artefakt). Viewport vorher hoch
  // genug, damit der Container OHNE Scroll-Stitching in einen Frame passt.
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.getByTestId("tension-navigator").screenshot({ path: `${SHOT_DIR}/navigator-passt-nicht.png` });
});

test("'Widerstand' shows the Gegenpol footnote (Gegenlesart)", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openNavigator(page);

  await page.getByTestId("tension-reaction-widerstand").click();

  await expect(page.getByTestId("tension-mode-note")).toBeVisible();
  await expect(page.getByTestId("tension-mode-note")).toContainText("Gegenpol");

  // Container-Screenshot statt fullPage (Sticky-Header-Stitching, s. o.).
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.getByTestId("tension-navigator").screenshot({ path: `${SHOT_DIR}/navigator-widerstand.png` });
});

test("question is deterministic: reload on the same day shows the same question", async ({ page }) => {
  await page.goto("/");
  await dismissLanding(page);
  await computeProfile(page);
  await openNavigator(page);
  const firstQuestion = await page.getByTestId("tension-question").textContent();

  await page.reload();
  await dismissLanding(page);
  await computeProfile(page);
  await openNavigator(page);

  await expect(page.getByTestId("tension-question")).toHaveText(firstQuestion ?? "");
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
