# Sprint P10: Signatur — Element-Sphäre mit Spannungs-Modulation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Master-Roadmap + N2-Annex (Schichtenmodell/Farben). Fidelity B.
> **ABHÄNGIGKEIT:** P9 (Hub + Cyan-Linse existieren). Quiz-Modulation (P8) optional andockbar.

**Goal:** Die Signatur kehrt zurück als DATENGETRIEBENE visuelle Identität: eine Element-Sphäre, deren Form aus dem Natal-Fusionsfeld kommt und die nachvollziehbar auf Spannungszustand, Tagesfeld und Rat-der-6-Wahl reagiert — jede visuelle Eigenschaft hat eine benennbare Datenquelle (keine Fake-Dynamik).

**Architecture:** Zwei Stufen, bewusst getrennt: **Stufe 1 (dieser Sprint): 2D-SVG-Sphäre** — Weiterentwicklung der bewährten Ring-Geometrie (Testtool-Stil), GPU-frei, CSS-animiert, vollständig testbar. **Stufe 2 (separater Folge-Sprint, NICHT hier): 3D/Cymatics (Three.js)** — erst wenn Stufe 1 die Datenbindung bewiesen hat. Das Datenmodell `SignatureState` ist von Anfang an stufen-agnostisch, sodass die 3D-Version es unverändert konsumiert.

**Branch:** `feat/sprint-p10-signatur`

---

## Quellen

```
FuFirE Bootstrap-Response: signature_blueprint { seed, visual: { symmetry, curvature, angularity, density, contrast, orbit_count } }
  → Fixture prüfen: src/__fixtures__/fufire/bootstrap.json (Felder verifizieren!)
AN=/Users/.../Astro-Noctum: server.mjs → computeQuizDimensions / computeNatalDimensions / projectToRing (signature-delta-Logik, Referenz)
AN/src/components/SignatureSphere3D.tsx                  ← NUR als Visual-Referenz ansehen (nicht portieren — Stufe 2)
New_Bazi: TensionNavigator (Geometrie-Helfer polar/blend), tensionNavigator.ts (TensionState)
```

## Task 1: `SignatureState`-Datenmodell (pure, TDD)

`src/utils/signatureState.ts`:
```ts
export interface SignatureState {
  seed: string;                       // aus signature_blueprint.seed — STABILE Identität
  base: { symmetry: number; curvature: number; angularity: number; density: number; contrast: number; orbitCount: number }; // blueprint.visual, je [0,1] bzw. int
  elements: Record<"Holz"|"Feuer"|"Erde"|"Metall"|"Wasser", number>;  // fusionierte Verteilung (aus elementalComparison-Mittelung — fuseElementalWeights-Muster aus Synastry-Server wiederverwenden/extrahieren)
  modulation: {
    tensionAxis: string | null;        // aktive Achsen-id
    tensionLean: "a" | "b" | null;
    signalLevel: "leise"|"spuerbar"|"dominant" | null;
    dailyShift: number | null;         // [-1..1] Tages- vs Natal-Achsen-Abweichung (P2-Daten; null wenn fehlt)
    userLensElement: string | null;    // Rat-der-6-Wahl (Cyan) — heute, sonst null
  };
}
export function buildSignatureState(vm: ProfileViewModel, tension: TensionState | null, daily?: …, lens?: …): SignatureState | null
```
Regeln (testen!): ohne blueprint → null (ehrlicher Leerzustand, kein Default-Seed); modulation-Felder einzeln null-fähig; KEINE Vermischung — base bleibt für gleiche Person konstant (Wiedererkennung, Konzept §9 „Der Ring ist die Signatur").

## Task 2: Mapping Daten→Visual (das Herzstück, TDD)

`src/utils/signatureVisual.ts` — pure Funktion `signatureVisualParams(state) → RenderParams`. BINDENDE Zuordnungstabelle (im Code + Plan dokumentiert; Review prüft 1:1):

| Datenquelle | Visuelle Eigenschaft |
|---|---|
| base.symmetry/curvature/… (blueprint) | Grundform der Sphäre: Lappen-Anzahl (orbitCount), Wellen-Amplitude (curvature), Kanten-Härte (angularity), Punktdichte (density) |
| elements-Verteilung | 5 Farbzonen-Gewichte auf der Sphäre (Element-Farben: Holz-Grün, Feuer-Rot abgedunkelt konzeptkonform?, NEIN — Konzeptfarben: Gold/Blau-Spektrum + Element-Akzente NUR als Zonen-Sättigung; keine Ampel-Farben) |
| tensionAxis + lean | Eine Achse der Sphäre dehnt sich Richtung Pol (Gold-Seite oder Blau-Seite) — Deformations-Vektor |
| signalLevel | Puls-Amplitude der CSS-Animation: leise 1%, spürbar 2.5%, dominant 4% Scale-Atmung |
| dailyShift | Rotations-Offset der Deformation (Tag zieht woanders als Natal) |
| userLensElement (Cyan!) | Cyan-Glow-Ring um die Zone des gewählten Elements — VISUELL GETRENNT von Gold/Blau (N2-Regel) |
| null-Felder | jeweilige Eigenschaft im Ruhezustand — NIE animiert ohne Datenquelle (Fake-Dynamik-Verbot, Test: alle modulation null → params identisch mit base-only) |

Determinismus-Test: gleicher State → gleiche Params; seed ändert NUR Phase/Orientierung (hash), nie die Daten-Mappings.

## Task 3: `<SignatureSphere/>` (SVG, CSS-only)

`src/components/SignatureSphere.tsx`: SVG-Pfad-basierte „atmende" Form (Superformel-artig oder radiale Wellen-Funktion aus base-Params — Geometrie-Helfer als pure Funktionen in signatureVisual.ts, damit testbar: `spherePath(params, t=0) → string` mit Snapshot-Test), Element-Zonen als Gradient-Segmente, Deformation + Cyan-Ring nach Params. Animation: CSS `@keyframes` Scale-Atmung (Amplitude aus Params via CSS-Var), `prefers-reduced-motion` → statisch. KEIN framer-motion auf SVG (Master §1.5). Legende unter der Sphäre: 3 Zeilen Datenherkunft („Grundform: dein Fusionsfeld · Dehnung: aktive Spannung ({Achse}) · Cyan: deine heutige Antwort") — Transparenz ist Teil des Features.

## Task 4: Einbettung

Hub („Heute", P9): Sphäre kompakt neben/über dem Ring — Tages- und Antwort-Modulation live. Fusion-Tab: Sphäre groß im Herkunft-Layer-Bereich (Natal-Zustand, ohne Tages-Layer). Props-getrennt (`mode: "natal" | "daily"`).

## Task 5: e2e + Abschluss

e2e: Sphäre rendert (path vorhanden, data-testid), Rat-der-6-Wahl → Cyan-Ring erscheint (Mock-Flow aus P9-Spec erweitern), reduced-motion-Variante statisch. Gates + PR `feat: Signatur-Sphäre (datengebundene 2D-Stufe)` + MISSING (3D/Cymatics-Stufe als eigener Folge-Sprint mit Three.js-Evaluierung; Share-Export; Quiz-Marker-Modulation nach P8 als kleines Follow-up — Andock-Punkt: weiteres modulation-Feld).

## Risiken
- Scope-Falle 3D: dieser Sprint liefert BEWUSST 2D. Wenn der Executor Three.js anfängt, hat er den Plan verfehlt.
- signature_blueprint-Felder: ZUERST Fixture verifizieren — wenn das Bootstrap-Fixture andere visual-Keys trägt, gilt das Fixture, und die base-Tabelle wird angepasst (im Report dokumentieren).
- „Fake-Dynamik-Verbot" ist die Honesty-Assertion dieses Sprints: der null→ruhig-Test ist Pflicht.
