/**
 * P5-T2 — Content-Registry CONTRACT TEST (TDD, RED zuerst).
 *
 * Boundary-Gate (Kritische semantische Glättung): Die Registry ist eine REINE
 * In-Process-Datenstruktur (statische Einträge + getEntry-Lookup) — kein I/O,
 * keine DB, kein Netz, kein UI-Render, keine System-Verdrahtung im Scope von
 * T2. Verdikt: PURE. Daher KEINE Gegenthese/Reality-Ledger, KEINE erfundenen
 * Failure-Modes, KEINE „falls später verdrahtet…"-Hedges — geprüft werden die
 * Invarianten, die die Spec selbst impliziert: Vollständigkeit, eindeutige IDs,
 * Wortband, Anti-Reifikation, source-Enum und ID-/Reihenfolge-Konsistenz mit
 * den kanonischen Tabellen in ../../utils/astrology.
 *
 * Customer-Value (VCHK): Jeder Profil-Datenpunkt bekommt eine lesbare, edle,
 * deskriptive Einordnung (kein „Du bist…"-Urteil), substanziell genug (60–120
 * Wörter) und korrekt an das reale Engine-Token gebunden (stem/branch-IDs in
 * kanonischer Reihenfolge) — damit der RICHTIGE Text den RICHTIGEN Profil-Slot
 * erreicht.
 *
 * RED-Erwartung: index.ts importiert 6 Domain-Module, die in T2 noch nicht
 * existieren. Solange sie fehlen, schlägt der Modul-Import fehl und dieser Test
 * ist RED. GREEN ist erst nach Lieferung aller 6 Module mit 55 Einträgen.
 */
import { describe, it, expect } from "vitest";
import { ALL_ENTRIES, getEntry } from "./index";
import type { ExplanationEntry } from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from "../../utils/astrology";

// --- Erwartete Domain-Größen (Summe 55) ---
const DOMAIN_COUNTS: Record<string, number> = {
  "zodiac.": 12,
  "stem.": 10,
  "branch.": 12,
  "element.": 5,
  "pillar.": 4,
  "house.": 12,
};
const TOTAL_ENTRIES = 55;

// Verbotene Begriffe — literal UND Bedeutung deskriptiv-fixierend (Amendment D).
const FORBIDDEN =
  /coaching|therapie|diagnose|heilung|schicksal|du bist|du musst|macht dich zu|bestimmt dich|prägt dich/i;

const WORDS = (s: string) => s.trim().split(/\s+/).filter(Boolean);

// Kanonisches Pinyin → ID-Suffix-Mapping (Diakritika folgen astrology.ts;
// IDs sind ASCII-kleingeschrieben gemäß content-sources.md, z. B. Jiǎ → jia).
const STEM_ID_SUFFIX: Record<string, string> = {
  Jiǎ: "jia",
  Yǐ: "yi",
  Bǐng: "bing",
  Dīng: "ding",
  Wù: "wu",
  Jǐ: "ji",
  Gēng: "geng",
  Xīn: "xin",
  Rén: "ren",
  Guǐ: "gui",
};
const BRANCH_ID_SUFFIX: Record<string, string> = {
  Zǐ: "zi",
  Chǒu: "chou",
  Yǐn: "yin", // kanonisch New_Bazi (NICHT AN-„Yín")
  Mǎo: "mao",
  Chén: "chen",
  Sì: "si",
  Wǔ: "wu",
  Wèi: "wei",
  Shēn: "shen",
  Yǒu: "you",
  Xū: "xu",
  Hài: "hai",
};

describe("Content-Registry — Domain-Vollständigkeit", () => {
  it("enthält genau 55 Einträge", () => {
    expect(ALL_ENTRIES).toHaveLength(TOTAL_ENTRIES);
  });

  it("hat die kanonische Domain-Verteilung 12/10/12/5/4/12", () => {
    for (const [prefix, count] of Object.entries(DOMAIN_COUNTS)) {
      const inDomain = ALL_ENTRIES.filter((e) => e.id.startsWith(prefix));
      expect(inDomain, `Domain "${prefix}" muss ${count} Einträge haben`).toHaveLength(count);
    }
  });

  it("jeder Eintrag gehört zu genau einer der 6 bekannten Domains", () => {
    const prefixes = Object.keys(DOMAIN_COUNTS);
    for (const e of ALL_ENTRIES) {
      const matches = prefixes.filter((p) => e.id.startsWith(p));
      expect(matches, `ID "${e.id}" muss genau eine Domain treffen`).toHaveLength(1);
    }
  });

  it("alle IDs sind eindeutig", () => {
    const ids = ALL_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Content-Registry — Längenband (60–120 Wörter)", () => {
  it.each(ALL_ENTRIES.map((e) => [e.id, e] as const))(
    "%s: long liegt im 60–120-Wort-Band",
    (_id, entry: ExplanationEntry) => {
      const n = WORDS(entry.long).length;
      expect(n).toBeGreaterThanOrEqual(60);
      expect(n).toBeLessThanOrEqual(120);
    }
  );
});

describe("Content-Registry — Anti-Reifikation (Amendment D)", () => {
  it.each(ALL_ENTRIES.map((e) => [e.id, e] as const))(
    "%s: long+short enthalten KEINE verbotenen/deterministischen Begriffe",
    (_id, entry: ExplanationEntry) => {
      expect(entry.long).not.toMatch(FORBIDDEN);
      expect(entry.short).not.toMatch(FORBIDDEN);
    }
  );
});

describe("Content-Registry — Felder & source-Enum", () => {
  it.each(ALL_ENTRIES.map((e) => [e.id, e] as const))(
    "%s: Pflichtfelder gesetzt, source ∈ {astro-noctum, curated}",
    (_id, entry: ExplanationEntry) => {
      expect(entry.id).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.symbol).toBeTruthy();
      expect(entry.short.trim().length).toBeGreaterThan(0);
      expect(["astro-noctum", "curated"]).toContain(entry.source);
    }
  );

  it("der literale Anker-Slot ' {anchor}' steht am Ende jedes long", () => {
    for (const e of ALL_ENTRIES) {
      expect(e.long.trimEnd().endsWith("{anchor}"), `long von "${e.id}" muss mit {anchor} enden`).toBe(true);
    }
  });
});

describe("Content-Registry — kanonische ID-/Reihenfolge-Konsistenz mit astrology.ts", () => {
  it("stem.*-IDs entsprechen HEAVENLY_STEMS in kanonischer Reihenfolge", () => {
    const expected = HEAVENLY_STEMS.map((s) => `stem.${STEM_ID_SUFFIX[s.name]}`);
    const actual = ALL_ENTRIES.filter((e) => e.id.startsWith("stem.")).map((e) => e.id);
    // jedes kanonische Pinyin muss als ID auftauchen …
    for (const id of expected) expect(actual).toContain(id);
    // … und zwar in kanonischer Reihenfolge (Index-treu zu HEAVENLY_STEMS).
    expect(actual).toEqual(expected);
  });

  it("branch.*-IDs entsprechen EARTHLY_BRANCHES in kanonischer Reihenfolge (Yǐn, nicht Yín)", () => {
    const expected = EARTHLY_BRANCHES.map((b) => `branch.${BRANCH_ID_SUFFIX[b.name]}`);
    const actual = ALL_ENTRIES.filter((e) => e.id.startsWith("branch.")).map((e) => e.id);
    for (const id of expected) expect(actual).toContain(id);
    expect(actual).toEqual(expected);
  });
});

describe("Content-Registry — getEntry-Lookup", () => {
  it("findet einen bekannten Eintrag und gibt für unbekannte IDs undefined zurück", () => {
    const first = ALL_ENTRIES[0];
    expect(getEntry(first.id)).toBe(first);
    expect(getEntry("does.not.exist")).toBeUndefined();
  });
});
