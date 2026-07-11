// TagespulsV2 — Kernritual-Verdrahtung (Etappe 1).
// Zusätzlich: Wording-Gate für das daily/-Unterverzeichnis, das der
// Top-Level-Scanner in wordingHonesty.test.ts nicht erfasst (non-recursive).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DailyPulseResponse } from "../../api/bazodiacClient";
import { clearAllReflections, getReflection } from "../../utils/daily/reflectionStore";

const fetchDailyPulse = vi.fn();
vi.mock("../../api/bazodiacClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../api/bazodiacClient")>();
  return {
    ...mod,
    BazodiacClient: { ...mod.BazodiacClient, fetchDailyPulse: (...args: unknown[]) => fetchDailyPulse(...args) },
  };
});

// Sync ist Etappe-2-Beiwerk: hier nur als Trigger geprüft, nie als Netzwerk.
vi.mock("../../utils/daily/reflectionSync", () => ({ syncReflections: vi.fn().mockResolvedValue("skipped") }));

import TagespulsV2 from "./TagespulsV2";
import { syncReflections } from "../../utils/daily/reflectionSync";

// Pro Render ein frischer birthKey: TagespulsV2 cached Antworten modulweit
// pro Geburtsdaten+Datum — gleiche Daten würden Test-Mocks gegenseitig maskieren.
let birthCounter = 0;
const freshBirth = () => ({ name: `Ada${++birthCounter}`, birthDate: "1985-06-15", birthTime: "14:30" } as any);

function vmFixture(overrides: Partial<DailyPulseResponse> = {}): DailyPulseResponse {
  return {
    date: "2026-07-10",
    western: { summary: "Westliche Färbung des Tages.", themes: ["Kommunikation"], caution: null, opportunity: null },
    eastern: {
      summary: "Östlicher Rahmen.",
      themes: [],
      caution: null,
      opportunity: null,
      dayMaster: "Xin",
      dailyPillar: { stem: "Yi", branch: "Mao" },
      relationToDayMaster: "wealth",
      jieqi: "Mangzhong",
    },
    fusion: { summary: null, synthesis: "Beide Ströme heute im Blick." },
    action: null,
    pushText: null,
    pushworthy: false,
    jieqiNote: null,
    weekdayNote: null,
    description: "x",
    source: "fufire",
    available: true,
    westEvidence: { transitSectors: [2, 0], natalFocus: ["sun", "ascendant"] },
    natal: {
      sunSign: "Zwillinge",
      moonSign: "Fische",
      ascendantSign: "Waage",
      dayMaster: "Xin",
      harmonyIndex: 0.61,
      elements: { Holz: 0.5, Feuer: 0.49, Erde: 0.37, Metall: 0.28, Wasser: 0.5 },
    },
    qualityFlags: null,
    ...overrides,
  };
}

let container: HTMLElement;
let root: Root;

async function render(vm: DailyPulseResponse) {
  fetchDailyPulse.mockResolvedValue(vm);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<TagespulsV2 birthData={freshBirth()} />);
  });
}

const q = (sel: string) => container.querySelector(sel);

beforeEach(() => {
  clearAllReflections();
  fetchDailyPulse.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("TagespulsV2 — Kernritual", () => {
  it("rendert Perturbation, Faktenzeile, Tagestyp (Einfluss-Tag aus wealth) und West-Karte", async () => {
    await render(vmFixture());
    expect(q('[data-testid="perturbation-view"]')).not.toBeNull();
    expect(q('[data-testid="perturbation-day-marker"]')).not.toBeNull(); // Yi → Holz ist markiert
    expect(q('[data-testid="daily-facts"]')?.textContent).toContain("Körner mit Grannen");
    expect(q('[data-testid="daily-facts"]')?.textContent).toContain("Hase");
    expect(q('[data-testid="daily-daytype-label"]')?.textContent).toBe("Einfluss-Tag");
    expect(q('[data-testid="daily-speaker"]')?.textContent).toContain("Xīn");
    expect(q('[data-testid="daily-west-archetyp"]')?.textContent).toContain("Sonne");
    // Aszendent vorhanden → kein Leer-Sitz-Hinweis
    expect(q('[data-testid="daily-ascendant-empty"]')).toBeNull();
  });

  it("Wiedererkennungs-Tap persistiert und die Gegenseite-Wahl kündigt den Perspektivwechsel an", async () => {
    await render(vmFixture());
    await act(async () => {
      (q('[data-testid="recognition-gegenseite"]') as HTMLElement).click();
    });
    expect(q('[data-testid="recognition-gegenseite-note"]')?.textContent).toContain("Gegenseite");
    // gespeichert unter dem lokalen Tagesdatum
    const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
    expect(getReflection(today)?.reaction).toBe("gegenseite");
    expect(getReflection(today)?.dayType).toBe("einfluss");
  });

  it("Begegnungswahl notiert die Wahl und zeigt die Bestätigung", async () => {
    await render(vmFixture());
    const offerBtn = q('[data-testid="daily-encounter"] button') as HTMLElement;
    expect(offerBtn).not.toBeNull();
    await act(async () => {
      offerBtn.click();
    });
    expect(q('[data-testid="encounter-done"]')?.textContent).toContain("Deine Wahl ist notiert");
  });

  it("ehrliche Missing-States: ohne Elemente keine Perturbation, ohne Relation kein Tagestyp/Tap", async () => {
    await render(
      vmFixture({
        natal: { sunSign: "Zwillinge", moonSign: null, ascendantSign: null, dayMaster: "Xin", harmonyIndex: null, elements: null },
        eastern: { ...vmFixture().eastern!, relationToDayMaster: "mystery" },
      }),
    );
    expect(q('[data-testid="perturbation-missing"]')).not.toBeNull();
    expect(q('[data-testid="daily-daytype-missing"]')).not.toBeNull();
    expect(q('[data-testid="daily-recognition"]')).toBeNull();
    // fehlende Geburtszeit → sichtbar leerer Aszendent-Sitz
    expect(q('[data-testid="daily-ascendant-empty"]')).not.toBeNull();
  });

  it("Quelle missing → Missing-State statt erfundener Werte", async () => {
    await render(vmFixture({ available: false, source: "missing", western: null, eastern: null, description: null }));
    expect(q('[data-testid="daily-missing"]')).not.toBeNull();
  });

  it("verortet die West-Sektoren mit Lebensbereich-Labels (0-Index normalisiert)", async () => {
    await render(vmFixture()); // westEvidence.transitSectors: [2, 0]
    const loc = q('[data-testid="daily-west-sectors"]');
    expect(loc?.textContent).toContain("3 · Kommunikation & nahes Umfeld");
    expect(loc?.textContent).toContain("1 · Selbst & Auftreten");
  });

  it("rendert die Sektor-Zeile NICHT, wenn kein Sektor ein bekanntes Label hat", async () => {
    await render(vmFixture({ westEvidence: { transitSectors: [99], natalFocus: ["sun"] } }));
    expect(q('[data-testid="daily-west-sectors"]')).toBeNull();
  });

  it("stößt den stillen Abgleich beim Mount und nach dem Wiedererkennungs-Tap an", async () => {
    const sync = vi.mocked(syncReflections);
    sync.mockClear();
    await render(vmFixture());
    expect(sync).toHaveBeenCalledTimes(1); // einmal beim Mount
    await act(async () => {
      (q('[data-testid="recognition-kenne_ich"]') as HTMLElement).click();
    });
    expect(sync).toHaveBeenCalledTimes(2); // fire-and-forget nach der Antwort
  });

  it("Wochenbogen ist aufklappbar (ruhiger Rückblick, kein Pflichtteil)", async () => {
    await render(vmFixture());
    expect(q('[data-testid="wochenbogen"]')).toBeNull();
    await act(async () => {
      (q('[data-testid="wochenbogen-toggle"]') as HTMLElement).click();
    });
    expect(q('[data-testid="wochenbogen"]')).not.toBeNull();
  });
});

describe("Wording-Gate für daily/ (Top-Level-Scanner erfasst Unterverzeichnisse nicht)", () => {
  const FORBIDDEN = /coaching|therapie|diagnose/i;
  const ESO_FORBIDDEN = /seele|metaphysisch|kollationiert|wahres ich|schicksal|resonanz/i;
  const VERDICT = /\bdu bist\b|\bdu wirst\b|garantiert|beweist/i;

  const FILES = [
    join(__dirname, "TagespulsV2.tsx"),
    join(__dirname, "..", "..", "utils", "daily", "baziLabels.ts"),
    join(__dirname, "..", "..", "utils", "daily", "dayTypeSelector.ts"),
    join(__dirname, "..", "..", "utils", "daily", "encounterChoices.ts"),
    join(__dirname, "..", "..", "utils", "daily", "reflectionStore.ts"),
    join(__dirname, "..", "..", "utils", "daily", "reflectionSync.ts"),
    join(__dirname, "..", "..", "utils", "daily", "sectorLabels.ts"),
    join(__dirname, "..", "..", "utils", "daily", "weeklyObservations.ts"),
    join(__dirname, "..", "..", "utils", "daily", "dayPulse.ts"),
    join(__dirname, "Wochenbogen.tsx"),
  ];

  for (const file of FILES) {
    it(`${file.split("/").slice(-1)[0]} trägt kein verbotenes Vokabular`, () => {
      const src = readFileSync(file, "utf8");
      for (const re of [FORBIDDEN, ESO_FORBIDDEN, VERDICT]) {
        const hit = src.match(re);
        expect(hit, `"${hit?.[0]}" in ${file}`).toBeNull();
      }
    });
  }
});
