# Sprint P7: Synastrie-Completion — Inter-Aspekte, Säulen-Vergleich, Element-Spiegel, Paar-Polachsen

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **ZUERST LESEN (bindend):** `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md` — Arbeitsregeln §1 (Branch-Ritual, TDD ohne Ausnahme, Gates vor jedem Commit, Ehrlichkeits-Regeln, rtk-Falle, framer-motion-SVG-Falle), DoD §3, Review-Protokoll §6. Dieser Plan ist Fidelity A: jeder Schritt ist ausformuliert — NICHTS raten, insbesondere keine Astrologie-Tabellen erfinden, sie stehen VOLLSTÄNDIG hier im Dokument.

**Goal:** Die Synastrie wird vollwertig. Bisher liefert sie nur einen simplistischen Score (`src/utils/synastry.ts`: Tagesmeister-Element-Relation + Sonnen-Element) plus den Paar-Spannungsnavigator. Neu: (1) westliche **Inter-Aspekte** zwischen den Planeten von Person A und B, (2) **BaZi-Säulen-Gegenüberstellung** (Wu-Xing-Relation der Stämme + Tier-Harmonien der Zweige), (3) **WuXing-Overlay** (gespiegelte Element-Balken), (4) **Paar-Polachsen je Achse** mit spezifischen (nicht generischen) positiven Texten. Der bestehende Score bleibt, wird aber ehrlich als „heuristischer Gesamteindruck" gelabelt.

**Architecture:** Drei pure Ableitungs-Module (`interAspects.ts`, `baziCompare.ts`, `derivePairAxes` in `tensionPair.ts`) + zwei Content-Erweiterungen (`pairAspectInterpretation` in `aspectInterpretation.ts`, neu `src/content/pairAxisTexts.ts`) + additive Server-Response-Felder + neue UI-Sektionen in `Synastry.tsx`. Die Synastry-Route (`src/server/app.ts` ~Z. 437) löst BEIDE Profile bereits voll auf (`Promise.all([resolveProfile(...), resolveProfile(...)])`) — alle neuen Felder werden serverseitig aus den zwei vorhandenen ViewModels berechnet, **kein zusätzlicher Engine-Call**.

**Bindende inhaltliche Regeln (partner_match-Contract + Anti-Reifikation, test-erzwungen):**
- Sprache: **Muster, Reibung, Ressourcen, Wachstumskanten.** Reibung UND Harmonie positiv gerahmt — nie gut/schlecht, nie Urteil über die Beziehung.
- **Jede Aussage mit Datenanker:** Jeder Satz benennt die konkreten Daten (Planetenpaar + Aspekttyp + Orb; Stamm/Element/Tier der Säule; Element + Lean der Achse).
- **Keine Seelenverwandten-Behauptung, keine Schicksals-Sprache, keine Trennungs-Empfehlung.** Verbotene Regex-Liste in Task 3, von Tests erzwungen.
- Keine „Du bist …"/„Ihr seid …"-Festlegungen; Positionierung Entertainment/Reflexion (Master §1.4).
- Fehlende Daten → leere Arrays/ehrliche Empty-States, NIEMALS erfundene Defaults.

---

## Verifizierte VM-Shapes (Stand 2026-06-11 — nachgeprüft, NICHT neu raten)

Quellen: `src/viewmodels/profileViewModel.ts`, `src/utils/fufireNormalizer.ts`, Fixtures `src/__fixtures__/fufire/*.json`.

1. **`viewModel.western.planets[]` trägt KEINE absolute Länge (longitude).** Felder: `{ name, symbol, sign, house, degree, element, retrograde }` — `name` DEUTSCH (Sonne, Mond, …; „Aszendent" ist NICHT in planets), `sign` deutscher Zeichenname, `degree` = degree_in_sign (0–30, Float, verlustfrei aus der Engine). Absolute Länge exakt rekonstruierbar: `longitude = signIndex(sign) * 30 + degree`. Zeichen-Index (Reihenfolge `WESTERN_ZODIAC` in `src/utils/astrology.ts`, verifiziert):

   | Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Zeichen | Widder | Stier | Zwillinge | Krebs | Löwe | Jungfrau | Waage | Skorpion | Schütze | Steinbock | Wassermann | Fische |

2. **Aszendent im VM nur als Zeichenname** (`western.ascendant: string`), keine Gradzahl. Die echte Engine liefert `western.angles.Ascendant` als Länge (Fixture `western.json`: `190.04613317…`). → Task 1 erweitert das VM additiv um `western.ascendantLongitude: number | null`.
3. **BaZi-Säulen im VM:** `bazi.pillars[]` (genau 4, Reihenfolge Jahr/Monat/Tag/Stunde), FLACHE Felder: `{ title, pillarKey ("Jahr"|"Monat"|"Tag"|"Stunde"), stemChinese, stemPinyin, stemElement: ElementType, stemPolarity, branchChinese, branchPinyin, branchElement, branchAnimal, branchPolarity, hiddenStems }`. `stemElement` ist das deutsche `ElementType`-Enum (`"Holz"|"Feuer"|"Erde"|"Metall"|"Wasser"`, `src/types.ts`), `branchAnimal` der DEUTSCHE Tiername (`ANIMALS_DE` im Normalizer: Ratte, Büffel, Tiger, Hase, Drache, Schlange, Pferd, Ziege, Affe, Hahn, Hund, Schwein). Unaufgelöste Säulen tragen `"Unbekannt"` — NIE als Daten behandeln.
4. **Engine-Aspekt-Shape** (Fixture `western.json.aspects[]`): `{ planet1, planet2, type ("trine"…, englisch), angle, orb, exact_angle }`. Der Normalizer übersetzt via `ASPECT_TYPES_DE` → deutsche Namen (Konjunktion, Opposition, Trigon, Quadrat, Sextil, Quincunx, Halbsextil). Unsere Inter-Aspekte erzeugen die DEUTSCHEN Typnamen direkt (kompatibel mit `aspectInterpretation.ts`).
5. **Synastry-Route** (`src/server/app.ts:437`): validiert beide BirthInputs, `Promise.all([resolveProfile(userV.value), resolveProfile(partnerV.value)])`, vergleicht via `compareProfiles`, antwortet bereits additiv mit `elementalA`/`elementalB` (`fuseElementalWeights` aus `tensionPair.ts`). `a.viewModel`/`b.viewModel` sind VOLLE Profile (planets, pillars, fusion.elementalComparison) — alles Nötige ist serverseitig da.
6. **e2e-Mock** (`tests/e2e/mock-fufire.mjs`): LEGACY-Shapes (planets-Array mit sign/degree; bazi.pillars verschachtelt, deutsche Schlüssel Jahr/Monat/Tag/Stunde, deutsche Tiere). `PARTNER_CHART` überschreibt bisher NUR `fusion` — Task 8 ergänzt westliche Planeten + Säulen für deterministische Inter-Aspekte und San-He-Treffer.

---

## Workspace-Hinweis (vor Task 1)

```bash
cd /Users/benjaminpoersch/Projects/New_Bazi
git checkout main && git fetch origin && git reset --hard origin/main
git checkout -b feat/sprint-p7-synastrie-completion
git checkout -- docs/qa/screenshots/ 2>/dev/null || true
```

Baseline-Gates VOR Task 1 laufen lassen, Zahlen notieren (Erwartung laut Master: `npm test` ~223 passed, `npx playwright test` 15 passed, `npm run lint` + `npm run build` grün). Bei rtk-Fehlermeldung „Use \`rtk …\` instead" das Kommando exakt so erneut ausführen.

---

### Task 1: VM additiv um `ascendantLongitude` erweitern (TDD)

Ohne absolute Aszendenten-Länge kann der Asc nicht an Inter-Aspekten teilnehmen (VM-Finding 2).

**Files:** Modify `src/viewmodels/profileViewModel.ts`, `src/utils/fufireNormalizer.ts`; Test in `src/utils/fufireNormalizer.realshapes.test.ts` (bestehende Datei — Konvention dort LESEN: sie normalisiert die echten Fixtures bereits; Helper-Namen anpassen, nicht raten).

**Step 1: Failing Test** ergänzen:

```ts
it("übernimmt die echte Aszendenten-Länge aus angles.Ascendant als ascendantLongitude", () => {
  // western.json: angles.Ascendant = 190.04613317082595
  expect(vm.western.ascendantLongitude).toBeCloseTo(190.0461, 3);
});
it("setzt ascendantLongitude ehrlich auf null ohne angles/echte Cusps", () => {
  const legacy = normalize({ western: { sunSign: "Waage", planets: [], aspects: [], houses: [] } });
  expect(legacy.western.ascendantLongitude).toBeNull();
});
```

**Step 2: Run → FAIL** (`npx vitest run src/utils/fufireNormalizer.realshapes.test.ts`) — Property existiert nicht. Red-Beweis notieren.

**Step 3: Implementierung.** (a) `profileViewModel.ts`, im `western`-Block direkt unter `ascendant: string;` als PFLICHTfeld (tsc erzwingt dann jede Konstruktionsstelle):

```ts
    /**
     * Absolute ekliptikale Länge des Aszendenten in Grad [0,360) — aus
     * angles.Ascendant der echten Engine (Fallback: Cusp 1). null, wenn die
     * Quelle keine Länge liefert (Legacy-/Mock-Shape ohne angles). Konsument:
     * Inter-Aspekt-Modul der Synastrie. NIE lokal erfinden.
     */
    ascendantLongitude: number | null;
```

(b) `fufireNormalizer.ts` — bei der `ascendant`-Ableitung (~Z. 287; `angles` und `houseCusps` sind dort schon geparst) berechnen und in JEDES `western: { … }`-Objekt der Datei aufnehmen (`npm run lint` findet alle Stellen; im lokalen Fallback-Builder am Dateiende fest `null`):

```ts
  const ascendantLongitude: number | null =
    typeof angles.Ascendant === "number" && Number.isFinite(angles.Ascendant)
      ? normalize360(angles.Ascendant)
      : houseCusps ? normalize360(houseCusps[0]) : null;
```

**Step 4: Run → PASS**, dann `npm run lint && npm test` (Rest der Suite darf nicht brechen).
**Step 5: Commit** `feat: VM trägt ascendantLongitude (additiv, null = ehrlich fehlend)`

---

### Task 2: Inter-Aspekt-Engine `src/utils/interAspects.ts` (pure, TDD)

**Files:** Create `src/utils/interAspects.ts`; Test `src/utils/interAspects.test.ts`.

**Aspekt- und Orb-Tabelle (BINDEND, im Code als Kommentar dokumentieren):**

| Aspekt | Winkel | | Beteiligte Körper | max. Orb |
|---|---|---|---|---|
| Konjunktion | 0° | | Sonne ODER Mond beteiligt | 8° |
| Sextil | 60° | | alle anderen (inkl. Aszendent) | 6° |
| Quadrat | 90° | | | |
| Trigon | 120° | | | |
| Opposition | 180° | | | |

Fenster überlappen nie (Winkelabstand 30° > 2×8°) → pro Körperpaar max. EIN Aspekt. Körper: klassische 10 (Sonne, Mond, Merkur, Venus, Mars, Jupiter, Saturn, Uranus, Neptun, Pluto) + Aszendent nur mit `ascendantLongitude`. Chiron/Lilith/Mondknoten/MediumCoeli werden gefiltert.

**Step 1: Failing Tests** — `src/utils/interAspects.test.ts` (vollständig):

```ts
import { describe, it, expect } from "vitest";
import { computeInterAspects, bodyPositionsFromViewModel, SIGN_INDEX_DE } from "./interAspects";

const body = (name: string, longitude: number) => ({ name, longitude });

describe("computeInterAspects", () => {
  it("findet ein exaktes Trigon: A-Sonne 10°, B-Mond 130° → orb 0", () => {
    expect(computeInterAspects([body("Sonne", 10)], [body("Mond", 130)])).toEqual([
      { planetA: "Sonne", planetB: "Mond", type: "Trigon", orb: 0, exact_angle: 120 },
    ]);
  });
  it("erkennt alle 5 Typen bei exakten Winkeln", () => {
    const cases: Array<[number, string]> =
      [[0, "Konjunktion"], [60, "Sextil"], [90, "Quadrat"], [120, "Trigon"], [180, "Opposition"]];
    for (const [delta, type] of cases) {
      const r = computeInterAspects([body("Venus", 100)], [body("Mars", 100 + delta)]);
      expect(r).toHaveLength(1);
      expect(r[0]).toMatchObject({ type, orb: 0, exact_angle: delta });
    }
  });
  it("Orb-Tabelle: 6.5° Abweichung — ohne Lichter KEIN Aspekt, mit Sonne Sextil (8°-Orb)", () => {
    expect(computeInterAspects([body("Venus", 0)], [body("Mars", 66.5)])).toEqual([]);
    const r = computeInterAspects([body("Sonne", 0)], [body("Mars", 66.5)]);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("Sextil");
    expect(r[0].orb).toBeCloseTo(6.5, 5);
  });
  it("rechnet über die 0°-Grenze: 358° ↔ 2° ist Konjunktion mit orb 4", () => {
    const r = computeInterAspects([body("Sonne", 358)], [body("Mond", 2)]);
    expect(r[0].type).toBe("Konjunktion");
    expect(r[0].orb).toBeCloseTo(4, 5);
  });
  it("sortiert nach Orb aufsteigend (engster Aspekt zuerst)", () => {
    const r = computeInterAspects(
      [body("Sonne", 0), body("Venus", 10)],
      [body("Mars", 92), body("Jupiter", 130)],
    );
    // Venus–Jupiter 120° (orb 0) vor Sonne–Mars 92° (orb 2).
    expect(r[0]).toMatchObject({ planetA: "Venus", planetB: "Jupiter", type: "Trigon" });
    expect(r[1]).toMatchObject({ planetA: "Sonne", planetB: "Mars", type: "Quadrat" });
  });
  it("ist degradationssicher: leere/kaputte Eingaben → []", () => {
    expect(computeInterAspects([], [])).toEqual([]);
    expect(computeInterAspects([body("Sonne", NaN)], [body("Mond", 10)])).toEqual([]);
  });
});

describe("bodyPositionsFromViewModel", () => {
  const vmStub = (planets: any[], ascendantLongitude: number | null = null) =>
    ({ western: { planets, ascendantLongitude } }) as any;

  it("rekonstruiert die Länge aus deutschem Zeichen + Grad (Waage 21.3 → 201.3)", () => {
    const r = bodyPositionsFromViewModel(vmStub([{ name: "Sonne", sign: "Waage", degree: 21.3 }]));
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe("Sonne");
    expect(r[0].longitude).toBeCloseTo(201.3, 6);
  });
  it("SIGN_INDEX_DE deckt alle 12 Zeichen in WESTERN_ZODIAC-Reihenfolge ab", () => {
    expect(SIGN_INDEX_DE["Widder"]).toBe(0);
    expect(SIGN_INDEX_DE["Krebs"]).toBe(3);
    expect(SIGN_INDEX_DE["Waage"]).toBe(6);
    expect(SIGN_INDEX_DE["Fische"]).toBe(11);
    expect(Object.keys(SIGN_INDEX_DE)).toHaveLength(12);
  });
  it("filtert Nicht-Klassiker und unbekannte Zeichen ehrlich heraus", () => {
    const r = bodyPositionsFromViewModel(vmStub([
      { name: "Chiron", sign: "Waage", degree: 1 },
      { name: "Lilith", sign: "Stier", degree: 2 },
      { name: "Mondknoten", sign: "Krebs", degree: 3 },
      { name: "Mars", sign: "Unbekannt", degree: 4 },
      { name: "Venus", sign: "Stier", degree: 5 },
    ]));
    expect(r.map((b) => b.name)).toEqual(["Venus"]);
  });
  it("nimmt den Aszendenten NUR mit ascendantLongitude auf", () => {
    expect(bodyPositionsFromViewModel(vmStub([], null))).toEqual([]);
    expect(bodyPositionsFromViewModel(vmStub([], 190.05)))
      .toEqual([{ name: "Aszendent", longitude: 190.05 }]);
  });
});
```

**Step 2: Run → FAIL** (Modul existiert nicht). Red-Beweis notieren.

**Step 3: Implementierung** — `src/utils/interAspects.ts` (vollständig):

```ts
import type { ProfileViewModel } from "../viewmodels/profileViewModel";

// ---------------------------------------------------------------------------
// Inter-Aspekte (Synastrie): Winkelbeziehungen zwischen den Planeten von
// Person A und Person B. Pure Funktionen — kein I/O, keine Engine-Calls.
// Aspekte: Konjunktion 0°, Sextil 60°, Quadrat 90°, Trigon 120°, Opposition 180°.
// Orbs:    8° sobald Sonne oder Mond beteiligt, sonst 6° (auch Aszendent).
//          Fenster überlappen nie → pro Körperpaar maximal EIN Aspekt.
// Körper:  klassische 10 + Aszendent (nur mit echter Länge aus dem VM).
// Datenanker: Körperpaar, Typ, Orb, exakter Winkel — die UI zitiert genau diese.
// ---------------------------------------------------------------------------

export interface BodyPosition {
  name: string;
  /** absolute ekliptikale Länge in Grad [0, 360) */
  longitude: number;
}

export type InterAspectType = "Konjunktion" | "Sextil" | "Quadrat" | "Trigon" | "Opposition";

export interface InterAspect {
  planetA: string;
  planetB: string;
  type: InterAspectType;
  /** Abweichung vom exakten Winkel in Grad, auf 2 Nachkommastellen gerundet */
  orb: number;
  exact_angle: number;
}

const ASPECT_ANGLES: Array<{ type: InterAspectType; angle: number }> = [
  { type: "Konjunktion", angle: 0 },
  { type: "Sextil", angle: 60 },
  { type: "Quadrat", angle: 90 },
  { type: "Trigon", angle: 120 },
  { type: "Opposition", angle: 180 },
];

const LUMINARIES = new Set(["Sonne", "Mond"]);
const ORB_LUMINARY = 8;
const ORB_DEFAULT = 6;

/** Klassische 10 — deutsche VM-Namen (post-Normalizer). */
export const CLASSICAL_BODIES = new Set([
  "Sonne", "Mond", "Merkur", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptun", "Pluto",
]);

/** Deutsches Zeichen → Index, Reihenfolge wie WESTERN_ZODIAC (astrology.ts). */
export const SIGN_INDEX_DE: Record<string, number> = {
  Widder: 0, Stier: 1, Zwillinge: 2, Krebs: 3, "Löwe": 4, Jungfrau: 5,
  Waage: 6, Skorpion: 7, "Schütze": 8, Steinbock: 9, Wassermann: 10, Fische: 11,
};

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** kürzester Winkelabstand zweier Längen, Ergebnis in [0, 180] */
function separation(a: number, b: number): number {
  const raw = Math.abs(normalize360(a) - normalize360(b)) % 360;
  return raw > 180 ? 360 - raw : raw;
}

function maxOrb(nameA: string, nameB: string): number {
  return LUMINARIES.has(nameA) || LUMINARIES.has(nameB) ? ORB_LUMINARY : ORB_DEFAULT;
}

/** Kreuz-Aspekte A↔B; sortiert nach Orb aufsteigend (stabil). */
export function computeInterAspects(
  bodiesA: BodyPosition[],
  bodiesB: BodyPosition[],
): InterAspect[] {
  const result: InterAspect[] = [];
  for (const a of bodiesA ?? []) {
    if (!a || !Number.isFinite(a.longitude)) continue;
    for (const b of bodiesB ?? []) {
      if (!b || !Number.isFinite(b.longitude)) continue;
      const sep = separation(a.longitude, b.longitude);
      const limit = maxOrb(a.name, b.name);
      let best: { type: InterAspectType; angle: number; orb: number } | null = null;
      for (const { type, angle } of ASPECT_ANGLES) {
        const orb = Math.abs(sep - angle);
        if (orb <= limit && (best === null || orb < best.orb)) best = { type, angle, orb };
      }
      if (best) {
        result.push({
          planetA: a.name, planetB: b.name, type: best.type,
          orb: Math.round(best.orb * 100) / 100, exact_angle: best.angle,
        });
      }
    }
  }
  return result.sort((x, y) => x.orb - y.orb);
}

/**
 * VM-Adapter: rekonstruiert absolute Längen aus { sign, degree } (verlustfrei:
 * degree IST degree_in_sign der Engine) und hängt den Aszendenten an, wenn das
 * VM eine echte Länge trägt (ascendantLongitude, Task 1). Klassische 10 only.
 */
export function bodyPositionsFromViewModel(vm: ProfileViewModel): BodyPosition[] {
  const out: BodyPosition[] = [];
  for (const p of vm?.western?.planets ?? []) {
    if (!CLASSICAL_BODIES.has(p.name)) continue;
    const signIndex = SIGN_INDEX_DE[p.sign];
    if (signIndex === undefined || !Number.isFinite(p.degree)) continue;
    out.push({ name: p.name, longitude: normalize360(signIndex * 30 + p.degree) });
  }
  const asc = vm?.western?.ascendantLongitude;
  if (typeof asc === "number" && Number.isFinite(asc)) {
    out.push({ name: "Aszendent", longitude: normalize360(asc) });
  }
  return out;
}
```

**Step 4: Run → PASS + `npm run lint`. Step 5: Commit**
`feat: Inter-Aspekt-Engine (5 Typen, Orbs 8°/6°, klassische 10 + Asc) als pure Funktion`

---

### Task 3: Paar-Aspekt-Texte `pairAspectInterpretation` (TDD)

Erweitert das Muster aus `src/utils/aspectInterpretation.ts` (Template × Planeten-Keyword-Tabelle `PLANET_KEYWORDS_DE`; GRAMMAR CONTRACT der Datei beachten: nur formstabile Einzel-Nomen) um eine PAAR-Variante: „A's Identität trifft auf B's Gefühlswelt"-Rahmung, positive Reibungs-/Ressourcen-Sprache.

**Files:** Modify `src/utils/aspectInterpretation.ts` + `src/utils/aspectInterpretation.test.ts`.

**Step 1: Failing Tests** (in der bestehenden Testdatei ergänzen):

```ts
import {
  pairAspectInterpretation, PLANET_KEYWORDS_DE, FORBIDDEN_PAIR_PATTERNS,
} from "./aspectInterpretation";

describe("pairAspectInterpretation", () => {
  const TYPES = ["Konjunktion", "Opposition", "Trigon", "Quadrat", "Sextil", "Quincunx", "Halbsextil"];

  it("rahmt als Begegnung zweier Personen mit (A)/(B)-Datenanker", () => {
    const s = pairAspectInterpretation("Sonne", "Mond", "Trigon");
    expect(s).toContain("Sonne (A)");
    expect(s).toContain("Mond (B)");
    expect(s).toContain("Identität");
    expect(s).toContain("Gefühlswelt");
  });
  it("liefert für alle 7 Typen × alle Keyword-Paare nie leer und nie verbotene Muster", () => {
    const planets = Object.keys(PLANET_KEYWORDS_DE);
    for (const type of TYPES) for (const p1 of planets) for (const p2 of planets) {
      const s = pairAspectInterpretation(p1, p2, type);
      expect(s.length).toBeGreaterThan(40);
      for (const pattern of FORBIDDEN_PAIR_PATTERNS) expect(s).not.toMatch(pattern);
    }
  });
  it("unbekannter Typ → generisches Template; unbekannter Planet → eigener Name als Thema", () => {
    const s = pairAspectInterpretation("Sonne", "Mars", "Biquintil");
    expect(s).toContain("Sonne (A)");
    expect(s).toContain("Mars (B)");
    expect(s.length).toBeGreaterThan(40);
    expect(pairAspectInterpretation("Ceres", "Mond", "Sextil")).toContain("Ceres");
  });
});
```

**Step 2: Run → FAIL. Step 3: Implementierung** — in `aspectInterpretation.ts` anfügen (VOLLSTÄNDIG übernehmen, Texte nicht umformulieren):

```ts
// ---------------------------------------------------------------------------
// PAAR-Variante (Synastrie, Sprint P7): Inter-Aspekt zwischen Person A und B.
// Rahmung: Begegnung zweier Themenfelder — Muster, Reibung, Ressource,
// Wachstumskante. Datenanker: beide Planeten + (A)/(B)-Marker.
// partner_match-Contract: keine Seelenverwandten-Behauptung, kein Schicksal,
// keine Trennungs-Empfehlung, keine "Ihr seid"-Festlegung (test-erzwungen).
// ---------------------------------------------------------------------------

export const FORBIDDEN_PAIR_PATTERNS: RegExp[] = [
  /\bihr seid\b/i,            // keine Festlegung des Paares
  /\bdu bist\b/i,             // keine Festlegung der Person
  /\bsie sind\b/i,
  /seelenverwandt/i,          // keine Seelenverwandten-Behauptung
  /füreinander bestimmt/i,
  /schicksal/i,               // keine Schicksals-Sprache
  /für immer/i,
  /trenn(ung|en|t)/i,         // keine Trennungs-Empfehlung
  /coaching|therapie|diagnose|heilung/i, // Master-Regel §1.4
];

const PAIR_ASPECT_TEMPLATES_DE: Record<
  string, (p1: string, p2: string, k1: string, k2: string) => string
> = {
  Konjunktion: (p1, p2, k1, k2) =>
    `${p1} (A) trifft auf ${p2} (B): ${k1} der einen und ${k2} der anderen Person bündeln sich zu einem gemeinsamen Impuls — ein Bereich, in dem beide schnell am selben Strang ziehen können.`,
  Opposition: (p1, p2, k1, k2) =>
    `${p1} (A) steht ${p2} (B) gegenüber: zwischen ${k1} hier und ${k2} dort spannt sich eine Achse — sichtbare Reibung, die als Wachstumskante beide Pole ins Gespräch bringen kann.`,
  Trigon: (p1, p2, k1, k2) =>
    `${p1} (A) trifft auf ${p2} (B): ${k1} der einen und ${k2} der anderen Person fließen unterstützend ineinander — eine Ressource, die wenig Aufwand kostet.`,
  Quadrat: (p1, p2, k1, k2) =>
    `${p1} (A) trifft auf ${p2} (B): die Reibung zwischen ${k1} hier und ${k2} dort erzeugt Spannung — als Antrieb nutzbar, wenn beide Seiten benannt werden dürfen.`,
  Sextil: (p1, p2, k1, k2) =>
    `${p1} (A) trifft auf ${p2} (B): zwischen ${k1} der einen und ${k2} der anderen Person öffnet sich eine anregende Gelegenheit, die aktives Aufgreifen belohnt.`,
  Quincunx: (p1, p2, k1, k2) =>
    `${p1} (A) trifft auf ${p2} (B): ${k1} und ${k2} stehen schräg zueinander — ein Feld, das wiederholtes, feines Nachjustieren zwischen beiden verlangt.`,
  Halbsextil: (p1, p2, k1, k2) =>
    `${p1} (A) trifft auf ${p2} (B): ${k1} und ${k2} berühren sich leise — ein Bereich, der sich schrittweise gemeinsam ertasten lässt.`,
};

const GENERIC_PAIR_TEMPLATE = (p1: string, p2: string, k1: string, k2: string) =>
  `${p1} (A) trifft auf ${p2} (B): ${k1} und ${k2} stehen in Wechselwirkung und färben das gemeinsame Feld ein.`;

/**
 * Ein deterministischer deutscher Satz für einen INTER-Aspekt (planet1 gehört
 * Person A, planet2 Person B, type ist der deutsche Aspektname).
 */
export function pairAspectInterpretation(planet1: string, planet2: string, type: string): string {
  const k1 = PLANET_KEYWORDS_DE[planet1] || planet1;
  const k2 = PLANET_KEYWORDS_DE[planet2] || planet2;
  const template = PAIR_ASPECT_TEMPLATES_DE[type] || GENERIC_PAIR_TEMPLATE;
  return template(planet1, planet2, k1, k2);
}
```

**Step 4: Run → PASS + lint. Step 5: Commit**
`feat: pairAspectInterpretation — Paar-Templates (7 Typen) mit Anti-Reifikations-Gate`

---

### Task 4: BaZi-Säulen-Vergleich `src/utils/baziCompare.ts` (pure, TDD)

**Files:** Create `src/utils/baziCompare.ts`; Test `src/utils/baziCompare.test.ts`.

**Wu-Xing-Relationsmatrix der STÄMME (BINDEND — Zeile = Element A, Spalte = Element B; Nähr-Zyklus Holz→Feuer→Erde→Metall→Wasser→Holz; Kontroll-Zyklus Holz→Erde→Wasser→Feuer→Metall→Holz):**

| A \ B | Holz | Feuer | Erde | Metall | Wasser |
|---|---|---|---|---|---|
| **Holz** | gleich | nährt | kontrolliert | wird kontrolliert | wird genährt |
| **Feuer** | wird genährt | gleich | nährt | kontrolliert | wird kontrolliert |
| **Erde** | wird kontrolliert | wird genährt | gleich | nährt | kontrolliert |
| **Metall** | kontrolliert | wird kontrolliert | wird genährt | gleich | nährt |
| **Wasser** | nährt | kontrolliert | wird kontrolliert | wird genährt | gleich |

**Tier-Zweig-Harmonien (BINDEND, deutsche Tiernamen wie im VM):**

San-He-Triaden (gleiche Trias = Treffer):

| Trias-Element | Tiere |
|---|---|
| Wasser | Affe, Ratte, Drache |
| Holz | Schwein, Hase, Ziege |
| Feuer | Tiger, Pferd, Hund |
| Metall | Schlange, Hahn, Büffel |

Liu-He-Paare: Ratte–Büffel, Tiger–Schwein, Hase–Hund, Drache–Hahn, Schlange–Affe, Pferd–Ziege.
Chong-Oppositionen: Ratte–Pferd, Büffel–Ziege, Tiger–Affe, Hase–Hahn, Drache–Hund, Schlange–Schwein.
(Die drei Mengen sind paarweise disjunkt — Prüf-Reihenfolge: gleiches Tier → `gleich`, dann Chong, dann Liu He, dann San He, sonst `neutral`.)

**Step 1: Failing Tests** — `src/utils/baziCompare.test.ts` (vollständig):

```ts
import { describe, it, expect } from "vitest";
import { compareBaziPillars, stemRelation, branchRelation } from "./baziCompare";

const pillar = (pillarKey: string, stemPinyin: string, stemElement: string, branchAnimal: string) =>
  ({ pillarKey, stemPinyin, stemElement, branchAnimal }) as any;

describe("stemRelation (Wu-Xing-Matrix)", () => {
  it("deckt alle 5 Relationstypen ab", () => {
    expect(stemRelation("Holz", "Holz").type).toBe("gleich");
    expect(stemRelation("Holz", "Feuer").type).toBe("naehrt");             // Holz nährt Feuer
    expect(stemRelation("Feuer", "Holz").type).toBe("wird_genaehrt");
    expect(stemRelation("Holz", "Erde").type).toBe("kontrolliert");        // Holz kontrolliert Erde
    expect(stemRelation("Holz", "Metall").type).toBe("wird_kontrolliert"); // Metall kontrolliert Holz
  });
  it("Wasser-Zeile stimmt mit der Matrix überein", () => {
    expect(stemRelation("Wasser", "Holz").type).toBe("naehrt");
    expect(stemRelation("Wasser", "Feuer").type).toBe("kontrolliert");
    expect(stemRelation("Wasser", "Erde").type).toBe("wird_kontrolliert");
    expect(stemRelation("Wasser", "Metall").type).toBe("wird_genaehrt");
  });
});

describe("branchRelation (Tier-Harmonien)", () => {
  it("San He: gleiche Trias (alle 4 Triaden)", () => {
    expect(branchRelation("Pferd", "Tiger").type).toBe("san_he");   // Feuer
    expect(branchRelation("Affe", "Drache").type).toBe("san_he");   // Wasser
    expect(branchRelation("Schwein", "Ziege").type).toBe("san_he"); // Holz
    expect(branchRelation("Hahn", "Büffel").type).toBe("san_he");   // Metall
  });
  it("Liu He: alle 6 Paare, beide Richtungen", () => {
    for (const [a, b] of [["Ratte", "Büffel"], ["Tiger", "Schwein"], ["Hase", "Hund"],
                          ["Drache", "Hahn"], ["Schlange", "Affe"], ["Pferd", "Ziege"]]) {
      expect(branchRelation(a, b).type).toBe("liu_he");
      expect(branchRelation(b, a).type).toBe("liu_he");
    }
  });
  it("Chong: alle 6 Oppositionen", () => {
    for (const [a, b] of [["Ratte", "Pferd"], ["Büffel", "Ziege"], ["Tiger", "Affe"],
                          ["Hase", "Hahn"], ["Drache", "Hund"], ["Schlange", "Schwein"]]) {
      expect(branchRelation(a, b).type).toBe("chong");
    }
  });
  it("gleiches Tier → gleich; keine Figur → neutral", () => {
    expect(branchRelation("Pferd", "Pferd").type).toBe("gleich");
    expect(branchRelation("Pferd", "Schwein").type).toBe("neutral");
  });
});

describe("compareBaziPillars", () => {
  const A = [
    pillar("Jahr", "Bǐng", "Feuer", "Pferd"),
    pillar("Monat", "Wù", "Erde", "Hund"),
    pillar("Tag", "Jiǎ", "Holz", "Ratte"),
    pillar("Stunde", "Gēng", "Metall", "Pferd"),
  ];
  const B = [
    pillar("Jahr", "Jiǎ", "Holz", "Tiger"),
    pillar("Monat", "Rén", "Wasser", "Hase"),
    pillar("Tag", "Gēng", "Metall", "Pferd"),
    pillar("Stunde", "Xīn", "Metall", "Schwein"),
  ];

  it("vergleicht alle 4 Säulen mit korrekten Relationen", () => {
    const r = compareBaziPillars(A, B);
    expect(r).toHaveLength(4);
    expect(r[0]).toMatchObject({
      pillarKey: "Jahr",
      stemRelation: { type: "wird_genaehrt" },  // Holz (B) nährt Feuer (A)
      branchRelation: { type: "san_he" },        // Pferd + Tiger, Feuer-Trias
    });
    expect(r[1].stemRelation.type).toBe("kontrolliert");      // Erde kontrolliert Wasser
    expect(r[1].branchRelation.type).toBe("liu_he");          // Hund + Hase
    expect(r[2].stemRelation.type).toBe("wird_kontrolliert"); // Metall kontrolliert Holz
    expect(r[2].branchRelation.type).toBe("chong");           // Ratte ↔ Pferd
    expect(r[3].stemRelation.type).toBe("gleich");            // Metall = Metall
    expect(r[3].branchRelation.type).toBe("neutral");         // Pferd + Schwein
  });
  it("trägt Datenanker beider Seiten in jedem Eintrag", () => {
    const r = compareBaziPillars(A, B);
    expect(r[0].a).toEqual({ stem: "Bǐng", stemElement: "Feuer", animal: "Pferd" });
    expect(r[0].b).toEqual({ stem: "Jiǎ", stemElement: "Holz", animal: "Tiger" });
    expect(r[0].branchRelation.text).toContain("Pferd");
    expect(r[0].branchRelation.text).toContain("Tiger");
    expect(r[0].branchRelation.text).toContain("San He");
    expect(r[0].stemRelation.text).toContain("Feuer");
    expect(r[0].stemRelation.text).toContain("Holz");
  });
  it("überspringt unaufgelöste Säulen ehrlich ('Unbekannt')", () => {
    const broken = [pillar("Jahr", "Unbekannt", "Erde", "Unbekannt")];
    expect(compareBaziPillars(broken, [pillar("Jahr", "Jiǎ", "Holz", "Tiger")])).toEqual([]);
    expect(compareBaziPillars([], [])).toEqual([]);
  });
});
```

**Step 2: Run → FAIL. Step 3: Implementierung** — `src/utils/baziCompare.ts` (vollständig):

```ts
// ---------------------------------------------------------------------------
// BaZi-Säulen-Gegenüberstellung (Synastrie, Sprint P7). Pure Funktionen über
// VM-Säulen (flache deutsche Felder, profileViewModel.ts):
//   Stämme → Wu-Xing-Relation (Sheng/Ke-Zyklus, 5 Typen)
//   Zweige → Tier-Harmonien (San He / Liu He / Chong / gleich / neutral)
// Jeder Text trägt die konkreten Stämme/Elemente/Tiere als Datenanker.
// Reibung (Kontrolle, Chong) ist Wachstumskante, nie Urteil (partner_match).
// ---------------------------------------------------------------------------

export type StemRelationType =
  | "gleich" | "naehrt" | "wird_genaehrt" | "kontrolliert" | "wird_kontrolliert";
export type BranchRelationType = "gleich" | "san_he" | "liu_he" | "chong" | "neutral";

export interface PillarInput {
  pillarKey: string;        // "Jahr" | "Monat" | "Tag" | "Stunde"
  stemPinyin: string;       // "Unbekannt" = unaufgelöst → Säule überspringen
  stemElement: string;      // ElementType (deutsch)
  branchAnimal: string;     // deutsches Tier; "Unbekannt" = unaufgelöst
}

export interface PillarComparison {
  pillarKey: string;
  a: { stem: string; stemElement: string; animal: string };
  b: { stem: string; stemElement: string; animal: string };
  stemRelation: { type: StemRelationType; text: string };
  branchRelation: { type: BranchRelationType; text: string };
}

// Nähr-Zyklus (Sheng): Holz→Feuer→Erde→Metall→Wasser→Holz
const GENERATES: Record<string, string> = {
  Holz: "Feuer", Feuer: "Erde", Erde: "Metall", Metall: "Wasser", Wasser: "Holz",
};
// Kontroll-Zyklus (Ke): Holz→Erde, Erde→Wasser, Wasser→Feuer, Feuer→Metall, Metall→Holz
const CONTROLS: Record<string, string> = {
  Holz: "Erde", Erde: "Wasser", Wasser: "Feuer", Feuer: "Metall", Metall: "Holz",
};
const ELEMENTS = new Set(Object.keys(GENERATES));

/** San-He-Triaden: Tier → Trias-Element. */
const SAN_HE_TRIAD: Record<string, string> = {
  Affe: "Wasser", Ratte: "Wasser", Drache: "Wasser",
  Schwein: "Holz", Hase: "Holz", Ziege: "Holz",
  Tiger: "Feuer", Pferd: "Feuer", Hund: "Feuer",
  Schlange: "Metall", Hahn: "Metall", "Büffel": "Metall",
};

const pairKey = (a: string, b: string) => [a, b].sort().join("|");
const LIU_HE = new Set([
  ["Ratte", "Büffel"], ["Tiger", "Schwein"], ["Hase", "Hund"],
  ["Drache", "Hahn"], ["Schlange", "Affe"], ["Pferd", "Ziege"],
].map(([a, b]) => pairKey(a, b)));
const CHONG = new Set([
  ["Ratte", "Pferd"], ["Büffel", "Ziege"], ["Tiger", "Affe"],
  ["Hase", "Hahn"], ["Drache", "Hund"], ["Schlange", "Schwein"],
].map(([a, b]) => pairKey(a, b)));

/** Wu-Xing-Relation des A-Stamm-Elements zum B-Stamm-Element (Matrix im Plan). */
export function stemRelation(elementA: string, elementB: string): { type: StemRelationType } {
  if (elementA === elementB) return { type: "gleich" };
  if (GENERATES[elementA] === elementB) return { type: "naehrt" };
  if (GENERATES[elementB] === elementA) return { type: "wird_genaehrt" };
  if (CONTROLS[elementA] === elementB) return { type: "kontrolliert" };
  return { type: "wird_kontrolliert" };
}

/** Tier-Harmonie-Figur. Prüf-Reihenfolge: gleich → Chong → Liu He → San He → neutral. */
export function branchRelation(animalA: string, animalB: string): { type: BranchRelationType } {
  if (animalA === animalB) return { type: "gleich" };
  const key = pairKey(animalA, animalB);
  if (CHONG.has(key)) return { type: "chong" };
  if (LIU_HE.has(key)) return { type: "liu_he" };
  if (SAN_HE_TRIAD[animalA] && SAN_HE_TRIAD[animalA] === SAN_HE_TRIAD[animalB]) return { type: "san_he" };
  return { type: "neutral" };
}

const STEM_TEXT: Record<StemRelationType, (a: PillarInput, b: PillarInput) => string> = {
  gleich: (a, b) => `${a.stemPinyin} und ${b.stemPinyin} tragen dasselbe Element (${a.stemElement}): vertrauter Grundton auf dieser Säule.`,
  naehrt: (a, b) => `${a.stemElement} (${a.stemPinyin}, A) nährt ${b.stemElement} (${b.stemPinyin}, B): Auf dieser Säule fließt Unterstützung von A nach B.`,
  wird_genaehrt: (a, b) => `${b.stemElement} (${b.stemPinyin}, B) nährt ${a.stemElement} (${a.stemPinyin}, A): Auf dieser Säule fließt Unterstützung von B nach A.`,
  kontrolliert: (a, b) => `${a.stemElement} (${a.stemPinyin}, A) kontrolliert ${b.stemElement} (${b.stemPinyin}, B): strukturierende Reibung — als Klärungsimpuls nutzbar.`,
  wird_kontrolliert: (a, b) => `${a.stemElement} (${a.stemPinyin}, A) wird von ${b.stemElement} (${b.stemPinyin}, B) kontrolliert: strukturierende Reibung — als Klärungsimpuls nutzbar.`,
};

const BRANCH_TEXT: Record<BranchRelationType, (a: PillarInput, b: PillarInput) => string> = {
  gleich: (a) => `Beide Säulen tragen das Tier ${a.branchAnimal}: doppelte Betonung desselben Qualitätsraums.`,
  san_he: (a, b) => `${a.branchAnimal} und ${b.branchAnimal} gehören zur selben Dreier-Harmonie (San He, ${SAN_HE_TRIAD[a.branchAnimal]}-Trias): leicht verfügbare gemeinsame Ressource.`,
  liu_he: (a, b) => `${a.branchAnimal} und ${b.branchAnimal} bilden eine Sechser-Harmonie (Liu He): stilles Zusammenspiel auf dieser Säule.`,
  chong: (a, b) => `${a.branchAnimal} und ${b.branchAnimal} stehen in Opposition (Chong): sichtbare Reibung — eine Wachstumskante, kein Urteil.`,
  neutral: (a, b) => `${a.branchAnimal} und ${b.branchAnimal} bilden keine klassische Harmonie- oder Oppositionsfigur: neutrales Feld.`,
};

function usable(p: PillarInput | undefined): p is PillarInput {
  return Boolean(
    p && ELEMENTS.has(p.stemElement) &&
    p.stemPinyin && p.stemPinyin !== "Unbekannt" &&
    p.branchAnimal && p.branchAnimal !== "Unbekannt" && SAN_HE_TRIAD[p.branchAnimal],
  );
}

/** Säulen-Vergleich nach pillarKey; unaufgelöste Säulen werden ehrlich übersprungen. */
export function compareBaziPillars(
  pillarsA: PillarInput[],
  pillarsB: PillarInput[],
): PillarComparison[] {
  if (!Array.isArray(pillarsA) || !Array.isArray(pillarsB)) return [];
  const byKeyB = new Map(pillarsB.map((p) => [p?.pillarKey, p]));
  const result: PillarComparison[] = [];
  for (const a of pillarsA) {
    const b = byKeyB.get(a?.pillarKey);
    if (!usable(a) || !usable(b)) continue;
    const sRel = stemRelation(a.stemElement, b.stemElement).type;
    const bRel = branchRelation(a.branchAnimal, b.branchAnimal).type;
    result.push({
      pillarKey: a.pillarKey,
      a: { stem: a.stemPinyin, stemElement: a.stemElement, animal: a.branchAnimal },
      b: { stem: b.stemPinyin, stemElement: b.stemElement, animal: b.branchAnimal },
      stemRelation: { type: sRel, text: STEM_TEXT[sRel](a, b) },
      branchRelation: { type: bRel, text: BRANCH_TEXT[bRel](a, b) },
    });
  }
  return result;
}
```

**Step 4: Run → PASS + lint. Step 5: Commit**
`feat: BaZi-Säulen-Vergleich (Sheng/Ke-Matrix + San He/Liu He/Chong) als pure Funktion`

---

### Task 5: Paar-Polachsen `derivePairAxes` + Achsen-Texte (TDD)

Annex §5 des Spannungsnavigator-Plans (BINDEND): Je Achse werden die NATAL-Leans beider Personen verglichen — entgegengesetzt = „Reibung sichtbar" (Wachstumskante), gleich = „Harmonie spürbar" (Ressource), BEIDES positiv. Lean einer Person je Achse = Vorzeichen ihrer eigenen West-vs-BaZi-Differenz des Achsen-Elements (`fusion.elementalComparison`; Konvention wie `deriveTension`: `difference >= 0 → "a"`).

**Files:** Modify `src/utils/tensionPair.ts` (+ Test ergänzen in `tensionPair.test.ts`); Create `src/content/pairAxisTexts.ts` (+ Test `src/content/pairAxisTexts.test.ts`).

**Step 1: Failing Tests.** In `tensionPair.test.ts`:

```ts
import { derivePairAxes } from "./tensionPair";

describe("derivePairAxes", () => {
  const comp = (diffs: Record<string, number>) =>
    Object.entries(diffs).map(([element, difference]) => ({ element, difference }));

  it("vergleicht die Natal-Leans je Achse (gleich → harmonie, entgegengesetzt → reibung)", () => {
    const a = comp({ Holz: 0.2, Feuer: -0.1, Erde: -0.1, Metall: -0.3, Wasser: 0.1 });
    const b = comp({ Holz: 0.1, Feuer: -0.05, Erde: -0.08, Metall: 0.02, Wasser: 0.04 });
    const axes = derivePairAxes(a, b);
    expect(axes).toHaveLength(5);
    // Ring-Reihenfolge (ELEMENT_AXIS_MAP.angle): Metall, Wasser, Erde, Feuer, Holz
    expect(axes[0]).toMatchObject({
      id: "structure_flow", element: "Metall", leanA: "b", leanB: "a", mode: "reibung",
    });
    expect(axes[1]).toMatchObject({ element: "Wasser", mode: "harmonie" });
    expect(axes[4]).toMatchObject({ id: "tradition_innovation", leanA: "a", leanB: "a", mode: "harmonie" });
  });
  it("liefert [] bei fehlenden Daten (kein erfundenes Feld)", () => {
    expect(derivePairAxes([], [{ element: "Holz", difference: 0.1 }])).toEqual([]);
    expect(derivePairAxes(undefined as any, undefined as any)).toEqual([]);
  });
});
```

Neu `src/content/pairAxisTexts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PAIR_AXIS_TEXTS } from "./pairAxisTexts";
import { FORBIDDEN_PAIR_PATTERNS } from "../utils/aspectInterpretation";

const AXES = ["structure_flow", "inner_outer", "security_freedom", "action_being", "tradition_innovation"] as const;

describe("PAIR_AXIS_TEXTS", () => {
  it("hat 5 Achsen × {reibung, harmonie}, alle achsen-spezifisch und nicht-leer", () => {
    for (const axis of AXES) {
      expect(PAIR_AXIS_TEXTS[axis].reibung.length).toBeGreaterThan(80);
      expect(PAIR_AXIS_TEXTS[axis].harmonie.length).toBeGreaterThan(80);
    }
    const all = AXES.flatMap((a) => [PAIR_AXIS_TEXTS[a].reibung, PAIR_AXIS_TEXTS[a].harmonie]);
    expect(new Set(all).size).toBe(10); // SPEZIFISCH, nicht generisch
  });
  it("Reibung trägt 'Wachstumskante', Harmonie trägt 'Ressource' — beide positiv", () => {
    for (const axis of AXES) {
      expect(PAIR_AXIS_TEXTS[axis].reibung).toMatch(/Wachstumskante/);
      expect(PAIR_AXIS_TEXTS[axis].harmonie).toMatch(/Ressource/);
    }
  });
  it("Anti-Reifikation: keine verbotenen Muster", () => {
    for (const axis of AXES)
      for (const text of [PAIR_AXIS_TEXTS[axis].reibung, PAIR_AXIS_TEXTS[axis].harmonie])
        for (const p of FORBIDDEN_PAIR_PATTERNS) expect(text).not.toMatch(p);
  });
});
```

**Step 2: Run → FAIL. Step 3: Implementierung.** In `tensionPair.ts` anfügen (Import um `ELEMENT_AXIS_MAP, type TensionAxis` aus `./tensionNavigator` erweitern):

```ts
/** Paar-Polachse: Natal-Lean A vs. Natal-Lean B (Annex §5 Spannungsnavigator-Plan). */
export interface PairAxisState {
  id: TensionAxis["id"];
  element: string;
  poleA: string;
  poleB: string;
  leanA: "a" | "b";
  leanB: "a" | "b";
  /** entgegengesetzt → "reibung" (Wachstumskante), gleich → "harmonie" (Ressource) */
  mode: "reibung" | "harmonie";
}

export function derivePairAxes(
  comparisonA: { element: string; difference: number }[] | undefined,
  comparisonB: { element: string; difference: number }[] | undefined,
): PairAxisState[] {
  if (!comparisonA?.length || !comparisonB?.length) return [];
  const byElB = new Map(
    comparisonB.filter((c) => c && Number.isFinite(c.difference)).map((c) => [c.element, c.difference]),
  );
  return comparisonA
    .filter((c) => c && ELEMENT_AXIS_MAP[c.element] && Number.isFinite(c.difference) && byElB.has(c.element))
    .map((c) => {
      const axis = ELEMENT_AXIS_MAP[c.element];
      const leanA: "a" | "b" = c.difference >= 0 ? "a" : "b";
      const leanB: "a" | "b" = byElB.get(c.element)! >= 0 ? "a" : "b";
      return {
        id: axis.id, element: c.element, poleA: axis.poleA, poleB: axis.poleB,
        leanA, leanB, mode: leanA === leanB ? ("harmonie" as const) : ("reibung" as const),
      };
    })
    .sort((x, y) => ELEMENT_AXIS_MAP[x.element].angle - ELEMENT_AXIS_MAP[y.element].angle);
}
```

Neu `src/content/pairAxisTexts.ts` — **alle 10 Texte VOLLSTÄNDIG übernehmen, nicht umformulieren**:

```ts
/**
 * Achsen-spezifische Paar-Texte (Sprint P7). Je Spannungsachse zwei Lesarten:
 * reibung  = entgegengesetzte Natal-Leans → Wachstumskante (positiv gerahmt)
 * harmonie = gleiche Natal-Leans → gemeinsame Ressource (positiv gerahmt)
 * Anti-Reifikation: FORBIDDEN_PAIR_PATTERNS (test-erzwungen). Datenanker
 * (Element + Leans) ergänzt die UI pro Karte separat.
 */
export const PAIR_AXIS_TEXTS: Record<
  "structure_flow" | "inner_outer" | "security_freedom" | "action_being" | "tradition_innovation",
  { reibung: string; harmonie: string }
> = {
  structure_flow: {
    reibung: "Im Feld Struktur ↔ Fluss neigen die beiden Modelle zu entgegengesetzten Polen: Eine Seite gibt Form, die andere bringt Bewegung ein. Reibung sichtbar — als Wachstumskante können Ordnung und Fluss einander abwechselnd tragen, statt sich auszubremsen.",
    harmonie: "Im Feld Struktur ↔ Fluss neigen beide Modelle zum selben Pol: ein gemeinsamer Takt im Umgang mit Ordnung und Bewegung. Harmonie spürbar — eine Ressource, solange der unbesetzte Gegenpol nicht ganz aus dem Blick gerät.",
  },
  inner_outer: {
    reibung: "Im Feld Außen ↔ Innen ziehen die Modelle in verschiedene Richtungen: Eine Neigung sucht Sichtbarkeit, die andere den Innenraum. Reibung sichtbar — eine Wachstumskante, an der Rückzug und Ausdruck einander Räume öffnen können.",
    harmonie: "Im Feld Außen ↔ Innen zeigen beide Modelle dieselbe Neigung: ein geteilter Rhythmus zwischen Zeigen und Sammeln. Harmonie spürbar — eine Ressource für gemeinsame Innen- wie Außenzeiten.",
  },
  security_freedom: {
    reibung: "Im Feld Sicherheit ↔ Freiheit setzen die Modelle gegensätzliche Akzente: Eine Neigung baut Halt, die andere sucht Weite. Reibung sichtbar — als Wachstumskante kann Halt die Weite erst möglich machen und Weite den Halt lebendig halten.",
    harmonie: "Im Feld Sicherheit ↔ Freiheit neigen beide Modelle zum selben Pol: ein ähnliches Maß an Halt und Weite. Harmonie spürbar — eine Ressource, die Absprachen über Nähe und Spielraum erleichtert.",
  },
  action_being: {
    reibung: "Im Feld Handeln ↔ Sein verteilen sich die Neigungen gegensätzlich: Eine Seite setzt in Bewegung, die andere lässt ankommen. Reibung sichtbar — eine Wachstumskante, an der Tun und Ruhen einander den Takt geben können.",
    harmonie: "Im Feld Handeln ↔ Sein zeigen beide Modelle denselben Zug: ein gemeinsames Tempo zwischen Tun und Ankommen. Harmonie spürbar — eine Ressource für geteilte Vorhaben wie für geteilte Pausen.",
  },
  tradition_innovation: {
    reibung: "Im Feld Innovation ↔ Tradition neigen die Modelle zu verschiedenen Polen: Eine Seite bewahrt Mitgebrachtes, die andere drängt zum Neuen. Reibung sichtbar — als Wachstumskante kann das Neue im Alten Wurzeln finden und das Alte im Neuen weiterleben.",
    harmonie: "Im Feld Innovation ↔ Tradition zeigen beide Modelle dieselbe Richtung: ein geteilter Umgang mit Herkunft und Erneuerung. Harmonie spürbar — eine Ressource, die gemeinsame Rituale wie gemeinsame Aufbrüche trägt.",
  },
};
```

**Step 4: Run → PASS + lint. Step 5: Commit**
`feat: Paar-Polachsen (derivePairAxes) + 10 achsen-spezifische Texte (Reibung/Harmonie)`

---

### Task 6: Server — Synastry-Response additiv erweitern (TDD)

**Files:** Modify `src/server/app.ts` (Route `POST /api/azodiac/synastry`, ~Z. 437), `src/api/bazodiacClient.ts` (`SynastryResponse`); Tests in `src/server/app.test.ts` (bestehendes Synastry-describe; Mock-Konvention: `FuFirEClient.postChart` gemockt; REAL-Shapes verwenden — Master §1.5 „NIE Payload-Shapes raten").

**Step 1: Failing Tests** ergänzen:

```ts
  it("liefert interAspects aus den realen bodies/angles beider Profile (additiv)", async () => {
    // REALE WesternResponse-Shape (vgl. src/__fixtures__/fufire/western.json).
    const chartA = { ...FULL_CHART, western: {
      bodies: { Sun: { longitude: 10.0, zodiac_sign: 0, degree_in_sign: 10.0, is_retrograde: false } },
      angles: { Ascendant: 190.0 },
    } };
    const chartB = { ...FULL_CHART, western: {
      bodies: {
        Sun: { longitude: 100.0, zodiac_sign: 3, degree_in_sign: 10.0, is_retrograde: false },
        Moon: { longitude: 130.0, zodiac_sign: 4, degree_in_sign: 10.0, is_retrograde: false },
      },
      angles: {},
    } };
    (FuFirEClient.postChart as any).mockResolvedValueOnce(chartA).mockResolvedValueOnce(chartB);
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY, partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" },
    });
    expect(res.status).toBe(200);
    // A: Sonne 10°, Asc 190° × B: Sonne 100°, Mond 130° → Sonne–Mond Trigon 0,
    // Sonne–Sonne Quadrat 0, Aszendent–Mond Sextil 0, Aszendent–Sonne Quadrat 0.
    expect(res.body.interAspects).toHaveLength(4);
    expect(res.body.interAspects).toContainEqual({
      planetA: "Sonne", planetB: "Mond", type: "Trigon", orb: 0, exact_angle: 120,
    });
    expect(res.body.interAspects.some((x: any) => x.planetA === "Aszendent")).toBe(true);
  });

  it("liefert pillarComparison aus den realen flachen BaZi-Säulen (additiv)", async () => {
    // REALE BaziResponse-Shape (vgl. bazi.json): pillars.year mit { stamm, zweig, tier, element }.
    const withYear = (stamm: string, tier: string) => ({
      ...FULL_CHART,
      bazi: { dayMaster: "Holz", pillars: { year: { stamm, zweig: "Wu", tier, element: "x" } } },
    });
    (FuFirEClient.postChart as any)
      .mockResolvedValueOnce(withYear("Bing", "Pferd"))  // Bǐng → Feuer
      .mockResolvedValueOnce(withYear("Jia", "Tiger"));  // Jiǎ → Holz
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY, partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" },
    });
    // Nur die Jahressäule ist beidseitig aufgelöst → genau 1 Vergleich.
    expect(res.body.pillarComparison).toHaveLength(1);
    expect(res.body.pillarComparison[0]).toMatchObject({
      pillarKey: "Jahr",
      stemRelation: { type: "wird_genaehrt" }, // Holz (B) nährt Feuer (A)
      branchRelation: { type: "san_he" },      // Pferd + Tiger (Feuer-Trias)
    });
    expect(res.body.pillarComparison[0].branchRelation.text).toContain("San He");
  });

  it("liefert comparisonA/comparisonB (Natal-Elementdifferenzen) für die Paar-Polachsen", async () => {
    const withFusion = (diff: number) => ({ ...FULL_CHART, fusion: {
      harmony_index: { harmony_index: 0.9 },
      elemental_comparison: { Metall: { western: 0.5, bazi: 0.5 - diff, difference: diff } },
    } });
    (FuFirEClient.postChart as any)
      .mockResolvedValueOnce(withFusion(0.2)).mockResolvedValueOnce(withFusion(-0.1));
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY, partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" },
    });
    expect(res.body.comparisonA).toHaveLength(1);
    expect(res.body.comparisonA[0]).toMatchObject({ element: "Metall", difference: 0.2 });
    expect(res.body.comparisonB[0]).toMatchObject({ element: "Metall", difference: -0.1 });
  });

  it("bleibt ehrlich leer ohne Daten: interAspects/pillarComparison/comparisonA/B = []", async () => {
    (FuFirEClient.postChart as any).mockResolvedValue(FULL_CHART); // leere planets/pillars
    const res = await request(app).post("/api/azodiac/synastry").send({
      userBirthData: VALID_BODY, partnerBirthData: { ...VALID_BODY, name: "Karl Jaspers" },
    });
    expect(res.body.interAspects).toEqual([]);
    expect(res.body.pillarComparison).toEqual([]);
    expect(res.body.comparisonA).toEqual([]);
    expect(res.body.comparisonB).toEqual([]);
  });
```

**Step 2: Run → FAIL** (`npx vitest run src/server/app.test.ts`).

**Step 3: Implementierung.** In `app.ts` importieren und im `res.json({ ... })` der Synastry-Route additiv ergänzen (NICHTS Bestehendes entfernen):

```ts
import { computeInterAspects, bodyPositionsFromViewModel } from "../utils/interAspects";
import { compareBaziPillars } from "../utils/baziCompare";
```

```ts
        // Additiv (Sprint P7): Inter-Aspekte, Säulen-Vergleich und die Natal-
        // Elementdifferenzen beider Personen — alles aus den zwei bereits
        // aufgelösten Profilen, kein zusätzlicher Engine-Call. Leere Arrays =
        // ehrlich fehlende Daten, nie erfundene Werte.
        interAspects: computeInterAspects(
          bodyPositionsFromViewModel(a.viewModel),
          bodyPositionsFromViewModel(b.viewModel)
        ),
        pillarComparison: compareBaziPillars(a.viewModel.bazi.pillars, b.viewModel.bazi.pillars),
        comparisonA: a.viewModel.fusion.elementalComparison,
        comparisonB: b.viewModel.fusion.elementalComparison
```

In `bazodiacClient.ts` das `SynastryResponse`-Interface additiv erweitern:

```ts
import type { InterAspect } from "../utils/interAspects";
import type { PillarComparison } from "../utils/baziCompare";

  /** Inter-Aspekte A↔B (Sprint P7); [] wenn Planetenstände fehlen. */
  interAspects: InterAspect[];
  /** Säulen-Gegenüberstellung (Sprint P7); [] wenn BaZi-Säulen unaufgelöst. */
  pillarComparison: PillarComparison[];
  /** Natal-Elementdifferenzen (west−bazi) je Person für die Paar-Polachsen; [] wenn fehlend. */
  comparisonA: { element: string; western: number; bazi: number; difference: number }[];
  comparisonB: { element: string; western: number; bazi: number; difference: number }[];
```

**Step 4: Run → PASS + `npm run lint && npm test` (ganze Suite). Step 5: Commit**
`feat: Synastry-Response additiv — interAspects, pillarComparison, comparisonA/B`

---

### Task 7: UI — `Synastry.tsx` Sektionen

**Files:** Modify `src/components/Synastry.tsx`. Kein Component-Test-Setup im Repo — Logik liegt komplett in Tasks 2–6, die UI wird durch e2e (Task 8) bewiesen. Tailwind-Klassen-Konventionen der Datei übernehmen (`glass-card p-6 rounded-2xl`, `font-mono text-[9px] uppercase`-Kicker etc.). **WARNUNG (Master §1.5):** keine framer-motion-Transforms auf SVG-Elementen.

**Sektions-Reihenfolge (BINDEND):** 1. Gesamt-Einordnung (bestehender Score-Block, ehrlich umgelabelt) → 2. Paar-Spannungsachsen (bestehender `<TensionNavigator pairMode …>` + NEU darunter Achsen-Karten) → 3. NEU Aspekt-Liste (Top 8 nach Orb) → 4. NEU Säulen-Gegenüberstellung → 5. NEU Element-Spiegel. Alle neuen Sektionen nur bei `synastryResult && !calculating`.

**Step 1: Umbau (präzise Skizze — Struktur, testids und TEXTE exakt übernehmen, Styling an die Datei anpassen):**

a) **Relabel** (~Z. 240): Kicker `Harmonie-Resonanz` → `Heuristischer Gesamteindruck`; Label unter dem Kreis `Resonanz` → `Heuristik`; darunter ehrliche Notiz:

```tsx
<p className="text-[10px] text-stone-500 leading-relaxed mt-1">
  Heuristik aus Tagesmeister-Relation und Sonnen-Element — ein grober Gesamteindruck,
  kein Messwert und keine Eigenschaft der Beziehung.
</p>
```

b) **Imports + abgeleitete Daten** (in der Komponente):

```tsx
import { pairAspectInterpretation } from "../utils/aspectInterpretation";
import { derivePairAxes } from "../utils/tensionPair";
import { PAIR_AXIS_TEXTS } from "../content/pairAxisTexts";

const interAspects = synastryResult?.interAspects ?? [];
const pillarComparison = synastryResult?.pillarComparison ?? [];
const pairAxes = synastryResult
  ? derivePairAxes(synastryResult.comparisonA, synastryResult.comparisonB) : [];
const fmtOrb = (orb: number) => `Orb ${orb.toFixed(1).replace(".", ",")}°`;
```

c) **Achsen-Karten** direkt unter dem `<TensionNavigator pairMode …>`-Block:

```tsx
{pairAxes.length > 0 && (
  <section data-testid="synastry-axes" className="glass-card p-6 rounded-2xl space-y-3">
    <h4>Paar-Polachsen</h4>
    {pairAxes.map((axis) => (
      <div key={axis.id} data-testid="pair-axis-card" className="p-4 rounded-xl border …">
        <div className="flex items-center justify-between">
          <span>{axis.poleA} ↔ {axis.poleB}</span>
          <span /* Badge, NEUTRAL gestylt — Reibung/Harmonie nie gut/schlecht-Farben */>
            {axis.mode === "reibung" ? "Reibung sichtbar" : "Harmonie spürbar"}
          </span>
        </div>
        <p>{PAIR_AXIS_TEXTS[axis.id][axis.mode]}</p>
        <p /* font-mono klein */>
          Anker: {axis.element}-Differenz — A neigt zu {axis.leanA === "a" ? axis.poleA : axis.poleB},
          B zu {axis.leanB === "a" ? axis.poleA : axis.poleB}. Modellergebnis, keine Eigenschaft.
        </p>
      </div>
    ))}
  </section>
)}
```

d) **Aspekt-Liste** (Top 8 — Response ist bereits nach Orb sortiert; Typ-Badge neutral gestylt):

```tsx
<section data-testid="synastry-aspects" className="glass-card p-6 rounded-2xl space-y-3">
  <h4>Inter-Aspekte ({synastryResult.userRef.name} ↔ {synastryResult.partnerRef.name})</h4>
  {interAspects.length === 0 ? (
    <p data-testid="synastry-aspects-empty">
      Keine Inter-Aspekte innerhalb der Orbs (8° Sonne/Mond, 6° sonst) — die Planetenstände
      beider Profile bilden derzeit keine engen Winkel, oder das Profil liefert keine
      Planetenstände.
    </p>
  ) : interAspects.slice(0, 8).map((a, i) => (
    <div key={`${a.planetA}-${a.planetB}-${i}`} data-testid="inter-aspect-row" className="p-3 …">
      <div className="flex items-center gap-2 font-mono text-[10px]">
        <span /* Badge */>{a.type}</span>
        <span>{a.planetA} (A) ↔ {a.planetB} (B)</span>
        <span className="ml-auto">{fmtOrb(a.orb)} · exakt {a.exact_angle}°</span>
      </div>
      <p>{pairAspectInterpretation(a.planetA, a.planetB, a.type)}</p>
    </div>
  ))}
</section>
```

e) **Säulen-Gegenüberstellung** (Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):

```tsx
<section data-testid="synastry-pillars" className="glass-card p-6 rounded-2xl space-y-3">
  <h4>Säulen-Gegenüberstellung (BaZi)</h4>
  {pillarComparison.length === 0 ? (
    <p data-testid="synastry-pillars-empty">
      Säulen-Vergleich nicht verfügbar — mindestens ein Profil liefert keine aufgelösten
      BaZi-Säulen.
    </p>
  ) : pillarComparison.map((p) => (
    <div key={p.pillarKey} data-testid="pillar-compare-card" className="p-3 …">
      <span /* Kicker */>{p.pillarKey}-Säule</span>
      <div className="font-mono text-xs">A: {p.a.stem} / {p.a.animal}<br />B: {p.b.stem} / {p.b.animal}</div>
      <span /* Badge */>
        {{ gleich: "Gleich", san_he: "San He", liu_he: "Liu He", chong: "Chong", neutral: "Neutral" }[p.branchRelation.type]}
      </span>
      <p>{p.stemRelation.text}</p>
      <p>{p.branchRelation.text}</p>
    </div>
  ))}
</section>
```

f) **Element-Spiegel** (nur wenn `elementalA.length > 0 && elementalB.length > 0`; Breite relativ zum Maximum BEIDER Personen; Gold = A, Blau = B — Farben sind Personen-Marker, nie Wertung):

```tsx
<section data-testid="synastry-elements" className="glass-card p-6 rounded-2xl space-y-3">
  <h4>Element-Spiegel</h4>
  {(() => {
    const byB = new Map(synastryResult.elementalB.map((w) => [w.element, w.weight]));
    const rows = synastryResult.elementalA
      .filter((w) => byB.has(w.element))
      .map((w) => ({ element: w.element, wA: w.weight, wB: byB.get(w.element)! }));
    const max = Math.max(...rows.flatMap((r) => [r.wA, r.wB]), 0.0001);
    return rows.map((r) => (
      <div key={r.element} data-testid="element-mirror-row" className="flex items-center gap-2 text-[10px] font-mono">
        <span className="w-12 text-right text-stone-400">{r.wA.toFixed(2)}</span>
        <div className="flex-1 flex justify-end">
          <div className="h-2 rounded-l bg-[#D4AF37]" style={{ width: `${(r.wA / max) * 100}%` }} />
        </div>
        <span className="w-16 text-center text-slate-200">{r.element}</span>
        <div className="flex-1">
          <div className="h-2 rounded-r bg-sky-400" style={{ width: `${(r.wB / max) * 100}%` }} />
        </div>
        <span className="w-12 text-stone-400">{r.wB.toFixed(2)}</span>
      </div>
    ));
  })()}
  <p /* font-mono klein */>
    Gold = {synastryResult.userRef.name}, Blau = {synastryResult.partnerRef.name} —
    fusionierte Element-Gewichte (Mittel aus West- und BaZi-Anteil) je Person.
  </p>
</section>
```

**Step 2:** `npm run lint && npm test && npm run build` grün; `npm run dev` + Synastrie-Tab manuell gegen den e2e-Mock prüfen (Mock-Start-Konvention in `playwright.config` LESEN).
**Step 3: Commit** `feat: Synastrie-UI — ehrliches Score-Label, Achsen-Karten, Aspekt-Liste, Säulen-Vergleich, Element-Spiegel`

---

### Task 8: e2e — Mock erweitern + Spec + Screenshots

**Files:** Modify `tests/e2e/mock-fufire.mjs`; Create `tests/e2e/synastry-completion.spec.ts`.

**Step 1: Mock erweitern.** In `CHART.western` additiv (konsistent mit `ascendant: "Krebs"`):

```js
    angles: { Ascendant: 102.0 },  // Krebs 12° — macht den Asc inter-aspekt-fähig
```

`PARTNER_CHART` zusätzlich zu `fusion` um eigene `western`/`bazi`-Overrides erweitern (EXAKT diese Werte — auf deterministische Treffer durchgerechnet; der bestehende `fusion`-Block bleibt UNVERÄNDERT, sonst bricht der bestehende Paar-Modus-e2e):

```js
const PARTNER_CHART = {
  ...CHART,
  western: {
    sunSign: "Krebs", moonSign: "Wassermann", ascendant: "Skorpion",
    angles: { Ascendant: 222.1 }, // Skorpion 12.1°
    planets: [
      { name: "Sonne", sign: "Krebs", house: 9, degree: 8.7, element: "Wasser", retrograde: false },    // 98.7°
      { name: "Mond", sign: "Wassermann", house: 4, degree: 21.3, element: "Luft", retrograde: false }, // 321.3°
      { name: "Merkur", sign: "Steinbock", house: 3, degree: 2.1, element: "Erde", retrograde: false }, // 272.1°
    ],
    aspects: [],
    houses: [{ number: 1, sign: "Skorpion", degree: 12.1, title: "Identität, Vitalität & Selbstbild" }]
  },
  bazi: {
    dayMaster: "Metall", dayMasterName: "Gēng", dayMasterChinese: "庚", dayMasterPolarity: "Yang",
    pillars: {
      Jahr:   { stem: { name: "Jiǎ", chinese: "甲", element: "Holz", yinYang: "Yang" },   branch: { name: "Yín", chinese: "寅", element: "Holz", animal: "Tiger", hiddenStems: [], yinYang: "Yang" } },
      Monat:  { stem: { name: "Rén", chinese: "壬", element: "Wasser", yinYang: "Yang" }, branch: { name: "Mǎo", chinese: "卯", element: "Holz", animal: "Hase", hiddenStems: [], yinYang: "Yin" } },
      Tag:    { stem: { name: "Gēng", chinese: "庚", element: "Metall", yinYang: "Yang" }, branch: { name: "Wǔ", chinese: "午", element: "Feuer", animal: "Pferd", hiddenStems: [], yinYang: "Yang" } },
      Stunde: { stem: { name: "Xīn", chinese: "辛", element: "Metall", yinYang: "Yin" },  branch: { name: "Hài", chinese: "亥", element: "Wasser", animal: "Schwein", hiddenStems: [], yinYang: "Yin" } }
    }
  },
  fusion: { /* … bestehender PARTNER-fusion-Block UNVERÄNDERT … */ }
};
```

**Deterministisch erwartete Ergebnisse (vorgerechnet — NICHT neu rechnen/raten):**

A-Körper: Sonne 201.3° (Waage 21.3), Mond 38.7° (Stier 8.7), Merkur 212.1° (Skorpion 2.1), Aszendent 102.0°. B-Körper: Sonne 98.7°, Mond 321.3°, Merkur 272.1°, Aszendent 222.1°.

| # | Paar (A ↔ B) | Separation | Aspekt | Orb |
|---|---|---|---|---|
| 1 | Sonne ↔ Mond | 120.0° | Trigon | 0.0 |
| 2 | Mond ↔ Sonne | 60.0° | Sextil | 0.0 |
| 3 | Merkur ↔ Merkur | 60.0° | Sextil | 0.0 |
| 4 | Aszendent ↔ Aszendent | 120.1° | Trigon | 0.1 |
| 5 | Aszendent ↔ Sonne | 3.3° | Konjunktion | 3.3 |
| 6 | Mond ↔ Aszendent | 176.6° | Opposition | 3.4 |
| 7 | Mond ↔ Merkur | 126.6° | Trigon | 6.6 |
| 8 | Merkur ↔ Sonne | 113.4° | Trigon | 6.6 |

→ 8 Inter-Aspekte (≥3 ✓). Erste Zeile (stabile Sortierung, A-Reihenfolge Sonne/Mond/Merkur/Asc): **Sonne ↔ Mond, Trigon, Orb 0,0°**.

Säulen (A-Mock: Jahr Bǐng-Feuer/Pferd, Monat Wù-Erde/Hund, Tag Jiǎ-Holz/Ratte, Stunde Gēng-Metall/Pferd): Jahr → wird_genaehrt + **San He** (Pferd+Tiger ✓ ≥1), Monat → kontrolliert + Liu He (Hund+Hase), Tag → wird_kontrolliert + Chong (Ratte↔Pferd), Stunde → gleich + neutral.

Paar-Polachsen (aus den UNVERÄNDERTEN fusion-Blöcken): A-Leans (Holz a, Feuer b, Erde b, Metall b, Wasser a) vs. B-Leans (a, b, b, **a**, a) → Metall-Achse „Struktur ↔ Fluss" = **Reibung sichtbar**, die übrigen vier = Harmonie spürbar.

**Step 2: Failing Spec** — `tests/e2e/synastry-completion.spec.ts` (Helper `fillNameDateTime`/`selectBerlin`/`computeProfile` 1:1 aus `tension-navigator.spec.ts` übernehmen):

```ts
import { test, expect, Page } from "@playwright/test";

const SHOT_DIR = "docs/qa/screenshots/synastrie";

// … computeProfile-Helper aus tension-navigator.spec.ts …

async function computeSynastry(page: Page) {
  await page.click("#nav-tab-synastry");
  await page.fill("#partner-name", "Partner Persona");
  await page.fill("#partner-date", "1985-03-20"); // ≠ 1990-05-15 → PARTNER_CHART
  await page.fill("#partner-time", "09:15");
  await page.fill("#partner-place", "Ber");
  const option = page.getByRole("button", { name: /Berlin, Deutschland/ });
  await option.first().waitFor({ state: "visible" });
  await option.first().click();
  await expect(page.getByTestId("partner-place-resolved")).toBeVisible();
  await page.click("#submit-synastry-btn");
  await expect(page.getByTestId("synastry-source")).toBeVisible({ timeout: 15000 });
}

test("ehrliches Score-Label + Aspekt-Liste mit ≥3 Inter-Aspekten und Orb-Ankern", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await computeSynastry(page);
  await expect(page.getByText("Heuristischer Gesamteindruck")).toBeVisible();
  await expect(page.getByText(/kein Messwert/)).toBeVisible();
  const rows = page.getByTestId("inter-aspect-row");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThanOrEqual(3);
  // Engster Aspekt zuerst: Sonne (A) ↔ Mond (B), Trigon, Orb 0,0°.
  await expect(rows.first()).toContainText("Trigon");
  await expect(rows.first()).toContainText("Sonne (A) ↔ Mond (B)");
  await expect(rows.first()).toContainText("Orb 0,0°");
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.getByTestId("synastry-aspects").screenshot({ path: `${SHOT_DIR}/aspekt-liste.png` });
});

test("Säulen-Gegenüberstellung: 4 Säulen inkl. San-He- und Chong-Anker", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await computeSynastry(page);
  await expect(page.getByTestId("pillar-compare-card")).toHaveCount(4);
  await expect(page.getByTestId("synastry-pillars")).toContainText("San He");
  await expect(page.getByTestId("synastry-pillars")).toContainText("Chong");
  await expect(page.getByTestId("synastry-pillars")).toContainText("Pferd"); // Datenanker
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.getByTestId("synastry-pillars").screenshot({ path: `${SHOT_DIR}/saeulen-vergleich.png` });
});

test("Element-Spiegel (5 Zeilen) und Paar-Polachsen (Metall = Reibung) rendern", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await computeSynastry(page);
  await expect(page.getByTestId("element-mirror-row")).toHaveCount(5);
  const axes = page.getByTestId("pair-axis-card");
  await expect(axes).toHaveCount(5);
  const metall = axes.filter({ hasText: "Struktur ↔ Fluss" });
  await expect(metall).toContainText("Reibung sichtbar");
  await expect(metall).toContainText("Wachstumskante");
  await page.screenshot({ path: `${SHOT_DIR}/synastrie-komplett.png`, fullPage: true });
});
```

**Step 3:** Spec rot laufen lassen (vor Mock-/UI-Fertigstellung), dann grün: `npx playwright test tests/e2e/synastry-completion.spec.ts`. Danach die GESAMTE e2e-Suite (`npx playwright test`) — der bestehende Paar-Modus-Test (`tension-navigator.spec.ts`) darf durch die Mock-Erweiterung NICHT brechen. Screenshots nach Repo-Konvention committen.

**Step 4: Commit** `test: e2e Synastrie-Completion (Inter-Aspekte, San He/Chong, Element-Spiegel, Polachsen) + Screenshots`

---

### Task 9: Gates, PR, Live-Smoke

**Step 1: Volle Gates** (Zahlen vorher/nachher in den Report):

```bash
npm run lint && npm test && npm run build && npx playwright test
```

**Step 2: PR** (KEIN Merge ohne Review — Master §6):

```bash
gh pr create --repo DYAI2025/New_Bazi \
  --title "feat: Synastrie-Completion — Inter-Aspekte, Säulen-Vergleich, Element-Spiegel, Paar-Polachsen (Sprint P7)"
```

Body: Verweis auf diesen Plan + Master-Doc; TDD-Red/Green-Beweise; **ehrliche MISSING-Liste**:
- Gesamt-Score bleibt lokale Heuristik (Tagesmeister + Sonnen-Element) — ehrlich gelabelt; echte Engine-Synastrie ist ein FuFirE-Folge-Feature.
- Aszendent-Inter-Aspekte nur, wenn die Engine `angles` liefert (Legacy-Quellen → ohne Asc, ehrlich gefiltert).
- Keine Haus-Overlays (B-Planeten in A-Häusern) — Folge-Iteration.
- Paar-Polachsen-Stufe fest „spürbar" (keine Paar-Kalibrierung vorhanden).
- Keine Partner-Persistenz (kommt mit P3/Supabase).

**Step 3: Review-Runde** nach Master §6 (Spec-Treue, keine gelockerten Tests, Anti-Reifikation in ALLEN neuen Strings, Gates selbst nachgelaufen). Findings im selben PR fixen.

**Step 4: Nach Merge — Live-Smoke (DoD §3.4/3.5, Pflicht):**
1. Railway deployt `main` automatisch. Deploy-Frische via neuem Asset-Bundle-Hash auf `https://newbazi-production.up.railway.app` prüfen (View-Source → `/assets/index-*.js`).
2. Realen Pfad ausführen: Profil rechnen (z. B. 1990-06-15, 14:30, Berlin), Synastrie-Tab, Partner (z. B. 1985-03-20, 09:15, Hamburg) → prüfen: Aspekt-Liste mit echten Engine-Aspekten + Orb-Ankern, Säulen-Karten mit echten Stämmen/Tieren, Element-Spiegel, Polachsen-Karten, ehrliches Heuristik-Label.
3. Browser-Konsole: keine neuen Fehler auf dem Synastrie-Tab (Error-Listener via `Page.addScriptToEvaluateOnNewDocument`, Browser-Harness).
4. Eine Regression: Fusion-Tab (Natal-Navigator) rendert weiterhin.
5. Ergebnis (inkl. Screenshots) im PR/Report dokumentieren. Rot = sofort fixen, nicht maskieren.
