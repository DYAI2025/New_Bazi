import { describe, expect, it } from "vitest";

import { getViteAllowedHosts, isRailwayRuntime, shouldServeProductionAssets } from "./runtime";

describe("server runtime detection", () => {
  it("always allows the known Railway production host for Vite dev middleware", () => {
    expect(getViteAllowedHosts({})).toContain("newbazi-production.up.railway.app");
  });

  it("normalizes additional Railway and operator-provided hosts", () => {
    expect(getViteAllowedHosts({
      RAILWAY_PUBLIC_DOMAIN: "preview-newbazi.up.railway.app",
      RAILWAY_STATIC_URL: "https://static-newbazi.up.railway.app/path",
      APP_ALLOWED_HOSTS: "custom.example.com, https://second.example.com/foo",
      VITE_ALLOWED_HOSTS: "vite.example.com, https://port.vite.example.com:5173/foo"
    })).toEqual([
      "newbazi-production.up.railway.app",
      "preview-newbazi.up.railway.app",
      "static-newbazi.up.railway.app",
      "vite.example.com",
      "port.vite.example.com",
      "custom.example.com",
      "second.example.com"
    ]);
  });

  it("treats Railway runtime variables as production even when NODE_ENV is not set", () => {
    expect(isRailwayRuntime({ RAILWAY_ENVIRONMENT_NAME: "production" })).toBe(true);
    expect(shouldServeProductionAssets({ RAILWAY_PROJECT_ID: "project-id" })).toBe(true);
    expect(shouldServeProductionAssets({ NODE_ENV: "production" })).toBe(true);
    expect(shouldServeProductionAssets({ NODE_ENV: "development" })).toBe(false);
  });
});
