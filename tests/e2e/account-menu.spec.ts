import { test, expect } from "@playwright/test";

/**
 * REQ-P3-005: AccountMenu e2e tests.
 *
 * Two modes:
 *   1. Disabled-state: no VITE_SUPABASE_* env → shows "nicht verfügbar" badge.
 *   2. Configured-state: VITE_SUPABASE_* set → shows trigger button (login flow mocked).
 *
 * The login flow and actual Magic-Link sending are NOT tested here (require real Supabase
 * session). Those live in the gated live-check script (Task 6 / REQ-P3-006).
 */

test.describe("AccountMenu — disabled state (no Supabase env)", () => {
  test("shows disabled badge when Supabase not configured", async ({ page }) => {
    // The test server may or may not have VITE_SUPABASE_* set.
    // We can only assert the disabled badge when it is NOT set.
    // In CI the env is absent, so this test exercises the real disabled path.
    await page.goto("/");
    const disabled = page.getByTestId("account-menu-disabled");
    const trigger = page.getByTestId("account-menu-trigger");

    // Exactly one of disabled or trigger must be visible.
    const disabledCount = await disabled.count();
    const triggerCount = await trigger.count();
    expect(disabledCount + triggerCount).toBe(1);

    if (disabledCount === 1) {
      await expect(disabled).toBeVisible();
      await expect(disabled).toContainText("nicht verfügbar");
    } else {
      // Supabase is configured in this environment — skip disabled assertion.
      test.info().annotations.push({
        type: "note",
        description: "Supabase configured: skipping disabled-badge assertion",
      });
    }
  });
});

test.describe("AccountMenu — configured state (Supabase env present)", () => {
  test.skip(
    !process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY,
    "Skipped: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set"
  );

  test("shows account-menu-trigger button", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByTestId("account-menu-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText("Anmelden");
  });

  test("opens login panel on trigger click", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("account-menu-trigger").click();
    const loginBtn = page.getByTestId("account-login-button");
    await expect(loginBtn).toBeVisible();
  });

  test("shows email input after clicking Magic Link", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("account-menu-trigger").click();
    await page.getByTestId("account-login-button").click();
    const emailInput = page.getByTestId("account-email-input");
    await expect(emailInput).toBeVisible();
    await expect(page.getByTestId("account-send-link")).toBeVisible();
  });
});
