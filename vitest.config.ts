import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    // Belt-and-suspenders beyond NODE_ENV=test: the rate limiter is skipped for the
    // whole suite so supertest volume never trips a 429 (SEC-RATELIMIT-01). The
    // dedicated rate-limit test opts back in with RATE_LIMIT_FORCE.
    env: { DISABLE_RATE_LIMIT: "true" },
    exclude: [...configDefaults.exclude, "tests/e2e/**"]
  }
});
