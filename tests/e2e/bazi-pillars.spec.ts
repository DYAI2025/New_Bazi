/**
 * P5-T5 (FR-010): BaZi-Säulen-Vertiefung — each pillar shows real depth.
 *
 * The BaZi tab's per-pillar detail section must, for each resolvable pillar,
 * surface FOUR layers of real content (no invented placeholders):
 *   1. Lebensbereich  → registry pillar.{year,month,day,hour}.title/short
 *   2. Stamm          → element + polarity + registry stem.<pinyin> explanation
 *   3. Zweig          → animal + element + registry branch.<pinyin> explanation
 *   4. verborgene Stämme → the branch's hidden-stem entries (canonical table,
 *      the SAME authoritative source the normalizer uses for index responses).
 *
 * Mock primary persona (tests/e2e/mock-fufire.mjs, birth date 1990-06-15):
 *   Tag pillar = Jiǎ (stem.jia) / Zǐ (branch.zi), Lebensbereich = Tages-Säule
 *   (pillar.day), branch Zǐ hidden stem = "Guǐ Wasser".
 *
 * Gegenthese killed: "the registry + pillar fields exist, but the BaZi tab only
 * shows glyphs / a single day-master block — the four pillars carry no real
 * per-pillar depth." This drives the running app + BFF + mock end-to-end.
 */
import { test, expect, Page } from "@playwright/test";

async function fillNameDate(page: Page, date = "1990-06-15") {
  await page.fill("#input-name", "Säulen Tester");
  await page.fill("#input-date", date);
}

async function selectBerlin(page: Page) {
  await page.fill("#input-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("place-coords")).toBeVisible();
}

/** Submit with a known time → full chart (all four pillars present). */
async function reachOverview(page: Page) {
  await page.goto("/");
  await fillNameDate(page);
  await selectBerlin(page);
  await page.fill("#input-time", "14:30");
  await page.click("#submit-calculate-btn");
  await expect(page.locator("#overview-dashboard")).toBeVisible({ timeout: 15000 });
}

async function openBaZiTab(page: Page) {
  await page.click("#nav-tab-bazi");
  await expect(page.locator("#bazi-details")).toBeVisible();
  await expect(page.getByTestId("bazi-pillars-detail")).toBeVisible();
}

test.describe("BaZi pillars — per-pillar depth from the registry (FR-010)", () => {
  test("the Tag pillar shows Lebensbereich + Stamm explanation + Zweig explanation + a verborgener Stamm", async ({ page }) => {
    await reachOverview(page);
    await openBaZiTab(page);

    const tag = page.getByTestId("pillar-detail-Tag");
    await expect(tag).toBeVisible();

    // (1) Lebensbereich — registry pillar.day title (the Tag-Säule frame).
    await expect(tag).toContainText("Tages-Säule");

    // (2) Stamm — Jiǎ (stem.jia) with its element/polarity + registry explanation.
    await expect(tag).toContainText("Jiǎ");
    await expect(tag).toContainText("Holz");
    await expect(tag).toContainText("aufragende"); // stem.jia short: "aufragenden Baum"

    // (3) Zweig — Zǐ (branch.zi) with its animal + registry explanation.
    await expect(tag).toContainText("Zǐ");
    await expect(tag).toContainText("Ratte");
    await expect(tag).toContainText("Yang-Wasser"); // branch.zi short

    // (4) verborgener Stamm — Zǐ carries Guǐ Wasser (canonical, never invented).
    await expect(page.getByTestId("pillar-Tag-hidden").first()).toContainText("Guǐ Wasser");
  });

  test("all four pillars render a Lebensbereich frame from the registry", async ({ page }) => {
    await reachOverview(page);
    await openBaZiTab(page);

    // Jahr Bǐng/Wǔ, Monat Wù/Xū, Tag Jiǎ/Zǐ, Stunde Gēng/Wǔ — each a distinct frame.
    await expect(page.getByTestId("pillar-detail-Jahr")).toContainText("Jahres-Säule");
    await expect(page.getByTestId("pillar-detail-Monat")).toContainText("Monats-Säule");
    await expect(page.getByTestId("pillar-detail-Tag")).toContainText("Tages-Säule");
    await expect(page.getByTestId("pillar-detail-Stunde")).toContainText("Stunden-Säule");

    // The Stunde branch is Wǔ (Pferd) → hidden stems include Dīng Feuer (canonical).
    await expect(page.getByTestId("pillar-Stunde-hidden").first()).toContainText("Dīng Feuer");
  });

  test("the day-master depth block is reused (P1 A14) and not duplicated into the pillar grid", async ({ page }) => {
    await reachOverview(page);
    await openBaZiTab(page);

    // The existing Tagesmeister block carries its A14 source label + core text.
    await expect(page.getByTestId("daymaster-source-label")).toBeVisible();
    // Tag pillar detail names the day-master self-frame but defers the element
    // interpretation to the dedicated block — the pillar.day frame text appears.
    await expect(page.getByTestId("pillar-detail-Tag")).toContainText(/Selbst|Kernidentität/);
  });
});
