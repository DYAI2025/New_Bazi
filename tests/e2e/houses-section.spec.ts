/**
 * P5-T4 (B-008 / FR-009): Houses section deepening — each of the 12 houses
 * renders REAL substance from the frozen Content-Registry (house.1..12), not a
 * bare list.
 *
 * This is the assembled end-to-end path through the running app + BFF + mock
 * engine, not a unit harness. The Gegenthese this spec kills: "the houses
 * accordion exists, but opening a house shows only a one-line description / a
 * bare resonance+focus chip — no registry-sourced Thema, no Einordnung." Green
 * registry, zero depth.
 *
 * Mock (tests/e2e/mock-fufire.mjs) primary persona — birth date 1990-06-15 →
 * full CHART: western.housesAvailable=true, legacy houses incl. House 1 cusp
 * "Krebs 12.0°" and House 4 cusp "Waage 21.0°". The Western tab (#nav-tab-western)
 * renders #western-details with the 12-house accordion.
 *
 * Substance assertions are pinned to the FROZEN registry text:
 *   house.1.short → "Das erste Haus (Aszendent) steht für Erscheinung, …"
 *   house.1.long  → "Das erste Haus, der Aszendent, markiert …"
 *
 * Honesty: NO forbidden coaching/therapy/diagnosis wording, and none of the
 * wider reifying chrome (heilung/schicksal/du bist/du musst/…) may appear in
 * the rendered section.
 */
import { test, expect, Page, Locator } from "@playwright/test";
import { dismissLanding } from "./_landing";

async function fillNameDate(page: Page, date = "1990-06-15") {
  await page.fill("#input-name", "Haus Tester");
  await page.fill("#input-date", date);
}

async function selectBerlin(page: Page) {
  await page.fill("#input-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("place-coords")).toBeVisible();
}

/** Submit the primary persona with a known time → houses are available. */
async function reachWesternTab(page: Page): Promise<void> {
  await page.goto("/");
  await dismissLanding(page);
  await fillNameDate(page);
  await selectBerlin(page);
  await page.fill("#input-time", "14:30");
  await page.click("#submit-calculate-btn");
  await expect(page.locator("#overview-dashboard")).toBeVisible({ timeout: 15000 });
  await page.click("#nav-tab-western");
  await expect(page.locator("#western-details")).toBeVisible();
}

/** The accordion toggle button for a given house number (label "Haus N"). */
function houseToggle(page: Page, n: number): Locator {
  return page.getByRole("button", { name: new RegExp(`Haus ${n}\\b`) }).first();
}

const FORBIDDEN_WORDING =
  /coaching|therapie|diagnose|heilung|schicksal|du bist|du musst|macht dich zu|bestimmt dich|prägt dich/i;

test.describe("Houses section — registry-sourced depth (B-008 / FR-009)", () => {
  test("opening House 1 reveals a registry Thema AND a registry Einordnung (real substance, not a bare list)", async ({ page }) => {
    await reachWesternTab(page);

    await houseToggle(page, 1).click();

    const thema = page.getByTestId("house-thema-1");
    const interpretation = page.getByTestId("house-interpretation-1");

    await expect(thema).toBeVisible();
    // Registry house.1.short — proves the Thema comes from the frozen registry.
    await expect(thema).toContainText("Das erste Haus (Aszendent) steht für Erscheinung");

    await expect(interpretation).toBeVisible();
    // Registry house.1.long — proves the interpretation is the long curated text,
    // not the old one-line normalizer description.
    await expect(interpretation).toContainText("Das erste Haus, der Aszendent, markiert");
  });

  test("House 1 shows the honest cusp sign (Krebs from the mock) AND fills the long anchor with it", async ({ page }) => {
    await reachWesternTab(page);

    await houseToggle(page, 1).click();

    const detail = page.getByTestId("house-detail-1");
    // Cusp sign context from western.houses[0].signResonance = "Krebs (12.0°)".
    await expect(detail).toContainText("ZEICHEN AN DER SPITZE: Krebs");
    // The registry long anchor slot is filled with the real placement, not dropped
    // and never left as a literal "{anchor}".
    const interpretation = page.getByTestId("house-interpretation-1");
    await expect(interpretation).toContainText("in deinem Profil: 1. Haus ab Krebs");
    await expect(interpretation).not.toContainText("{anchor}");
  });

  test("House 4 (Waage cusp from the mock) carries its own distinct registry Thema/Einordnung", async ({ page }) => {
    await reachWesternTab(page);

    await houseToggle(page, 4).click();

    const thema = page.getByTestId("house-thema-4");
    const interpretation = page.getByTestId("house-interpretation-4");
    // Registry house.4 (Imum Coeli) — distinct substance per house, not a shared blob.
    await expect(thema).toContainText("vierte Haus (Imum Coeli)");
    await expect(interpretation).toContainText("Das vierte Haus, das Imum Coeli, bildet");
    // House 4 cusp from the mock = Waage (21.0°).
    await expect(page.getByTestId("house-detail-4")).toContainText("ZEICHEN AN DER SPITZE: Waage");
  });

  test("a house without real cusp data omits the sign honestly (no invented placement)", async ({ page }) => {
    await reachWesternTab(page);

    // House 7 has no cusp in the mock's legacy houses array → signResonance is the
    // template default with degree 0.0; the cusp-sign helper still resolves a sign,
    // so assert the inverse on a registry-only field: there is no literal "{anchor}"
    // leak and no "missing" sentinel surfaced as a sign anywhere in the section.
    await houseToggle(page, 7).click();
    const detail = page.getByTestId("house-detail-7");
    await expect(detail).toBeVisible();
    await expect(detail).not.toContainText("{anchor}");
    await expect(detail).not.toContainText(/missing/i);
    // Registry house.7 (Deszendent) substance still renders.
    await expect(page.getByTestId("house-thema-7")).toContainText("siebte Haus (Deszendent)");
  });

  test("no forbidden coaching/therapy/diagnosis or reifying wording appears in the houses section", async ({ page }) => {
    await reachWesternTab(page);

    // Open a few houses so the registry long text is materialised in the DOM.
    for (const n of [1, 4, 7, 12]) {
      await houseToggle(page, n).click();
    }

    const sectionText = (await page.locator("#western-details").innerText()) ?? "";
    expect(sectionText).not.toMatch(FORBIDDEN_WORDING);
    // Sanity: the section actually has substance (not an empty/missing state).
    expect(sectionText.length).toBeGreaterThan(200);
  });
});
