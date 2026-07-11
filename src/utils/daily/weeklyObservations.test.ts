import { describe, it, expect } from "vitest";
import { weeklyObservations } from "./weeklyObservations";
import type { DayTypeAggregate } from "./reflectionStore";

// Bindend (Konzept): "System beobachtet … prüfe, ob das stimmt" — nie Urteil,
// Pflicht-Datenanker (n von m), unter n=3 ehrlicher Empty-State.
const VERDICT = /\bdu bist\b|\bdu wirst\b|\bimmer\b|\bnie\b|garantiert|beweist|solltest|musst/i;

const agg = (dayType: string, kenneIch: number, teils: number, gegenseite: number): DayTypeAggregate => ({
  dayType: dayType as any, total: kenneIch + teils + gegenseite,
  kenneIch, teils, gegenseite, reliable: kenneIch + teils + gegenseite >= 3,
});

describe("weeklyObservations", () => {
  it("belastbare Typen ergeben Beobachtungen mit Datenanker (n von m) und Prüf-Einladung", () => {
    const obs = weeklyObservations([agg("ausdruck", 6, 1, 1)]);
    expect(obs).toHaveLength(1);
    expect(obs[0].text).toContain("6 von 8");
    expect(obs[0].text.toLowerCase()).toContain("ausdruck");
    expect(obs[0].invitation).toMatch(/prüfe/i);
  });

  it("unter n=3 gibt es KEINE Beobachtung, sondern den ehrlichen Empty-Marker", () => {
    const obs = weeklyObservations([agg("struktur", 1, 0, 1)]);
    expect(obs).toHaveLength(1);
    expect(obs[0].text).toContain("noch kein Muster belastbar");
    expect(obs[0].text).toContain("2");
    expect(obs[0].invitation).toBeNull();
  });

  it("dominante Gegenseite und dominantes Teils bekommen eigene Schablonen", () => {
    expect(weeklyObservations([agg("einfluss", 0, 0, 4)])[0].text).toMatch(/Gegenseite/);
    expect(weeklyObservations([agg("ressource", 1, 3, 1)])[0].text).toMatch(/gemischt/i);
  });

  it("kein Template trägt Verdikt-Sprache — für alle Verteilungen", () => {
    const cases = [agg("ausdruck", 5, 0, 0), agg("einfluss", 0, 0, 4), agg("ressource", 2, 2, 2), agg("gleichrang", 0, 1, 0), agg("struktur", 0, 4, 0)];
    for (const o of weeklyObservations(cases)) {
      expect(o.text, o.text).not.toMatch(VERDICT);
      expect(o.invitation ?? "").not.toMatch(VERDICT);
    }
  });
});
