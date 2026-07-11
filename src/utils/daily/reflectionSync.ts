/**
 * reflectionSync — optionaler Sync für eingeloggte Nutzer (Etappe 2).
 * Pull: Server-Einträge, die lokal fehlen ODER neueres updated_at_ms tragen → importieren.
 * Push: alle lokalen Einträge als Upsert (Server macht onConflict user_id+date).
 * Kein Sync ohne Session; Fehler sind still (Konsole), nie UI-blockierend.
 * localStorage bleibt die Wahrheit auf dem Gerät.
 */

import { supabase } from "../../lib/supabaseClient";
import type { DayTypeId } from "./baziLabels";
import type { Reaction } from "./dayTypeSelector";
import {
  type DailyReflection,
  importReflections,
  listReflectionsSince,
} from "./reflectionStore";

const ENDPOINT = "/api/me/reflections";

/** Server-Row (snake_case) aus GET /api/me/reflections. */
interface ServerReflection {
  date: string;
  day_type: DayTypeId;
  reaction: Reaction | null;
  encounter_choice: string | null;
  veto_choice: string | null;
  updated_at_ms: number;
}

function fromServer(row: ServerReflection): DailyReflection {
  return {
    date: row.date,
    dayType: row.day_type,
    reaction: row.reaction ?? null,
    encounterChoice: row.encounter_choice ?? null,
    vetoChoice: row.veto_choice ?? null,
    updatedAt: row.updated_at_ms,
  };
}

export async function syncReflections(): Promise<"synced" | "skipped" | "error"> {
  if (!supabase) return "skipped";

  let token: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  } catch (err) {
    console.error("reflectionSync: Session-Abfrage fehlgeschlagen", err);
    return "error";
  }
  if (!token) return "skipped";

  let failed = false;

  // Pull — Server-Einträge einmischen (updatedAt gewinnt, lokal Fehlendes kommt dazu).
  try {
    const res = await fetch(ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`GET ${ENDPOINT} -> ${res.status}`);
    const rows = (await res.json()) as ServerReflection[];
    if (Array.isArray(rows)) importReflections(rows.map(fromServer));
  } catch (err) {
    console.error("reflectionSync: Pull fehlgeschlagen", err);
    failed = true;
  }

  // Push — best effort, auch wenn der Pull scheiterte. Leerer Store: nichts zu senden.
  try {
    const all = listReflectionsSince("0000-01-01");
    if (all.length > 0) {
      const res = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reflections: all }),
      });
      if (!res.ok) throw new Error(`PUT ${ENDPOINT} -> ${res.status}`);
    }
  } catch (err) {
    console.error("reflectionSync: Push fehlgeschlagen", err);
    failed = true;
  }

  return failed ? "error" : "synced";
}
