import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 4173;
const MOCK_PORT = 8799;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ],
  webServer: [
    {
      command: `node tests/e2e/mock-fufire.mjs`,
      port: MOCK_PORT,
      reuseExistingServer: false,
      timeout: 30000,
      env: { MOCK_FUFIRE_PORT: String(MOCK_PORT) }
    },
    {
      command: `npx tsx server.ts`,
      port: APP_PORT,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        PORT: String(APP_PORT),
        NODE_ENV: "development",
        FUFIRE_API_URL: `http://localhost:${MOCK_PORT}`,
        FUFIRE_API_KEY: "test-key",
        FUFIRE_API_VERSION: "v1",
        REQUEST_TIMEOUT_MS: "12000",
        ENABLE_DEMO_PROFILES: "true",
        ENABLE_LOCAL_ASTROLOGY_FALLBACK: "false"
      }
    }
  ]
});
