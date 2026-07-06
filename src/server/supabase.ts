import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Serverseitiger Supabase-Zugriff. Service-Role-Key NUR hier — niemals im Browser.
// Fehlt die Konfiguration, läuft New_Bazi vollständig anonym weiter
// (Persistenz-Features zeigen ehrlichen Disabled-State).

let cached: SupabaseClient | null | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getServerSupabase(): SupabaseClient | null {
  if (cached !== undefined && process.env.NODE_ENV !== "test") return cached;
  cached = isSupabaseConfigured()
    ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  return cached;
}
