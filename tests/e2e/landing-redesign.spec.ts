import { test, expect } from "@playwright/test";

// RD-2: the FusionHero landing is the default first screen. It must read as a calm
// tension field (one question), NOT a horoscope/score, and its CTA must enter the live
// InputForm flow. The InputForm→profile spine is unchanged (covered by the other specs,
// which now traverse this landing via dismissLanding).

test.describe("Redesign landing — FusionHero first screen", () => {
  test("cold start shows the FusionHero: one tension question, demo-labelled, NO score", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("fusion-hero")).toBeVisible();
    await expect(page.getByTestId("fusion-hero-question")).toContainText("?");
    await expect(page.getByTestId("fusion-hero-demo")).toBeVisible();
    // Brief: kein Score/% im Hero.
    const hero = (await page.getByTestId("fusion-hero").textContent()) ?? "";
    expect(hero).not.toMatch(/%/);
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
    await expect(page.getByTestId("fusion-hero-question")).toContainText("?");
  });

  test("micro-experience demo: start → question → react → note + CTA (no identity claim)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("spannungs-start").click();
    await expect(page.getByTestId("spannungs-question")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("spannungs-result")).toContainText("Spannung");
    await page.getByTestId("spannungs-reaction-trifft").click();
    await expect(page.getByTestId("spannungs-note")).toBeVisible();
    await expect(page.getByTestId("spannungs-cta")).toBeVisible();
    const txt = (await page.getByTestId("spannungs-preview").textContent()) ?? "";
    expect(txt).not.toMatch(/du bist/i);
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
});
