import { test, expect } from "@playwright/test";

// RD-2: the FusionHero landing is the default first screen. It must read as a calm
// tension field (one question), NOT a horoscope/score, and its CTA must enter the live
// InputForm flow. The InputForm→profile spine is unchanged (covered by the other specs,
// which now traverse this landing via dismissLanding).

test.describe("Redesign landing — FusionHero first screen", () => {
  test("cold start shows the FusionHero missing-state, NO demo score", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("fusion-hero")).toBeVisible();
    await expect(page.getByTestId("fusion-hero-question")).toContainText("Noch keine Engine-Daten");
    await expect(page.getByTestId("fusion-hero-demo")).toHaveCount(0);
    // Brief: kein Score/% im Hero.
    const hero = (await page.getByTestId("fusion-hero").textContent()) ?? "";
    expect(hero).not.toMatch(/%/);
    expect(hero).not.toMatch(/demo/i);
    // Anti-reification headline present.
    await expect(page.getByTestId("fusion-hero")).toContainText("kein Urteil");
  });

  test("CTA enters the live input flow (spine intact)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#input-name")).toHaveCount(0); // form behind the landing
    await page.getByTestId("fusion-hero-cta").click();
    await expect(page.locator("#input-name")).toBeVisible();
  });

  test("reduced-motion: hero still renders (no animated-background crash)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByTestId("fusion-hero")).toBeVisible();
    await expect(page.getByTestId("fusion-hero-question")).toContainText("Noch keine Engine-Daten");
  });

  test("pre-input tension preview shows no static example and links to live input", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("spannungs-missing")).toContainText("kein berechnetes Spannungsfeld");
    await expect(page.getByTestId("spannungs-question")).toHaveCount(0);
    const txt = (await page.getByTestId("spannungs-preview").textContent()) ?? "";
    expect(txt).not.toMatch(/demo|du bist|\d+\s?%/i);
    await page.getByTestId("spannungs-live-cta").click();
    await expect(page.locator("#input-name")).toBeVisible();
  });

  test("visible-engine bento shows six explanatory cards (no fake metric)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("engine-bento")).toBeVisible();
    await expect(page.getByTestId("engine-card")).toHaveCount(6);
    const bento = (await page.getByTestId("engine-bento").textContent()) ?? "";
    expect(bento).not.toMatch(/\d+\s?%|score|du bist/i);
  });

  test("method/trust shows the four boundaries + fusion-path + premium (no fate claim)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("method-trust")).toBeVisible();
    await expect(page.getByTestId("trust-boundary")).toHaveCount(4);
    await expect(page.getByTestId("fusion-path")).toBeVisible();
    await expect(page.getByTestId("premium-bridge")).toBeVisible();
    const landing = (await page.getByTestId("landing-page").textContent()) ?? "";
    expect(landing).not.toMatch(/\bdu bist\b|garantiert|beweist deine|sagt deine zukunft voraus/i);
  });

  test("mobile viewport (360px): hero, question and CTA are accessible", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    await expect(page.getByTestId("fusion-hero")).toBeVisible();
    await expect(page.getByTestId("fusion-hero-question")).toContainText("?");
    const cta = page.getByTestId("fusion-hero-cta");
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page.locator("#input-name")).toBeVisible();
  });
});
