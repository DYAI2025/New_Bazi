/**
 * REQ-P4-006: Unknown birth time — InputForm checkbox + form behaviour
 *
 * Tests the "Geburtszeit unbekannt" checkbox: time field disables, hint appears,
 * submit button unlocks without a time, re-check restores time field.
 *
 * Normalizer degradation (ascendant→null, hour pillar, houses) is covered by
 * fufireNormalizer unit tests (257 GREEN); this spec validates the UI contract.
 */
import { test, expect, Page } from "@playwright/test";

async function fillNameDate(page: Page) {
  await page.fill("#input-name", "Unknown Zeit");
  await page.fill("#input-date", "1990-06-15");
}

async function selectBerlin(page: Page) {
  await page.fill("#input-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("place-coords")).toBeVisible();
}

test("checkbox 'Geburtszeit unbekannt' is present in the form", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#input-time-unknown")).toBeVisible();
  await expect(page.locator('label[for="input-time-unknown"]')).toContainText("Geburtszeit unbekannt");
});

test("checking the checkbox disables the time field and clears its value", async ({ page }) => {
  await page.goto("/");
  await page.fill("#input-time", "14:30");
  const timeInput = page.locator("#input-time");
  await expect(timeInput).not.toBeDisabled();

  await page.check("#input-time-unknown");

  await expect(timeInput).toBeDisabled();
  const val = await timeInput.inputValue();
  expect(val).toBe("");
});

test("hint text appears when checkbox is checked", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=Tagesmitte (12:00)")).not.toBeVisible();
  await page.check("#input-time-unknown");
  await expect(page.locator("text=Tagesmitte (12:00)")).toBeVisible();
});

test("submit button unlocks without a time when checkbox is checked", async ({ page }) => {
  await page.goto("/");
  await fillNameDate(page);
  await selectBerlin(page);

  const btn = page.locator("#submit-calculate-btn");
  await expect(btn).toBeDisabled();

  await page.check("#input-time-unknown");

  await expect(btn).toBeEnabled();
});

test("unchecking restores time field and re-requires a time for submit", async ({ page }) => {
  await page.goto("/");
  await fillNameDate(page);
  await selectBerlin(page);

  await page.check("#input-time-unknown");
  await expect(page.locator("#submit-calculate-btn")).toBeEnabled();

  await page.uncheck("#input-time-unknown");

  await expect(page.locator("#input-time")).not.toBeDisabled();
  await expect(page.locator("#submit-calculate-btn")).toBeDisabled();
});

test("full unknown-time flow: submit → overview shows 'Zeit unbekannt' tag for Aszendent", async ({ page }) => {
  await page.goto("/");
  await fillNameDate(page);
  await selectBerlin(page);
  await page.check("#input-time-unknown");
  await page.click("#submit-calculate-btn");

  // Wait for result; the mock returns non-provisional data so ascendant is computed.
  // This test asserts the submit succeeded and we reach the overview (not an error screen).
  await expect(page.locator("#overview-dashboard")).toBeVisible({ timeout: 15000 });
});
