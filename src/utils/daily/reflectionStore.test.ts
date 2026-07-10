import { describe, it, expect, beforeEach } from "vitest";
import {
  aggregateAll,
  aggregateByType,
  clearAllReflections,
  getReflection,
  lastReactionForType,
  listReflectionsSince,
  saveReflection,
} from "./reflectionStore";

describe("reflectionStore — geräte-lokaler Muster-Spiegel", () => {
  beforeEach(() => {
    clearAllReflections();
  });

  it("speichert und liest eine Tages-Reflexion (merge-fähig)", () => {
    saveReflection({ date: "2026-07-10", dayType: "ausdruck", reaction: "kenne_ich", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-10", dayType: "ausdruck", reaction: "kenne_ich", encounterChoice: "Ausdruck", vetoChoice: null });
    const r = getReflection("2026-07-10")!;
    expect(r.reaction).toBe("kenne_ich");
    expect(r.encounterChoice).toBe("Ausdruck");
  });

  it("lastReactionForType findet die letzte Reaktion des GLEICHEN Typs VOR dem Datum", () => {
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-05", dayType: "ausdruck", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-07", dayType: "struktur", reaction: "kenne_ich", encounterChoice: null, vetoChoice: null });
    expect(lastReactionForType("ausdruck", "2026-07-10")).toBe("gegenseite");
    // Das eigene Datum zählt nicht mit (strikt VOR beforeDate)
    expect(lastReactionForType("ausdruck", "2026-07-05")).toBe("teils");
    // Anderer Typ bleibt außen vor
    expect(lastReactionForType("gleichrang", "2026-07-10")).toBeNull();
  });

  it("Aggregat wird erst ab n≥3 belastbar (Muster-Spiegel-Schwelle)", () => {
    saveReflection({ date: "2026-07-01", dayType: "einfluss", reaction: "kenne_ich", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-02", dayType: "einfluss", reaction: "kenne_ich", encounterChoice: null, vetoChoice: null });
    expect(aggregateByType("einfluss").reliable).toBe(false);
    saveReflection({ date: "2026-07-03", dayType: "einfluss", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    const agg = aggregateByType("einfluss");
    expect(agg.reliable).toBe(true);
    expect(agg.total).toBe(3);
    expect(agg.kenneIch).toBe(2);
    expect(agg.gegenseite).toBe(1);
  });

  it("Einträge ohne Reaktion zählen nicht ins Aggregat (nur echte Antworten)", () => {
    saveReflection({ date: "2026-07-01", dayType: "ressource", reaction: null, encounterChoice: "Ruhe", vetoChoice: null });
    expect(aggregateByType("ressource").total).toBe(0);
  });

  it("clearAllReflections löscht vollständig (Nutzerrecht)", () => {
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    clearAllReflections();
    expect(getReflection("2026-07-01")).toBeNull();
    expect(aggregateByType("ausdruck").total).toBe(0);
  });
});

describe("Wochenbogen-Erweiterungen", () => {
  beforeEach(() => clearAllReflections());

  it("listReflectionsSince liefert Einträge ab Datum (inklusive), chronologisch", () => {
    saveReflection({ date: "2026-07-01", dayType: "ausdruck", reaction: "teils", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-08", dayType: "struktur", reaction: "kenne_ich", encounterChoice: "Sorgfalt", vetoChoice: null });
    saveReflection({ date: "2026-07-10", dayType: "ausdruck", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    const week = listReflectionsSince("2026-07-08");
    expect(week.map((r) => r.date)).toEqual(["2026-07-08", "2026-07-10"]);
  });

  it("aggregateAll liefert nur Typen mit Reaktions-Einträgen, reliable-Flag pro Typ", () => {
    for (const d of ["2026-07-01", "2026-07-02", "2026-07-03"]) {
      saveReflection({ date: d, dayType: "ausdruck", reaction: "kenne_ich", encounterChoice: null, vetoChoice: null });
    }
    saveReflection({ date: "2026-07-04", dayType: "struktur", reaction: "gegenseite", encounterChoice: null, vetoChoice: null });
    saveReflection({ date: "2026-07-05", dayType: "einfluss", reaction: null, encounterChoice: "Initiative", vetoChoice: null });
    const all = aggregateAll();
    expect(all.map((a) => a.dayType).sort()).toEqual(["ausdruck", "struktur"]);
    expect(all.find((a) => a.dayType === "ausdruck")!.reliable).toBe(true);
    expect(all.find((a) => a.dayType === "struktur")!.reliable).toBe(false);
  });
});
