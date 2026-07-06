import { describe, it, expect, vi, afterEach } from "vitest";
import { getServerSupabase, isSupabaseConfigured } from "./supabase";

afterEach(() => vi.unstubAllEnvs());

describe("server supabase client", () => {
  it("isSupabaseConfigured false ohne Env (ehrlicher Disabled-State, kein Throw)", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(getServerSupabase()).toBeNull();
  });

  it("liefert Client-Singleton wenn konfiguriert", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    const a = getServerSupabase();
    expect(a).not.toBeNull();
  });
});
