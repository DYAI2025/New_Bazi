/**
 * reflectionStore — geräte-lokale Persistenz der Tages-Reflexionen
 * (Wiedererkennungs-Tap + Begegnungswahl) für den Muster-Spiegel.
 *
 * Etappe 1 speichert bewusst NUR lokal (localStorage): funktioniert für
 * anonyme Nutzer sofort, nichts verlässt das Gerät, Löschung = ein Aufruf.
 * Die Supabase-Synchronisation für eingeloggte Nutzer ist Etappe 2 —
 * dieses Interface ist so geschnitten, dass ein Server-Store es 1:1
 * ersetzen kann.
 *
 * Ehrlichkeitsregeln:
 * - Aggregate erst ab n≥3 pro Tagestyp ("noch kein Muster belastbar" davor).
 * - Lücken werden nie gezählt, nie gedeutet — es gibt keinen Streak-Wert.
 * - Reaktions-Aggregate sind Beobachtungen, nie Urteile (Wording in der UI).
 */

import type { DayTypeId } from "./baziLabels";
import type { Reaction } from "./dayTypeSelector";

export interface DailyReflection {
  /** ISO-Datum (YYYY-MM-DD) des Tages, auf den sich die Reflexion bezieht. */
  date: string;
  dayType: DayTypeId;
  reaction: Reaction | null;
  /** Gewählte Begegnungsqualität (oder Freitext); null = übersprungen. */
  encounterChoice: string | null;
  /** Verzichtswahl ("Ich versuche heute nicht …"); null = keine. */
  vetoChoice: string | null;
  /** Unix-ms der letzten Änderung. */
  updatedAt: number;
}

export interface DayTypeAggregate {
  dayType: DayTypeId;
  total: number;
  kenneIch: number;
  teils: number;
  gegenseite: number;
  /** true erst ab n≥3 — darunter zeigt die UI "noch kein Muster belastbar". */
  reliable: boolean;
}

const STORAGE_KEY = "nb.daily.reflections.v1";
const MIN_RELIABLE_N = 3;
/** Obergrenze gegen unbegrenztes Wachstum; älteste Einträge fallen zuerst. */
const MAX_ENTRIES = 400;

type Stored = Record<string, DailyReflection>; // key = date

function readAll(): Stored {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Stored) : {};
  } catch {
    // Korrupter Store: lieber leer starten als crashen — der Nutzer sieht
    // dann den ehrlichen "noch kein Muster"-Zustand, keine erfundenen Daten.
    return {};
  }
}

function writeAll(stored: Stored): void {
  if (typeof localStorage === "undefined") return;
  const entries = Object.entries(stored);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => a[0].localeCompare(b[0])); // ISO-Datum sortiert chronologisch
    stored = Object.fromEntries(entries.slice(entries.length - MAX_ENTRIES));
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Quota/Privacy-Mode: Persistenz still deaktiviert — kein Crash, kein Fake.
  }
}

export function getReflection(date: string): DailyReflection | null {
  return readAll()[date] ?? null;
}

export function saveReflection(partial: Omit<DailyReflection, "updatedAt">): DailyReflection {
  const all = readAll();
  const merged: DailyReflection = { ...all[partial.date], ...partial, updatedAt: Date.now() };
  all[partial.date] = merged;
  writeAll(all);
  return merged;
}

/** Letzte Reaktion beim GLEICHEN Tagestyp VOR dem angegebenen Datum (Agency-Loop). */
export function lastReactionForType(dayType: DayTypeId, beforeDate: string): Reaction | null {
  const all = readAll();
  const candidates = Object.values(all)
    .filter((r) => r.dayType === dayType && r.date < beforeDate && r.reaction !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
  return candidates[0]?.reaction ?? null;
}

/** Aggregat pro Tagestyp für den Muster-Spiegel; reliable erst ab n≥3. */
export function aggregateByType(dayType: DayTypeId): DayTypeAggregate {
  const all = Object.values(readAll()).filter((r) => r.dayType === dayType && r.reaction !== null);
  const agg: DayTypeAggregate = {
    dayType,
    total: all.length,
    kenneIch: all.filter((r) => r.reaction === "kenne_ich").length,
    teils: all.filter((r) => r.reaction === "teils").length,
    gegenseite: all.filter((r) => r.reaction === "gegenseite").length,
    reliable: all.length >= MIN_RELIABLE_N,
  };
  return agg;
}

/** Merge externer Einträge (Sync): gewinnt nur mit neuerem updatedAt oder wenn lokal fehlend. */
export function importReflections(items: DailyReflection[]): number {
  const all = readAll();
  let imported = 0;
  for (const item of items) {
    const local = all[item.date];
    if (!local || item.updatedAt > local.updatedAt) {
      all[item.date] = item;
      imported++;
    }
  }
  if (imported > 0) writeAll(all);
  return imported;
}

/** Reflexionen ab einem ISO-Datum (inkl.), chronologisch — für den Wochenbogen. */
export function listReflectionsSince(sinceDate: string): DailyReflection[] {
  return Object.values(readAll())
    .filter((r) => r.date >= sinceDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Aggregate aller Tagestypen, die mindestens einen Eintrag mit Reaktion haben. */
export function aggregateAll(): DayTypeAggregate[] {
  const present = new Set(
    Object.values(readAll())
      .filter((r) => r.reaction !== null)
      .map((r) => r.dayType),
  );
  return [...present].map((t) => aggregateByType(t));
}

/** Vollständige Löschung — Nutzerrecht, ein Aufruf. */
export function clearAllReflections(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // still: nichts zu löschen, wenn Storage nicht verfügbar
  }
}
