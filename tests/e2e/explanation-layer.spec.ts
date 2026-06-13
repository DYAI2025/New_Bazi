/**
 * P5-T3: Content-Registry → UI — Overview cards become clickable "doors".
 *
 * Each Overview card maps to a registry entry id and opens an ExplanationLayer
 * (a drawer) that shows the entry's explanation text plus a PROFILE ANCHOR
 * (the real datum: sign + degree, stem + element, …). This is the assembled,
 * end-to-end path through the running app + BFF + mock engine — not a unit
 * harness. The Gegenthese this spec kills: "the registry exists and the cards
 * render, but clicking a card does nothing / opens an empty layer / shows an
 * invented sign for an unknown ascendant" — green registry, zero user value.
 *
 * Mock (tests/e2e/mock-fufire.mjs) is deterministic:
 *   sunSign=Waage (zodiac.libra), moonSign=Stier (zodiac.taurus),
 *   ascendant=Krebs (zodiac.cancer), Tag pillar stem=Jiǎ (stem.jia) /
 *   branch=Zǐ (branch.zi). For the unknown-time persona (NO_TIME_DATE below)
 *   the mock returns western.precision.provisional_fields=["ascendant",…] so
 *   the normalizer honestly nulls the ascendant — the absence path under test.
 *
 * RED REASON: ExplanationLayer + the card wiring (role="button", data-testid
 * "explanation-layer", click/keyboard handlers, anchor composition) do not
 * exist yet. P5-T3 implementation (NOT this spec) builds them.
 */
import { test, expect, Page, Locator } from "@playwright/test";

// Distinct birth date the mock recognises as the "unknown time" persona →
// it returns a provisional ascendant so the normalizer nulls it.
const NO_TIME_DATE = "1985-03-10";

async function fillNameDate(page: Page, date = "1990-06-15") {
  await page.fill("#input-name", "Tür Tester");
  await page.fill("#input-date", date);
}

async function selectBerlin(page: Page) {
  await page.fill("#input-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("place-coords")).toBeVisible();
}

/** Submit with a known time → ascendant is computed (non-null). */
async function reachOverview(page: Page) {
  await page.goto("/");
  await fillNameDate(page);
  await selectBerlin(page);
  await page.fill("#input-time", "14:30");
  await page.click("#submit-calculate-btn");
  await expect(page.locator("#overview-dashboard")).toBeVisible({ timeout: 15000 });
}

/** Submit with the unknown-time checkbox on the NO_TIME persona → ascendant null. */
async function reachOverviewUnknownTime(page: Page) {
  await page.goto("/");
  await fillNameDate(page, NO_TIME_DATE);
  await selectBerlin(page);
  await page.check("#input-time-unknown");
  await page.click("#submit-calculate-btn");
  await expect(page.locator("#overview-dashboard")).toBeVisible({ timeout: 15000 });
}

const layer = (page: Page): Locator => page.getByTestId("explanation-layer");

// The Sonne card. We don't depend on its exact testid wording beyond the card
// being keyboard/role-button accessible; locate it by its visible "Sonne" label.
function sunCard(page: Page): Locator {
  return page.getByRole("button", { name: /Sonne/ }).first();
}
function ascendantCard(page: Page): Locator {
  return page.getByRole("button", { name: /Aszendent/ }).first();
}
// First of the four 四 柱 BaZi pillar cards (Stunde/Tag/Monat/Jahr). The Tag
// pillar in the mock is Jiǎ/Zǐ; we open a pillar card and assert stem text.
function firstPillarCard(page: Page): Locator {
  // Target the Tag pillar card precisely via its aria-label ("Tag-Säule Jiǎ / Zǐ …").
  // A bare /Tag/ also matches the daily-nav button and other cards; /Tag-Säule/ is
  // unique to the Tag pillar — the card whose Jiǎ/Zǐ/Holz this test asserts.
  return page.getByRole("button", { name: /Tag-Säule/ }).first();
}

test.describe("ExplanationLayer — Overview cards are clickable doors", () => {
  test("clicking the Sonne card opens the layer with the sun-sign explanation + a degree anchor", async ({ page }) => {
    await reachOverview(page);

    await expect(layer(page)).toHaveCount(0); // closed initially
    await sunCard(page).click();

    const l = layer(page);
    await expect(l).toBeVisible();
    // Registry explanation text for zodiac.libra (Waage).
    await expect(l).toContainText("Die Sonne in der Waage");
    // Profile anchor: the real Sonne degree from western.planets (21.3°).
    await expect(l).toContainText(/\d+([.,]\d+)?°/);
  });

  test("Escape closes the layer; clicking the backdrop closes it", async ({ page }) => {
    await reachOverview(page);

    await sunCard(page).click();
    await expect(layer(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(layer(page)).toHaveCount(0);

    // Re-open, then close via backdrop click.
    await sunCard(page).click();
    await expect(layer(page)).toBeVisible();
    await page.getByTestId("explanation-layer-backdrop").click();
    await expect(layer(page)).toHaveCount(0);
  });

  test("clicking a Tagessäule card opens the layer with the stem (and branch) explanation", async ({ page }) => {
    await reachOverview(page);

    await firstPillarCard(page).click();

    const l = layer(page);
    await expect(l).toBeVisible();
    // Tag pillar stem = Jiǎ (stem.jia) — its registry title carries the glyph.
    await expect(l).toContainText("Jiǎ");
    // The layer also references the branch Zǐ 子 (branch.zi).
    await expect(l).toContainText("Zǐ");
    // Anchor names the pillar's element (Holz for Jiǎ).
    await expect(l).toContainText("Holz");
  });

  test("the Aszendent card opens an HONEST absence explanation when ascendant is null (no invented sign, no empty layer)", async ({ page }) => {
    await reachOverviewUnknownTime(page);

    await ascendantCard(page).click();

    const l = layer(page);
    await expect(l).toBeVisible();
    // Honest absence: explains WHY, references the missing birth time.
    await expect(l).toContainText(/Aszendent/);
    await expect(l).toContainText(/Geburtszeit/);
    // NOT empty and NOT an invented sign: none of the 12 German zodiac names
    // may appear as the resolved ascendant in this absence layer.
    const invented = /Widder|Stier|Zwillinge|Krebs|Löwe|Jungfrau|Waage|Skorpion|Schütze|Steinbock|Wassermann|Fische/;
    await expect(l).not.toContainText(invented);
  });

  test("cards expose role=button and are keyboard-activatable (Enter)", async ({ page }) => {
    await reachOverview(page);

    const card = sunCard(page);
    await expect(card).toHaveAttribute("role", "button");
    await expect(card).toHaveAttribute("tabindex", "0");

    await card.focus();
    await page.keyboard.press("Enter");
    await expect(layer(page)).toBeVisible();
    await expect(layer(page)).toContainText("Die Sonne in der Waage");
  });
});
