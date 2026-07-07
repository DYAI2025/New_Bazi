import { Page } from "@playwright/test";

/**
 * Redesign (RD-2): the app cold-starts on the FusionHero landing screen; the InputForm
 * now lives behind the hero CTA. Specs that exercise the app traverse the landing via
 * this helper. Safe no-op if the CTA is absent (already past the landing / non-landing
 * route), so it can be dropped in after any goto without conditionals at the call site.
 */
export async function dismissLanding(page: Page): Promise<void> {
  const cta = page.getByTestId("fusion-hero-cta");
  if ((await cta.count()) > 0) {
    await cta.first().click();
  }
}
