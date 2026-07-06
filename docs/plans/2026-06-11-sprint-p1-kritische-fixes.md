# Sprint P1: Kritische Fixes (B-001, B-002, B-007, B-010, A8, A13, A14)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

> **BINDEND:** Zuerst `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md` VOLLSTÄNDIG lesen.
> Dessen Arbeitsregeln (§1: Branch-Ritual, TDD ohne Ausnahme, Gates vor jedem Commit,
> Ehrlichkeits-Regeln, technische Fallen wie rtk-Hook) und §3 (DoD) gelten für jeden
> Schritt dieses Plans und werden hier nicht wiederholt.

**Goal:** Sieben verifizierte Ehrlichkeits-/UX-Defekte beheben: Coaching-Wording raus
(B-001), Kohärenz-Missing-State statt erfundener 0/75 (B-002), Pinning-Test gegen
Asc/Mond/Haus-Verwechslung (B-007), Anti-Reification-Intro im Navigator (B-010),
DST-Sackgasse → klare 400-Meldung statt 502 (A8), `viewModel.warnings` rendern (A13),
Einheits-Stärken/Schatten durch element-spezifische kuratierte Texte ersetzen (A14).

**Architecture:** Bestehendes Schichtenmodell bleibt: Normalizer
(`src/utils/fufireNormalizer.ts`) liefert ehrliche ViewModels (null statt erfundener
Zahlen), `src/utils/fufireClient.ts` mappt Upstream-Fehler typisiert (neuer Code
`invalid_birth_time_dst`, httpStatus 400), Komponenten rendern Missing-States sichtbar.
Keine neuen Endpoints, keine neuen Dependencies.

**Tech Stack:** React 19 + Vite + TS, Express-BFF, vitest (happy-dom, globals), supertest,
Playwright. Komponenten-Tests via `react-dom/client` + `act` aus `react` direkt (kein
testing-library im Projekt; `jsx: react-jsx` in tsconfig — `.test.tsx` läuft ohne Zusatzconfig).
**Branch:** `fix/sprint-p1-kritische-fixes`

---

## Workspace-Start (Pflicht)

```bash
cd /Users/benjaminpoersch/Projects/New_Bazi
git checkout main && git fetch origin && git reset --hard origin/main
git checkout -b fix/sprint-p1-kritische-fixes
git checkout -- docs/qa/screenshots/ 2>/dev/null || true
npm run lint && npm test && npm run build && npx playwright test   # Baseline notieren
```
Erwartete Baseline (2026-06-11): vitest ~223 passed, Playwright 15 passed.
**Verifizierte Code-Anker (main @ 714c483 — bei Abweichung neu lesen, nicht raten):**
- `src/utils/fufireNormalizer.ts`: Kohärenz-Fallback-Kette Z. 556–560 (endet `: 0;` Z. 560),
  Rating-Schwellen Z. 584–587, DayMaster-Defaults Z. 467–469, Fallback `coherenceIndex: 75` Z. 774.
- `src/components/WuXingDetail.tsx`: `coachingText` Z. 27/34/41/48/55/589, Label
  „Metaphysischer Ratschlag (Coaching-Vektor)" Z. 586, „… (Lifestyle Coaching)" Z. 667,
  Kommentare Z. 583/663.
- `src/components/TensionNavigator.tsx`: Haupt-Return ab Z. 256, `OriginLayer` ab Z. 579,
  Gauge nutzt `coherenceIndex` Z. 622/628.
- `src/utils/fufireClient.ts`: `mapStatusToError` Z. 120–126 (422→`invalid_fufire_payload`→502);
  der Fehler-Body wird aktuell VERWORFEN (Z. 175–179). A8-Fix sitzt HIER, nicht in app.ts.
- Fixture `src/__fixtures__/fufire/western.json`: `angles.Ascendant`=190.046° (Waage),
  Moon 345.636° / `zodiac_sign: 11` (Fische) → per Cusps **Haus 5**; `bodies` hat KEINEN
  `Ascendant`-Key; Haus 1 (Cusps 190.05–214.89°) enthält KEINEN Planeten.

---

## Task 0 — Shared Test-Render-Helper

**Files:** Create: `src/test-utils/renderComponent.tsx` — Tasks 2/4/6 brauchen denselben
Mini-Renderer (kein testing-library im Projekt):

```tsx
// src/test-utils/renderComponent.tsx
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let root: Root | null = null;
let container: HTMLElement | null = null;

/** Rendert ui in ein frisches Container-Element (happy-dom). */
export function renderComponent(ui: React.ReactElement): HTMLElement {
  cleanupComponent();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(ui));
  return container;
}

/** In afterEach aufrufen. */
export function cleanupComponent(): void {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = null;
  container = null;
}

/** Klick per data-testid, in act() gewrappt. */
export function clickTestId(c: HTMLElement, testId: string): void {
  const el = c.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
  if (!el) throw new Error(`[data-testid="${testId}"] nicht gefunden`);
  act(() => el.click());
}
```

Commit: `git add -A && git commit -m "test: Render-Helper für Komponenten-Tests (happy-dom, ohne testing-library)"`

---

## Task 1 — B-001: Coaching-Wording entfernen (WuXingDetail)

**Files:** Create: `src/components/wordingHonesty.test.ts` · Modify: `src/components/WuXingDetail.tsx`
**Step 1: Failing Test** (Datei-Scan über alle Komponenten — Produkttexte UND Kommentare):

```ts
// src/components/wordingHonesty.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Master-Roadmap §1.4: „Coaching", „Therapie", „Diagnose" sind in Produkttexten verboten.
const FORBIDDEN = /coaching|therapie|diagnose/i;

describe("Wording-Ehrlichkeit (B-001)", () => {
  const files = readdirSync(__dirname).filter((f) => f.endsWith(".tsx"));

  it("findet Komponenten-Dateien", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of readdirSync(__dirname).filter((f) => f.endsWith(".tsx"))) {
    it(`${file} enthält kein Coaching/Therapie/Diagnose-Vokabular`, () => {
      const src = readFileSync(join(__dirname, file), "utf8");
      const hit = src.match(FORBIDDEN);
      expect(hit, `Verbotenes Wort "${hit?.[0]}" in ${file}`).toBeNull();
    });
  }

  it("WuXingDetail trägt 'Alltagsimpuls' + reflectionText statt Coaching-Vektor", () => {
    const src = readFileSync(join(__dirname, "WuXingDetail.tsx"), "utf8");
    expect(src).toContain("Alltagsimpuls");
    expect(src).toContain("reflectionText");
    expect(src).not.toContain("coachingText");
  });
});
```

**Step 2: Run → FAIL:** `npx vitest run src/components/wordingHonesty.test.ts`
— `WuXingDetail.tsx` fällt mit „Coaching"-Treffern durch, Alltagsimpuls-Assert rot.

**Step 3: Implementierung** — alle Edits in `src/components/WuXingDetail.tsx`:
1. `elementDetailsText` (Z. 27/34/41/48/55): Key `coachingText:` → `reflectionText:` (5×, Textinhalte unverändert).
2. Z. 583: Kommentar `{/* Coaching details */}` → `{/* Alltagsimpuls */}`.
3. Z. 586: `Metaphysischer Ratschlag (Coaching-Vektor)` → `Alltagsimpuls`.
4. Z. 589: `{textMeta.coachingText}` → `{textMeta.reflectionText}`.
5. Z. 663: Kommentar `{/* Right Column: Coaching analysis based on ViewModel advices */}`
   → `{/* Right Column: Element-Balance-Hinweise aus dem ViewModel */}`.
6. Z. 667: `Harmonisierung nach Wu Xing (Lifestyle Coaching)` → `Harmonisierung nach Wu Xing (Alltags-Balance)`.

**Step 4: Run → PASS:** `npx vitest run src/components/wordingHonesty.test.ts && npm run lint`

**Step 5: Commit:**
`git add -A && git commit -m "fix: Coaching-Wording raus — Alltagsimpuls statt Coaching-Vektor (B-001)"`

---

## Task 2 — B-002: Kohärenz-Missing-State (`coherenceIndex: number | null`)

**Files:** Modify: `src/viewmodels/profileViewModel.ts` (Z. 42), `src/utils/fufireNormalizer.ts`
(Z. 556–560, 584–587, 774), `src/components/TensionNavigator.tsx` (Gauge Z. ~611–634),
`src/utils/fufireNormalizer.test.ts` (Z. 43), `src/utils/fufireNormalizer.realshapes.test.ts`
(Z. 284) · Create: `src/components/TensionNavigator.origin.test.tsx`

**Step 1: Failing Tests.** (a) In `fufireNormalizer.realshapes.test.ts`, describe
`"normalizer degrades per-section …"` (ab Z. 268) anfügen:

```ts
  it("liefert coherenceIndex null, wenn weder Kalibrierung noch Legacy-Wert existieren (B-002)", () => {
    // calibration-Statistik da (Signal ableitbar), aber KEIN h_calibrated, KEIN
    // harmony_index, KEIN cosmic_state, KEIN Legacy-Wert.
    const vm = normalizeFuFireProfile(
      { fusion: { calibration: { h_raw: 0.5, h_baseline: 0.25, h_sigma: 0.25 } } },
      INPUT, "fufire-orchestrated"
    );
    expect(vm.fusion.coherenceIndex).toBeNull();
    expect(vm.fusion.coherenceCalibrated).toBe(false);
    expect(vm.fusion.signalLevel).toBe("spuerbar"); // z=1.0
    // Rating darf NICHT aus null<60 „Spannungsgeladene Dynamik" erfinden:
    expect(vm.fusion.coherenceRating).toBe("Keine Kohärenz-Daten verfügbar");
  });

  it("lokaler Fallback erfindet keine 75 mehr (B-002)", async () => {
    const { getRawSimulatedProfileFromLocal } = await import("./fufireNormalizer");
    const raw = getRawSimulatedProfileFromLocal({ birthDate: "1990-06-15", birthTime: "14:30", name: "X" });
    expect(raw.fusion).not.toHaveProperty("coherenceIndex");
    const vm = normalizeFuFireProfile(raw, INPUT, "fallback-local");
    expect(vm.fusion.coherenceIndex).toBeNull();
    expect(vm.fusion.coherenceCalibrated).toBe(false);
  });
```

(b) Bestehende Tests AKTUALISIEREN (Spec-Änderung — die alte Erwartung `0` war der Bug):
- `src/utils/fufireNormalizer.test.ts` Z. 43: `…toBe(0);` → `…toBeNull();`
- `src/utils/fufireNormalizer.realshapes.test.ts` Z. 284 (Junk-Payload-Test): `…toBe(0);` → `…toBeNull();`

(c) Create `src/components/TensionNavigator.origin.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import TensionNavigator from "./TensionNavigator";
import { renderComponent, cleanupComponent, clickTestId } from "../test-utils/renderComponent";
import { normalizeFuFireProfile } from "../utils/fufireNormalizer";
import fusionFixture from "../__fixtures__/fufire/fusion.json";

const INPUT = { name: "Test", birthDate: "1990-06-15", birthTime: "14:30", birthPlaceLabel: "Berlin", gender: "Divers" };
afterEach(cleanupComponent);

describe("OriginLayer Kohärenz-Gauge (B-002)", () => {
  it("zeigt den kalibrierten Prozentwert, wenn vorhanden", () => {
    const vm = normalizeFuFireProfile({ fusion: fusionFixture }, INPUT, "fufire-orchestrated");
    const c = renderComponent(<TensionNavigator viewModel={vm} />);
    clickTestId(c, "tension-origin-toggle");
    expect(c.querySelector('[data-testid="fusion-coherence-value"]')?.textContent).toBe("61.4%");
  });

  it("rendert 'nicht verfügbar' statt 0%/null%, wenn coherenceIndex null ist", () => {
    const vm = normalizeFuFireProfile(
      { fusion: {
          calibration: { h_raw: 0.5, h_baseline: 0.25, h_sigma: 0.25 },
          elemental_comparison: (fusionFixture as any).elemental_comparison
      } },
      INPUT, "fufire-orchestrated"
    );
    expect(vm.fusion.coherenceIndex).toBeNull();
    const c = renderComponent(<TensionNavigator viewModel={vm} />);
    clickTestId(c, "tension-origin-toggle");
    const missing = c.querySelector('[data-testid="fusion-coherence-missing"]');
    expect(missing).toBeTruthy();
    expect(missing!.textContent).toContain("nicht verfügbar");
    expect(c.querySelector('[data-testid="fusion-coherence-value"]')).toBeNull();
    expect(c.textContent).not.toContain("null%");
    expect(c.textContent).not.toContain("NaN");
  });
});
```

**Step 2: Run → FAIL:**
`npx vitest run src/utils/fufireNormalizer.realshapes.test.ts src/utils/fufireNormalizer.test.ts src/components/TensionNavigator.origin.test.tsx`
— neue B-002-Tests rot (Index 0 statt null, Rating „Spannungsgeladene Dynamik",
`raw.fusion.coherenceIndex === 75`, kein `fusion-coherence-missing`); die in (b)
aktualisierten Alt-Tests ebenfalls rot. Der „61.4%"-Test ist bereits grün (Baseline).

**Step 3: Implementierung.** (a) `src/viewmodels/profileViewModel.ts` Z. 42:

```ts
  /** null = weder Kalibrierung noch Legacy-/Roh-Wert vorhanden — UI zeigt Missing-State. */
  coherenceIndex: number | null;
```

(b) `fufireNormalizer.ts` Z. 556–560 — letzte Fallback-Stufe `: 0` → `: null`:

```ts
  const coherenceIndex = hCalibrated !== null ? Math.round(hCalibrated * 100 * 10) / 10
    : typeof rawFusion.coherenceIndex === "number" ? rawFusion.coherenceIndex
    : typeof rawFusion.coherence_index === "number" ? rawFusion.coherence_index
    : realCoherence01 !== null ? Math.round((realCoherence01 <= 1 ? realCoherence01 * 100 : realCoherence01) * 10) / 10
    : null;
```

(c) `fufireNormalizer.ts` Z. 584–587 — Rating-Guard (`null < 60` wäre sonst true!):

```ts
  // Custom label rating — NIE aus einem fehlenden Wert ableiten.
  let coherenceRating = "Harmonische Ausgewogenheit";
  if (coherenceIndex === null) coherenceRating = "Keine Kohärenz-Daten verfügbar";
  else if (coherenceIndex > 80) coherenceRating = "Exzellente System-Resonanz";
  else if (coherenceIndex < 60) coherenceRating = "Spannungsgeladene Dynamik";
```

(Engine-Overrides Z. 589/594 unverändert — im null-Fall existieren beide nicht.)

(d) `fufireNormalizer.ts` Z. 773–775 (`getRawSimulatedProfileFromLocal`):

```ts
    // B-002: KEIN erfundener Kohärenzwert im lokalen Fallback. fusion bleibt als
    // leeres Objekt vorhanden (Sektion existiert), coherenceIndex wird null.
    fusion: {}
```

(e) `TensionNavigator.tsx`, OriginLayer: den Gauge-Block (Z. ~611–634, von
`<div className="relative flex items-center justify-center">` bis zum schließenden
`</div>` nach dem „Deckung"-Span) konditionalisieren:

```tsx
            {coherenceIndex === null ? (
              <div
                className="flex flex-col items-center justify-center text-center space-y-2 py-8"
                data-testid="fusion-coherence-missing"
              >
                <span className="font-serif text-xl text-stone-400">nicht verfügbar</span>
                <span className="font-mono text-[8px] uppercase text-[#9A8F80] tracking-wider max-w-[180px] leading-snug">
                  Die Engine lieferte keinen kalibrierten Kohärenzwert — es wird bewusst
                  keine Zahl erfunden.
                </span>
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                {/* … bestehender SVG-Gauge inkl. fusion-coherence-value UNVERÄNDERT … */}
              </div>
            )}
```

**Step 4: Run → PASS:**
`npx vitest run src/utils src/components && npm run lint && npm test`
Falls lint weitere `coherenceIndex`-Konsumenten meldet (`possibly null`): das sind genau
die Stellen, die einen Missing-State brauchen — wie (e) beheben, NIEMALS `?? 0`.

**Step 5: Commit:**
`git add -A && git commit -m "fix: Kohärenz-Missing-State — coherenceIndex null statt erfundener 0/75 (B-002)"`

---

## Task 3 — B-007: Pinning-Test Asc/Mond/Haus-Mapping

User-Report: Mondzeichen sei als Aszendent im Haus-1-Text gelabelt worden. Die Fixture
(Berlin 1990-06-15 14:30) hat Asc=Waage (190.05°), Mond=Fische (345.64°, Haus 5) — wir
pinnen, dass der Normalizer diese nie kreuzt.
**Files:** Modify: `src/utils/fufireNormalizer.realshapes.test.ts` (neuer Block ans Dateiende)
**Step 1: Test schreiben:**

```ts
describe("B-007 Pinning: Aszendent/Mond/Haus-Texte kreuzen sich nie", () => {
  const vm = () => normalizeFuFireProfile({ western: westernFixture }, INPUT, "fufire-orchestrated");

  it("Aszendent (190.05° → Waage) und Mond (345.64° → Fische) sind getrennt und korrekt", () => {
    const v = vm();
    expect(v.western.ascendant).toBe("Waage");
    expect(v.western.moonSign).toBe("Fische");
    expect(v.western.ascendant).not.toBe(v.western.moonSign);
  });

  it("der Mond steht per Server-Cusps in Haus 5 — NIE pauschal in Haus 1", () => {
    const moon = vm().western.planets.find((p) => p.name === "Mond")!;
    expect(moon.sign).toBe("Fische");
    expect(moon.house).toBe(5); // Cusp 5 = 318.91°, Cusp 6 = 347.70°, Mond 345.64°
  });

  it("Haus-1-Text referenziert den Aszendenten und listet KEINEN Mond (Fixture: Haus 1 leer)", () => {
    const h1 = vm().western.houses.find((h) => h.number === 1)!;
    expect(h1.description).toContain("Aszendent");
    expect(h1.signResonance).toContain("Waage");
    expect(h1.signResonance).not.toContain("Fische");
    expect(h1.planets).toEqual([]); // kein Body zwischen Cusp 190.05° und 214.89°
  });

  it("Haus 5 listet den Mond mit seinem ECHTEN Zeichen Fische — und keinen Kreuz-Label-Aszendenten", () => {
    const v = vm();
    const h5 = v.western.houses.find((h) => h.number === 5)!;
    const moonEntry = h5.planets.find((p) => p.name === "Mond")!;
    expect(moonEntry).toBeDefined();
    expect(moonEntry.sign).toBe("Fische");
    expect(h5.description).toContain("Mond (Fische)");
    expect(h5.description).not.toContain("Aszendent");
    // Falls die Engine je einen Ascendant-Body liefert: nie mit Mond-Zeichen labeln.
    const asc = v.western.planets.find((p) => p.name === "Aszendent");
    if (asc) expect(asc.sign).toBe(v.western.ascendant);
  });
});
```

**Step 2: Run:** `npx vitest run src/utils/fufireNormalizer.realshapes.test.ts`

**Erwartetes Ergebnis: PASS auf Anhieb** (Triad-Tests Z. 49–54/229–235 pinnen Waage/Fische
bereits; `houseOfLongitude` arbeitet deterministisch aus Server-Cusps). Zwei Ausgänge:
- **GRÜN:** Bug mit dieser Fixture **nicht reproduzierbar** — so im PR-Body dokumentieren
  („B-007: not reproduced with fixture; Regression-Pin ergänzt"). Report-Ursache ist dann
  vermutlich ein anderes Geburtsdatum/Hausystem — als Follow-up notieren, KEIN Blindfix.
- **ROT:** Echter Bug. Fix-Kandidaten in `fufireNormalizer.ts`, in dieser Reihenfolge:
  (1) Aszendent-Ableitung Z. 287–290 (Priorität `rawWest.ascendant` → `angles.Ascendant`
  → `houseCusps[0]`), (2) `houseOfLongitude` Z. 139–147 (Wrap-around), (3)
  `HOUSE_TEMPLATES[0].description` Z. 8 (statischer Text). Minimal fixen.

**Step 3: Commit:**
`git add -A && git commit -m "test: Pinning Asc/Mond/Haus-Mapping gegen Kreuz-Labeling (B-007)"`

---

## Task 4 — B-010: Navigator-Intro (anti-reifizierend, session-dismissible)

**Files:** Modify: `src/components/TensionNavigator.tsx`,
`src/components/TensionNavigator.origin.test.tsx` (anfügen), `tests/e2e/tension-navigator.spec.ts`
**Step 1: Failing Tests** — in `TensionNavigator.origin.test.tsx` anfügen
(`__resetIntroForTests` wird in Step 3 exportiert; zusätzlich importieren:
`import TensionNavigator, { __resetIntroForTests } from "./TensionNavigator";`):

```tsx
describe("Navigator-Intro (B-010)", () => {
  const fullVm = () => normalizeFuFireProfile({ fusion: fusionFixture }, INPUT, "fufire-orchestrated");

  it("zeigt beim ersten Render die Anti-Reification-Intro-Zeile", () => {
    __resetIntroForTests();
    const c = renderComponent(<TensionNavigator viewModel={fullVm()} />);
    const intro = c.querySelector('[data-testid="tension-intro"]');
    expect(intro).toBeTruthy();
    expect(intro!.textContent).toContain("Kein Urteil.");
    expect(intro!.textContent).toContain("du entscheidest, ob sie trägt");
    expect(intro!.textContent).not.toMatch(/%|\d/); // keine Zahlen/Prozente im Visual
  });

  it("ist dismissible und bleibt in derselben Session weg (Remount)", () => {
    __resetIntroForTests();
    const c1 = renderComponent(<TensionNavigator viewModel={fullVm()} />);
    clickTestId(c1, "tension-intro-dismiss");
    expect(c1.querySelector('[data-testid="tension-intro"]')).toBeNull();
    // Remount (Tab-Wechsel-Simulation): Intro bleibt weg — Session-Flag, KEIN localStorage.
    const c2 = renderComponent(<TensionNavigator viewModel={fullVm()} />);
    expect(c2.querySelector('[data-testid="tension-intro"]')).toBeNull();
  });
});
```

**Step 2: Run → FAIL:** `npx vitest run src/components/TensionNavigator.origin.test.tsx`
— Import `__resetIntroForTests` existiert nicht / `tension-intro` fehlt.

**Step 3: Implementierung** in `src/components/TensionNavigator.tsx`:
(a) Nach den Konstanten (nach `REACTIONS`, Z. ~110):

```tsx
// B-010: Anti-Reification-Intro — einmal pro JS-Session (Modul-Flag, bewusst KEIN
// localStorage: Konzept-Entscheid „per session"). Tab-Wechsel remountet die
// Komponente, deshalb reicht React-State allein nicht.
let introDismissedThisSession = false;
export function __resetIntroForTests(): void {
  introDismissedThisSession = false;
}
```

(b) Im Komponenten-Body (nach `const [originOpen, …]`, Z. ~160):
```tsx
  const [introVisible, setIntroVisible] = React.useState(() => !introDismissedThisSession);
  const dismissIntro = () => {
    introDismissedThisSession = true;
    setIntroVisible(false);
  };
```

(c) Im Return (Z. ~256): direkt NACH `<div className="glass-card p-4 sm:p-6 …">` und VOR
`<div className="relative">`:
```tsx
        {introVisible && (
          <div
            className="flex items-start justify-between gap-3 mb-3 px-2 py-2 rounded-lg border border-gold-muted/15 bg-obsidian-deep/40"
            data-testid="tension-intro"
          >
            <p className="text-xs text-stone-400 leading-relaxed">
              Kein Urteil. Das Modell zeigt eine prüfbare Spannungsfrage — du entscheidest,
              ob sie trägt.
            </p>
            <button
              type="button"
              onClick={dismissIntro}
              aria-label="Intro ausblenden"
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gold-muted hover:text-gold-light transition-colors duration-200"
              data-testid="tension-intro-dismiss"
            >
              Verstanden
            </button>
          </div>
        )}
```

(d) e2e in `tests/e2e/tension-navigator.spec.ts` ans Ende (bestehende Specs zählen keine
Navigator-Elemente; der „NO percent"-Test bleibt grün — Intro enthält kein `%`/keine Ziffer):

```ts
test("intro line is shown once and is dismissible (B-010)", async ({ page }) => {
  await page.goto("/");
  await computeProfile(page);
  await openNavigator(page);

  const intro = page.getByTestId("tension-intro");
  await expect(intro).toBeVisible();
  await expect(intro).toContainText("Kein Urteil.");
  await page.getByTestId("tension-intro-dismiss").click();
  await expect(intro).toHaveCount(0);
});
```

**Step 4: Run → PASS:**
`npx vitest run src/components/TensionNavigator.origin.test.tsx && npm run lint && npx playwright test tests/e2e/tension-navigator.spec.ts`
— vitest PASS, Playwright 6 passed (5 alte + 1 neuer).

**Step 5: Commit:**
`git add -A && git commit -m "feat: Navigator-Intro 'Kein Urteil…' — session-dismissible, anti-reifizierend (B-010)"`

---

## Task 5 — A8: DST-Sackgasse → 400 `invalid_birth_time_dst`

**Exploration (bereits LIVE verifiziert 2026-06-11 — NICHT erneut raten):**
`POST https://api.fufire.space/chart` mit `local_datetime: "1990-03-25T02:30:00"`,
`tz_id: "Europe/Berlin"` → **422** mit diesem Body (Discriminator `type: "dst_error"`):

```json
{
  "error": "Nonexistent local time due to DST transition: 1990-03-25T02:30:00 in Europe/Berlin. Provide a valid time or set nonexistentTime='shift_forward'.",
  "type": "dst_error",
  "hint": "Use dst_policy='earlier' or 'later' to auto-resolve.",
  "message": "Nonexistent local time due to DST transition: 1990-03-25T02:30:00 in Europe/Berlin. Provide a valid time or set nonexistentTime='shift_forward'.",
  "detail": {},
  "status": 422,
  "path": "/chart",
  "timestamp": "2026-06-11T12:41:55.425749Z",
  "request_id": "b5e1b2ca-776d-4da2-a959-4833915e9e4a"
}
```

Heute mappt `mapStatusToError` JEDES 400/422 auf `invalid_fufire_payload` → 502
„FuFirE hat die uebermittelten Geburtsdaten abgelehnt."; der Body wird verworfen.

**Files:** Create: `src/__fixtures__/fufire/chart-422-dst.json` (EXAKT der Body oben) ·
Modify: `src/utils/fufireClient.ts` + `.test.ts`, `src/server/app.test.ts`,
`src/api/bazodiacClient.ts` + `.test.ts`, `src/App.tsx`, `src/components/InputForm.tsx`

**Step 1: Failing Tests.** (a) `fufireClient.test.ts`, describe `"FuFirEClient error mapping"` anfügen:

```ts
  it("maps 422 mit type=dst_error auf invalid_birth_time_dst (400, klare Anleitung)", async () => {
    const dstBody = (await import("../__fixtures__/fufire/chart-422-dst.json")).default;
    mockFetchOnce(422, dstBody);
    const err = await FuFirEClient.postChart({} as any).catch((e) => e);
    expect(err.code).toBe("invalid_birth_time_dst");
    expect(err.httpStatus).toBe(400);
    expect(err.message).toContain("existiert am Umstellungstag nicht");
    expect(err.message).toContain("vor 02:00 oder nach 03:00");
  });

  it("422 OHNE dst_error bleibt invalid_fufire_payload (502)", async () => {
    mockFetchOnce(422, { error: "validation_error", detail: { errors: [] } });
    await expect(FuFirEClient.postChart({} as any)).rejects.toMatchObject({
      code: "invalid_fufire_payload",
      httpStatus: 502
    });
  });
```

(b) `app.test.ts`, describe `"POST /api/azodiac/profile"`:

```ts
  it("reicht den DST-Fehler als 400 invalid_birth_time_dst an den Browser durch (A8)", async () => {
    const err: any = new Error("Diese Uhrzeit existiert am Umstellungstag nicht (Sommerzeit). Bitte eine Zeit vor 02:00 oder nach 03:00 wählen.");
    err.code = "invalid_birth_time_dst";
    err.httpStatus = 400;
    (FuFirEClient.postChart as any).mockRejectedValue(err);
    const res = await request(app).post("/api/azodiac/profile").send(VALID_BODY);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_birth_time_dst");
    expect(res.body.message).toContain("Umstellungstag");
  });
```

(c) `bazodiacClient.test.ts`, neuer describe (Imports existieren am Dateikopf bereits):
```ts
describe("DST-Fehlertexte (A8)", () => {
  const dstErr = new BazodiacRequestError(
    "Diese Uhrzeit existiert am Umstellungstag nicht (Sommerzeit). Bitte eine Zeit vor 02:00 oder nach 03:00 wählen.",
    { status: 400, code: "invalid_birth_time_dst" }
  );
  it("Message wird unverändert durchgereicht", () => {
    expect(getUserFacingRequestMessage(dstErr)).toContain("existiert am Umstellungstag nicht");
    expect(getUserFacingRequestMessage(dstErr)).toContain("vor 02:00 oder nach 03:00");
  });
  it("Titel benennt die Zeitumstellung", () => {
    expect(getUserFacingErrorTitle(dstErr)).toBe("Geburtszeit existiert nicht (Zeitumstellung)");
  });
});
```

**Step 2: Run → FAIL:**
`npx vitest run src/utils/fufireClient.test.ts src/server/app.test.ts src/api/bazodiacClient.test.ts`
— (a) rot (Fixture fehlt / Code mappt auf `invalid_fufire_payload`), (c) rot (Titel
„Geburtsdaten ungültig"), (b) rot bis Fixture+Code existieren.

**Step 3: Implementierung.**
(a) `src/__fixtures__/fufire/chart-422-dst.json` mit EXAKT dem oben dokumentierten Body anlegen.
(b) `src/utils/fufireClient.ts`:
- Z. 31–38, Union: nach `| "invalid_fufire_payload"` → `| "invalid_birth_time_dst"` einfügen.
- Z. 40–48 `ERROR_HTTP_STATUS`: `invalid_birth_time_dst: 400,` ergänzen.
- Z. 50–58 `SAFE_MESSAGES` ergänzen:

```ts
  invalid_birth_time_dst: "Diese Uhrzeit existiert am Umstellungstag nicht (Sommerzeit). Bitte eine Zeit vor 02:00 oder nach 03:00 wählen.",
```

- Z. 175–179, den `if (!res.ok)`-Block ersetzen:

```ts
  if (!res.ok) {
    // 422-Body lesen: FuFirE markiert nicht-existente Lokalzeiten (DST-Lücke) mit
    // type="dst_error" (Fixture: src/__fixtures__/fufire/chart-422-dst.json, live
    // verifiziert 2026-06-11). Nur der Discriminator wird gelesen — kein Upstream-
    // Text wird an den Browser durchgereicht.
    let body: any = null;
    try { body = await res.json(); } catch { /* kein JSON-Body — generisch mappen */ }
    const isDst = (res.status === 422 || res.status === 400) && body && body.type === "dst_error";
    const error = isDst ? new FuFirEError("invalid_birth_time_dst") : mapStatusToError(res.status);
    logUpstreamError(method, endpoint, pathPrefix, res.status, error.code);
    throw error;
  }
```

(c) `src/api/bazodiacClient.ts`:
- `getUserFacingRequestMessage` (Z. 167), als ERSTER Branch im
  `instanceof BazodiacRequestError`-Block:

```ts
    if (error.code === "invalid_birth_time_dst") {
      return error.message; // Server liefert die vollständige, handlungsleitende Anleitung.
    }
```

- `getUserFacingErrorTitle` (Z. 186), als erster Branch:

```ts
    if (error.code === "invalid_birth_time_dst") return "Geburtszeit existiert nicht (Zeitumstellung)";
```

(d) `src/App.tsx` — Fehlercode tracken und an InputForm reichen:
- Z. ~25: `const [errorCode, setErrorCode] = React.useState<string | null>(null);`
- In `loadProfile` neben `setErrorMsg(null)`: `setErrorCode(null);`
- Im catch (Z. ~39–42) zusätzlich: `setErrorCode(err?.code ?? null);`
- Z. ~60, InputForm-Render:

```tsx
      return (
        <InputForm
          birthData={birthData}
          onCalculate={handleCalculate}
          timeError={errorCode === "invalid_birth_time_dst" ? errorMsg : null}
        />
      );
```

(e) `src/components/InputForm.tsx`:
- Interface (Z. 7–10): `timeError?: string | null;` ergänzen.
- Signatur (Z. 27): `… InputForm({ birthData, onCalculate, timeError = null }: InputFormProps) {`
- Unter dem Zeit-Input (nach `<input id="input-time" …/>`, Z. ~158):

```tsx
                {timeError && (
                  <p className="mt-1.5 text-[11px] text-red-400 font-sans leading-relaxed" data-testid="time-field-error">
                    {timeError}
                  </p>
                )}
```

**Step 4: Run → PASS:**
`npx vitest run src/utils/fufireClient.test.ts src/server/app.test.ts src/api/bazodiacClient.test.ts && npm run lint && npm test`
(voller `npm test`, weil `request()` jetzt Fehler-Bodies liest — `mockFetchOnce` liefert
immer `json()`, die 401/404/500-Mapping-Tests bleiben grün).

**Step 5: Commit:**
`git add -A && git commit -m "feat: DST-Sackgasse — Upstream dst_error wird 400 invalid_birth_time_dst mit Handlungsanleitung (A8)"`

---

## Task 6 — A13: `viewModel.warnings` rendern (Overview)

**Files:** Create: `src/components/Overview.warnings.test.tsx` · Modify: `src/components/Overview.tsx`
**Step 1: Failing Test:**

```tsx
// src/components/Overview.warnings.test.tsx
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import Overview from "./Overview";
import { renderComponent, cleanupComponent } from "../test-utils/renderComponent";
import { normalizeFuFireProfile } from "../utils/fufireNormalizer";
import chartFixture from "../__fixtures__/fufire/chart.json";
import westernFixture from "../__fixtures__/fufire/western.json";
import fusionFixture from "../__fixtures__/fufire/fusion.json";

const INPUT = { name: "Test", birthDate: "1990-06-15", birthTime: "14:30", birthPlaceLabel: "Berlin", gender: "Divers" };
afterEach(cleanupComponent);

describe("Overview rendert warnings (A13)", () => {
  it("zeigt den Hinweise-Block, wenn der Normalizer Warnungen liefert", () => {
    const vm = normalizeFuFireProfile({}, INPUT, "fufire-chart"); // 4 Warnungen
    expect(vm.warnings.length).toBeGreaterThan(0);
    const c = renderComponent(<Overview viewModel={vm} onNavigate={() => {}} />);
    const block = c.querySelector('[data-testid="overview-warnings"]');
    expect(block).toBeTruthy();
    expect(block!.textContent).toContain("Hinweise zur Berechnung");
    expect(block!.textContent).toContain("Westliche Astrologie-Daten fehlen im Quell-Chart.");
  });

  it("zeigt KEINEN Block, wenn keine Warnungen existieren", () => {
    const raw = { ...chartFixture, western: westernFixture, fusion: fusionFixture };
    const vm = normalizeFuFireProfile(raw, INPUT, "fufire-orchestrated");
    expect(vm.warnings).toEqual([]);
    const c = renderComponent(<Overview viewModel={vm} onNavigate={() => {}} />);
    expect(c.querySelector('[data-testid="overview-warnings"]')).toBeNull();
  });
});
```

**Step 2: Run → FAIL:** `npx vitest run src/components/Overview.warnings.test.tsx`
— `overview-warnings` existiert nicht.

**Step 3: Implementierung** in `src/components/Overview.tsx`: direkt NACH dem schließenden
`</div>` des Greeting-Banners (Z. 108, vor `{/* Astro Triad Grid */}`):

```tsx
      {/* A13: Ehrliche Berechnungs-Hinweise aus dem Normalizer — gedämpft, kein Alarm. */}
      {viewModel.warnings.length > 0 && (
        <div
          className="glass-card p-4 rounded-2xl border border-gold-muted/10 bg-obsidian-deep/40"
          data-testid="overview-warnings"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500 font-bold block mb-2">
            Hinweise zur Berechnung
          </span>
          <ul className="space-y-1">
            {viewModel.warnings.map((w) => (
              <li key={w} className="text-xs text-stone-400 font-sans leading-relaxed">{w}</li>
            ))}
          </ul>
        </div>
      )}
```

**Step 4: Run → PASS:** `npx vitest run src/components/Overview.warnings.test.tsx && npm run lint`

**Step 5: Commit:**
`git add -A && git commit -m "feat: Berechnungs-Hinweise (viewModel.warnings) sichtbar in Overview (A13)"`

---

## Task 7 — A14: Element-spezifische Stärken/Schatten statt Einheitstext

Heute (`fufireNormalizer.ts` Z. 468–469) sehen ALLE Nutzer dieselben Texte
(„Ausgewogenheit, Feinfühligkeit" / „Schatten weisen auf …"). Fix: Ableitung aus dem
Tagesmeister-Element über eine kuratierte 5-Element-Tabelle (anti-reifizierend,
„im Modell"-Rahmung, kein „Du bist") + ehrliches Kuratiert-Label in BaZiDetail.
**Files:** Modify: `src/utils/fufireNormalizer.ts`,
`src/utils/fufireNormalizer.realshapes.test.ts`, `src/components/BaZiDetail.tsx`
**Step 1: Failing Tests** — `fufireNormalizer.realshapes.test.ts`, ans Ende anfügen:

```ts
describe("A14: Tagesmeister-Stärken/Schatten sind element-spezifisch, nicht Einheitstext", () => {
  const ELEMENTS: [string, ElementType][] = [
    ["Jiǎ", ElementType.WOOD], ["Bǐng", ElementType.FIRE], ["Wù", ElementType.EARTH],
    ["Gēng", ElementType.METAL], ["Rén", ElementType.WATER]
  ];
  const vmForStem = (stem: string) =>
    normalizeFuFireProfile({ bazi: { day_master: stem } }, INPUT, "fufire-orchestrated");

  it("Fixture-Profil (Day Master Xin → Metall) bekommt den Metall-Text", () => {
    const vm = normalizeFuFireProfile({ bazi: baziFixture }, INPUT, "fufire-orchestrated");
    expect(vm.bazi.dayMaster.element).toBe(ElementType.METAL);
    expect(vm.bazi.dayMaster.strengths).toContain("Metall");
    expect(vm.bazi.dayMaster.shadow).toContain("Metall");
    expect(vm.bazi.dayMaster.strengths).not.toBe("Ausgewogenheit, Feinfühligkeit");
  });

  it("alle 5 Elemente liefern 5 VERSCHIEDENE Stärken- und Schatten-Texte", () => {
    const strengths = ELEMENTS.map(([s]) => vmForStem(s).bazi.dayMaster.strengths);
    const shadows = ELEMENTS.map(([s]) => vmForStem(s).bazi.dayMaster.shadow);
    expect(new Set(strengths).size).toBe(5);
    expect(new Set(shadows).size).toBe(5);
  });

  it("Anti-Reification: keine Festlegungs-Sprache, 'im Modell'-Rahmung vorhanden", () => {
    for (const [stem] of ELEMENTS) {
      const dm = vmForStem(stem).bazi.dayMaster;
      expect(dm.strengths).not.toMatch(/\bDu bist\b|\bSie sind\b/i);
      expect(dm.shadow).not.toMatch(/\bDu bist\b|\bSie sind\b/i);
      expect(`${dm.strengths} ${dm.shadow}`).toContain("im Modell");
    }
  });

  it("Legacy-Passthrough: explizite rawBazi.strengths/shadow gewinnen weiterhin", () => {
    const vm = normalizeFuFireProfile(
      { bazi: { day_master: "Xin", strengths: "Engine-Text S", shadow: "Engine-Text X" } },
      INPUT, "fufire-orchestrated"
    );
    expect(vm.bazi.dayMaster.strengths).toBe("Engine-Text S");
    expect(vm.bazi.dayMaster.shadow).toBe("Engine-Text X");
  });
});
```

**Step 2: Run → FAIL:** `npx vitest run src/utils/fufireNormalizer.realshapes.test.ts`
— alle Elemente liefern identisch „Ausgewogenheit, Feinfühligkeit".

**Step 3: Implementierung.** (a) `fufireNormalizer.ts` — nach `ELEMENT_COACHING`
(nach Z. 58) Tabelle einfügen (Texte EXAKT so übernehmen):

```ts
// A14: Kuratierte, element-spezifische Tagesmeister-Texte. „Im Modell"-Rahmung
// (Anti-Reification): beschreibt die Element-Qualität, nie die Person. Wird in
// BaZiDetail sichtbar als kuratierte Element-Deutung gelabelt.
const DAY_MASTER_TEXTS: Record<ElementType, { strengths: string; shadow: string }> = {
  [ElementType.WOOD]: {
    strengths: "Holz steht im Modell für Anfangskraft, Wachstum und bewegliche Planung — die Fähigkeit, Neues auszurichten und Spielräume zu erschließen.",
    shadow: "Die Holz-Schattenseite im Modell: Zerstreuung durch zu viele parallele Triebe und Ungeduld mit langsamen Prozessen — Erdung wirkt ausgleichend."
  },
  [ElementType.FIRE]: {
    strengths: "Feuer steht im Modell für Ausstrahlung, Wandlungsenergie und ansteckende Begeisterung — die Kraft, Dinge sichtbar zu machen.",
    shadow: "Die Feuer-Schattenseite im Modell: Verausgabung und Überhitzung, wenn alles gleichzeitig brennen soll — Rhythmus und Pausen wirken ausgleichend."
  },
  [ElementType.EARTH]: {
    strengths: "Erde steht im Modell für Stabilität, Verlässlichkeit und die vermittelnde Mitte — die Kraft, Dinge zu tragen und zusammenzuhalten.",
    shadow: "Die Erde-Schattenseite im Modell: Verharren in Gewohntem und kreisendes Grübeln — Bewegung und klare Entscheidungen wirken ausgleichend."
  },
  [ElementType.METAL]: {
    strengths: "Metall steht im Modell für Klarheit, Präzision und Form- und Urteilskraft — die Fähigkeit, Wesentliches vom Unwesentlichen zu trennen.",
    shadow: "Die Metall-Schattenseite im Modell: Härte und Unnachgiebigkeit, wenn die Form wichtiger wird als der Inhalt — Durchlässigkeit wirkt ausgleichend."
  },
  [ElementType.WATER]: {
    strengths: "Wasser steht im Modell für Tiefe, Anpassungsfähigkeit und langen Atem — die Kraft, Wege um Hindernisse herum zu finden.",
    shadow: "Die Wasser-Schattenseite im Modell: Versickern in Unverbindlichkeit oder stiller Sorge — Form und feste Zusagen geben Halt."
  }
};
```

(b) Z. 461–470, `baziDayMaster` — Default-Strings ersetzen (nur die letzten beiden Felder
ändern sich):

```ts
    // A14: element-spezifisch statt Einheitstext; explizite Engine-/Legacy-Texte gewinnen.
    strengths: rawBazi.strengths || DAY_MASTER_TEXTS[dmElement].strengths,
    shadow: rawBazi.shadow || DAY_MASTER_TEXTS[dmElement].shadow
```

(c) `src/components/BaZiDetail.tsx` — Kuratiert-Label: direkt NACH dem schließenden `</div>`
des Stärken/Schatten-Grids (Z. ~135, noch innerhalb des „Daymaster Text Analysis"-Blocks):

```tsx
                <p className="font-mono text-[9px] uppercase tracking-widest text-stone-500 pt-2">
                  Kuratierte Element-Deutung — abgeleitet vom Tagesmeister-Element, nicht individuell berechnet.
                </p>
```

**Step 4: Run → PASS:**
`npx vitest run src/utils/fufireNormalizer.realshapes.test.ts && npm run lint && npm test`

**Step 5: Commit:**
`git add -A && git commit -m "feat: element-spezifische Tagesmeister-Texte statt Einheitstext + Kuratiert-Label (A14)"`

---

## Abschluss: Gates, PR, Live-Smoke

**1. Volle Gates (alle grün; Zahlen vorher/nachher in den PR-Body):**
```bash
npm run lint && npm test && npm run build && npx playwright test
git checkout -- docs/qa/screenshots/ 2>/dev/null || true
```
Erwartet: lint 0 Fehler; vitest > Baseline (~223 + ~20 neue); Playwright 16 passed (15 + 1).

**2. Push + PR (KEIN Merge ohne Review — Master §6):**

```bash
git push -u origin fix/sprint-p1-kritische-fixes
gh pr create --repo DYAI2025/New_Bazi --base main \
  --title "fix: Sprint P1 — kritische Ehrlichkeits-Fixes (B-001/B-002/B-007/B-010/A8/A13/A14)" \
  --body "$(cat <<'EOF'
## Sprint P1 (Plan: docs/plans/2026-06-11-sprint-p1-kritische-fixes.md)

- B-001 Coaching-Wording entfernt (WuXingDetail → Alltagsimpuls) + Wording-Gate-Test
- B-002 coherenceIndex: number|null — null statt erfundener 0/75, Missing-State im Herkunft-Layer
- B-007 Pinning-Test Asc/Mond/Haus (Fixture Waage/Fische/Haus 5) — Ergebnis: <GRÜN: not reproduced | ROT: Fix in …>
- B-010 Navigator-Intro „Kein Urteil…", session-dismissible (Modul-Flag, kein localStorage)
- A8 DST: Upstream 422 type=dst_error → 400 invalid_birth_time_dst, Anzeige am Zeitfeld (Live-Body als Fixture chart-422-dst.json)
- A13 viewModel.warnings als „Hinweise zur Berechnung" in Overview
- A14 element-spezifische Tagesmeister-Stärken/Schatten (kuratierte 5er-Tabelle) + Kuratiert-Label

## TDD-Beweise
<je Task: Red-Run-Auszug + Green-Run>

## Gates
- Baseline: vitest <N> passed, Playwright 15 passed
- Nachher: lint ✓ | vitest <M> passed | build ✓ | Playwright 16 passed

## MISSING (ehrlich)
- B-007: <falls grün> mit Berlin-Fixture nicht reproduzierbar — Regression-Pin ergänzt; Repro mit Original-Geburtsdaten des Melders steht aus.
- A8: DST-Hinweis erscheint am Zeitfeld erst NACH einem Berechnungsversuch (kein Pre-Submit-DST-Check im Browser).
- B-010: Intro-Dismiss gilt pro JS-Session (Reload zeigt es wieder) — Persistenz bewusst auf P3 (Supabase) verschoben.
- Interner Bezeichner ELEMENT_COACHING in fufireNormalizer.ts unverändert (kein Produkttext).
EOF
)"
```

**3. Live-Smoke nach Merge + Railway-Deploy (Master §3.4–3.5, BLOCKEND für DoD):**
```bash
# Deploy-Frische: neuer Asset-Hash gegenüber vorher?
curl -s https://newbazi-production.up.railway.app/ | grep -o 'assets/index-[^"]*\.js' | head -1

# A8 live: DST-Zeit → 400 invalid_birth_time_dst (vorher 502). Body muss "Umstellungstag" enthalten.
curl -s -w "\n%{http_code}\n" -X POST https://newbazi-production.up.railway.app/api/azodiac/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"DST Smoke","birthDate":"1990-03-25","birthTime":"02:30","placeId":"smoke","birthPlaceLabel":"Berlin","lat":52.52,"lon":13.405,"tz":"Europe/Berlin","gender":"Divers"}'

# Regression: gültiges Profil weiterhin 200
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://newbazi-production.up.railway.app/api/azodiac/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke","birthDate":"1990-06-15","birthTime":"14:30","placeId":"smoke","birthPlaceLabel":"Berlin","lat":52.52,"lon":13.405,"tz":"Europe/Berlin","gender":"Divers"}'
```

Browser-Check (Master §3.5): Fusion-Tab — Intro sichtbar, „Verstanden" blendet aus,
Herkunft-Layer zeigt Gauge bzw. „nicht verfügbar"; WuXing-Tab zeigt „Alltagsimpuls";
Overview ohne neue Konsolen-Fehler. Ergebnis im PR nachtragen.
