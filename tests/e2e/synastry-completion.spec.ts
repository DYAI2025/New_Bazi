import { test, expect, Page } from "@playwright/test";

const SHOT_DIR = "docs/qa/screenshots/synastry-p7";

// Deterministic P7 partner journey against tests/e2e/mock-fufire.mjs:
//  - Primary persona (1990-05-15) → CHART; partner persona (any other date,
//    not 1985-03-10) → PARTNER_CHART with variant branches + fusion.
//  - Pillars: Jahr Pferd↔Hund = San-He, Tag Ratte↔Pferd = Chong.
//  - Pair axes: Metall A −0.299 vs B +0.02 → structure_flow = Reibung.
//  - Inter-aspects: identical planet longitudes → conjunctions + oppositions.

async function computeProfile(page: Page) {
  await page.fill("#input-name", "Test Persona");
  await page.fill("#input-date", "1990-05-15");
  await page.fill("#input-time", "14:30");
  await page.fill("#input-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("place-coords")).toBeVisible();
  await page.click("#submit-calculate-btn");
  await expect(page.getByText("Waage").first()).toBeVisible({ timeout: 15000 });
}

async function runSynastry(page: Page) {
  await page.click("#nav-tab-synastry");
  await page.fill("#partner-name", "Partner Persona");
  await page.fill("#partner-date", "1988-08-08"); // → mock PARTNER_VARIANT (San-He Jahr, Chong Tag)
  await page.fill("#partner-time", "09:15");
  await page.fill("#partner-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("partner-place-resolved")).toBeVisible();
  await page.click("#submit-synastry-btn");
  await expect(page.getByTestId("synastry-source")).toBeVisible({ timeout: 15000 });
}

test("score is demoted to a heuristic 'Primus-Aspectus (PA)' with a 'kein Messwert' note", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await runSynastry(page);

  await expect(page.getByText(/Primus-Aspectus/).first()).toBeVisible();
  // The old authoritative label must be gone.
  await expect(page.getByText("Harmonie-Wert")).toHaveCount(0);
  await expect(page.getByTestId("synastry-score-note")).toContainText(/kein Messwert/i);
});

test("renders the four partner-journey layers with data anchors", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await runSynastry(page);

  await expect(page.getByTestId("synastry-journey-header")).toContainText("Euer Begegnungsfeld");

  // Pair axes: 5 cards, one Reibung (Metall / Struktur ↔ Fluss).
  await expect(page.getByTestId("synastry-axes")).toBeVisible();
  await expect(page.getByTestId("pair-axis-card")).toHaveCount(5);
  await expect(page.getByText("gegensätzliche Neigung").first()).toBeVisible();

  // Inter-aspects: at least 3 rows (identical longitudes → conjunctions+oppositions).
  await expect(page.getByTestId("synastry-aspects")).toBeVisible();
  expect(await page.getByTestId("inter-aspect-row").count()).toBeGreaterThanOrEqual(3);

  // BaZi pillar comparison: 4 cards, with a San-He and a Chong visible.
  await expect(page.getByTestId("synastry-pillars")).toBeVisible();
  await expect(page.getByTestId("pillar-compare-card")).toHaveCount(4);
  await expect(page.getByText(/San-He/i).first()).toBeVisible();
  await expect(page.getByText(/Chong/i).first()).toBeVisible();

  // Element mirror: 5 rows (Gold = A, Blau = B).
  await expect(page.getByTestId("synastry-elements")).toBeVisible();
  await expect(page.getByTestId("element-mirror-row")).toHaveCount(5);

  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.getByTestId("synastry-container").screenshot({ path: `${SHOT_DIR}/synastry-journey.png` });
});

test("no forbidden relationship-verdict copy in the rendered synastry", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await runSynastry(page);

  const text = (await page.getByTestId("synastry-container").textContent()) ?? "";
  // Widened C2 set scanned on the REAL rendered chrome (council C3 / Gate E re-alignment).
  expect(text).not.toMatch(
    /Seelenverwand|Schicksal|toxisch|für ?einander bestimmt|garantiert|perfekt kompatibel|\bharmonisch|passt (perfekt )?zusammen|\bkompatibel|du bist|ihr seid|Diagnose|Therapie|Heilung/i,
  );
});
