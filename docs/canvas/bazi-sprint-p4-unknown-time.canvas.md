# Product Canvas: BaZi Sprint P4 — Unknown Birth Time Mode

**Feature-Slug:** `bazi-sprint-p4-unknown-time`
**Status:** draft (amended post-council — re-confirmation pending)
**Erstellt:** 2026-06-12
**Bestätigungsphrase:** (leer — erneute Bestätigung erforderlich nach Council-Amendments A/B/C)

---

## 1. Problem

**Explicit** (Sprint-Plan P4 + Master-Roadmap):
Ein erheblicher Anteil von Nutzerinnen kennt die genaue Uhrzeit ihrer Geburt nicht. New_Bazi macht heute die Geburtszeit zum Pflichtfeld — wer die Zeit nicht kennt, wird entweder blockiert oder gibt eine Rate-Zeit ein, die stillschweigend als Fakt in die Berechnung einfließt. Das Ergebnis: Aszendent, Häuser und Stundensäule erscheinen als korrekte Aussagen, obwohl sie es nicht sind. Das verletzt das Ehrlichkeits-Versprechen der App (erarbeitet in P1/P2) und schließt Nutzerinnen ohne Geburtszeit-Wissen komplett aus dem Erlebnis aus.

## 2. Zielnutzer/Kundin

**Explicit** (aus Canvas P1/P2, user-confirmed 2026-06-11):
Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, nutzen New_Bazi zum Erkunden von Mustern — Entertainment/Reflexion-Positionierung.

**Assumption** (aus Kontext erschlossen, nicht explizit bestätigt):
Innerhalb dieser Zielgruppe gibt es einen signifikanten Teilsegment, dem die Geburtszeit schlicht unbekannt ist (z. B. keine Geburtsurkunde mit Uhrzeit, Adoption, Familienüberlieferung fehlt). Diese Nutzerinnen sollen ein vollwertiges Teilerlebnis erhalten, nicht einen Fehlerbildschirm.

## 3. Bisheriger Workaround

**Explicit** (Sprint-Plan P4, implizit):
Nutzerinnen ohne bekannte Zeit geben entweder 12:00 als Rate-Zeit ein (stille Fehlinformation — Aszendent/Häuser/Stundensäule erscheinen als Fakten) oder sie verwenden die App gar nicht. Es gibt keinen UI-gestützten Weg, Unsicherheit über die Geburtszeit auszudrücken.

## 4. Value Proposition

**Explicit** (Sprint-Plan P4):
- Nutzerinnen ohne bekannte Geburtszeit können die App vollständig nutzen — alle zeitunabhängigen Elemente (Tagessäulen BaZi, Planetenpositionen ohne Aszendent/Häuser, Wu-Xing-Analyse) werden vollständig angezeigt.
- Zeitabhängige Felder (Aszendent, Häuser, Stundensäule, ggf. Mondzeichen bei Grenzlage) werden explizit als nicht bestimmbar gekennzeichnet — niemals als stille 12:00-Fakten dargestellt.
- Eine einzige Checkbox „Geburtszeit unbekannt" aktiviert den degradierten Modus; kein separater Eingabe-Flow, keine Registrierungspflicht.
- Das Vertrauensversprechen der App wird gestärkt: Nutzerinnen sehen genau, was bekannt ist und was nicht.

**Assumption** (nicht explizit im Plan):
Die ehrliche Behandlung unbekannter Zeit differenziert New_Bazi von generischen Horoskop-Apps, die stets vollständige Ergebnisse simulieren, und ist Teil des Ehrlichkeits-Markenzeichens (aus P1/P2 Canvas).

## 5. Erfolgssignal

**Explicit** (Sprint-Plan P4, Tasks 1–5 + Risiken):
1. TDD-grün für alle Tasks (RED/GREEN-Beweise im Report).
2. `npm run lint && npm test && npm run build` — kein Regressionen in bestehenden Tests (insbesondere Synastrie- und Daily-Mapper-Tests bleiben grün).
3. Zentraler Honesty-Test grün: `ascendant === null` wenn `timeKnown:false` — kein 12:00-Wert als Fakt.
4. Stundensäulen-Null-Test grün: `bazi.pillars.hour === null` wenn `timeKnown:false`.
5. Paar-Modus-Regressions-Test grün: Synastrie mit einem unknown-time-Partner degradiert statt crasht.
6. Live-Fixtures vorhanden: `src/__fixtures__/fufire/unknown-time/*.json` für alle Endpoints (bazi, western, fusion, bootstrap, daily, dayun) committiert.
7. `npx playwright test` — neuer E2E-Spec: Checkbox gesetzt → Profil rendert → Aszendent-Karte zeigt „—" → BaZi-Tab zeigt 3 Säulen + Hinweis → TensionNavigator rendert.
8. Live-Smoke auf Production: echter unknown-time-Durchlauf mit Screenshot der degradierten Sektionen.

## 6. Kern-Use-Case

**Explicit** (Sprint-Plan P4):
Nutzerin öffnet Eingabeformular → aktiviert Checkbox „Geburtszeit unbekannt" → Zeitfeld wird disabled und geleert, Hinweistext erscheint → Nutzerin gibt Geburtsdatum und -ort ein → berechnet Profil.

Ergebnis: Alle tagesstabilen Werte (BaZi Jahres-/Monats-/Tagessäule, Planeten-Zeichen/Grad außer Mond bei Grenzlage, Wu-Xing-Vektor) erscheinen vollständig. Zeitabhängige Werte (Aszendent, Häuser, BaZi-Stundensäule) zeigen „—" plus `<TimeDependencyNote/>`.

**[Amendment B]** `<TimeDependencyNote/>` trägt Versicherungssprache — kein bloßes „—", sondern: was weiterhin gilt ("Deine drei Tagessäulen, alle Planetenzeichen und -grade, dein Wu-Xing-Vektor sind vollständig") + was fehlt und warum. Ziel: Nutzerin fühlt kein kaputtes Produkt, sondern bewusstes partielles Profil. Mond zeigt `(ungefähr)`-Suffix wenn 12:00-Mond < 6° von Zeichengrenze.

**Assumption** (nicht explizit):
Der Paar-Modus (Synastrie) mit einem unknown-time-Partner soll den gleichen Degradations-Pfad nutzen — kein separater Paar-Modus für diesen Fall.

## 7. Non-Goals (explizit)

**Explicit** (Sprint-Plan P4):
- Kein Zeitfenster-Modus / Time-Rectification (Berechnung mehrerer Uhrzeiten zur Eingrenzung).
- Mond-Näherungsheuristik (6°-Schwelle) ist Best-Effort, nicht präzise astronomische Grenzbestimmung.
- Keine bestehenden Routen oder Komponenten außerhalb des definierten Scopes verändern.
- Keine neuen Dependencies.

**Assumption** (aus Plan-Kontext erschlossen, nicht explizit):
- Kein separater UI-Bereich oder Hinweis-Dialog außerhalb der `<TimeDependencyNote/>`-Komponente.
- Keine Speicherung des `timeKnown`-Flags in Supabase (P3-Scope) in diesem Sprint.

**OPEN QUESTION (OQ-P4-01):** Wird `timeKnown:false` in P3-Supabase-Profil gespeichert, sodass beim Laden eines gespeicherten Profils der Checkbox-Zustand wiederhergestellt wird? Der Sprint-Plan nennt dies nicht explizit. Wenn ja, ändert sich der Scope von `src/server/app.ts` und das Supabase-Schema.

## 8. Risiken / Widersprüche

**Explicit** (Sprint-Plan P4, Risiken-Abschnitt):

- **[KRITISCH] Synastrie + Daily Mapper-Regression:** Beide verwenden dieselben `fufirePayloadMappers`. Änderungen am Mapper-Verhalten bei `timeKnown:false` müssen rückwärtskompatibel sein. Mindestens ein Regressions-Test: Paar-Modus mit einem unknown-time-Partner muss degradieren, nicht crashen.

- **[KRITISCH] Kein stiller 12:00-Fakt:** Der Test `ascendant === null` bei `timeKnown:false` ist die zentrale Honesty-Assertion. Ein Normalizer-Bug, der stattdessen den 12:00-berechneten Aszendenten durchlässt, wäre ein Produktionsfehler erster Ordnung.

- **[EXPLICIT] FuFirE-Contract-Abhängigkeit:** Der Contract `docs/contracts/unknown-time.md` im FuFirE-Repo entscheidet, ob Zeit-Feld weggelassen oder als `12:00:00` + `birth_time_known:false` gesendet wird. Der Sprint-Plan ist explizit: „DER CONTRACT ENTSCHEIDET, nicht dieser Plan". Laut den hier vorliegenden Angaben ist die Konvention bestätigt: Placeholder `12:00:00` + `birth_time_known:false` (Zeit immer required, 422 bei fehlendem Zeit-Feld).

- **[EXPLICIT] Mondzeichen-Grenzlogik:** Moon wandert ~13°/Tag. Bei 12:00-Berechnung nahe einer Zeichengrenze (< 6°) ist das angezeigte Mondzeichen möglicherweise falsch. Die Heuristik `isApproximate:true` + UI-Suffix `(ungefähr)` ist Best-Effort; der Schwellenwert 6° ist im Plan genannt, aber die Genauigkeit der Grenzberechnung ist von der Engine-Präzision abhängig.

- **[EXPLICIT] BaZi Tagessäulen-Mitternachts-Edge-Case:** Der Plan nennt: „dayMaster bleibt (Tagessäule ist zeitunabhängig… AUSSER nahe Mitternacht: wenn Contract zeigt, dass die Engine das flaggt, übernehmen; sonst Hinweis-Text generisch halten)." Ob die Engine diesen Fall in der Response flaggt, muss beim Live-Smoke-Lauf gegen die Fixtures verifiziert werden.

- **[EXPLICIT] Wu-Xing / Fusion ohne Stundensäule:** Wu-Xing-Vektor verändert sich durch fehlende Hour-Qi-Beiträge. Ob die Engine `calibration.quality:"sparse"` oder ähnliches ausgibt, ist contract-abhängig und im Live-Fixture zu verifizieren.

- **[ASSUMPTION] `chart_type_quality` als Trust-Signal:** Laut vorliegenden Angaben ist `chart_type_quality` (BootstrapResponse/DailyResponse) der kanonische Trust-Signal für aszendenten-abhängige Werte. Diese Annahme stützt sich auf den FuFirE-Contract — sie ist verifizierbar aber nicht aus dem New_Bazi-Quellcode selbst ableitbar.

## 9. Evidence Needed

**[Amendment C] Task 0 — Engine-Spike (vor allem anderen):**
- FuFirE-Engine mit echten Fixtures auf `birth_time_known:false` aufrufen (alle 6 Endpoints)
- Beweise: Welche Felder werden tatsächlich nulled/degradiert? Wird `hour_pillar` null? Ist `chart_type_quality:"assumed_day"` gesetzt?
- Spike-Ergebnis dokumentiert in `src/__fixtures__/fufire/unknown-time/` + kurzer Befund-Kommentar
- Gate: Wenn Engine-Verhalten vom Contract abweicht → STOP, User informieren, bevor Normalizer-Code geschrieben wird.

**Explicit** (Sprint-Plan P4):
- TDD-Beweise (RED/GREEN) je Task.
- Live-Fixtures für alle 6 Endpoints mit `timeKnown:false`: `src/__fixtures__/fufire/unknown-time/*.json` (Ground Truth für Task 3-Tests).
- Normalizer-Unit-Tests gegen die Fixtures: jede Degradations-Regel einzeln (ascendant null, houses leer, hour null, moon approximate).
- Paar-Modus-Regressions-Test-Output.
- `npx playwright test` — E2E-Spec-Output.
- Live-Smoke-Screenshot: Production-Deployment mit unknown-time-Durchlauf, degradierte Sektionen sichtbar.

**Assumption** (aus Qualitätsmuster der vorigen Sprints erschlossen):
- `npm run lint && npm test && npm run build` Zahlen vorher/nachher im Report.
- FuFirE-Contract-Lese-Bestätigung (welcher Endpoint wie reagiert) im Task-2-Report.

## 10. Traceability

- **MASTER:** `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md`
- **P4-Plan:** `docs/plans/2026-06-11-sprint-p4-unknown-time.md`
- **FuFirE-Dependency-Contract:** `[FuFirE-Repo]/docs/contracts/unknown-time.md`
  - canvas-link: `docs/canvas/bazi-sprint-p4-unknown-time.canvas.md` (dieses Dokument)

Erlaubter Änderungs-Scope (P4):
- `src/utils/birthInputValidation.ts` + Test
- `src/viewmodels/profileViewModel.ts` (Typ-Erweiterung `timeKnown: boolean`)
- `src/utils/fufirePayloadMappers.ts` + Test
- `src/utils/fufireNormalizer.ts` + Test
- `src/__fixtures__/fufire/unknown-time/*.json` (neue Live-Fixtures)
- `src/components/InputForm.tsx` (Checkbox + disabled-Zeitfeld)
- `src/components/WesternAstrology.tsx` (Degradations-Hinweise)
- `src/components/BaZiDetail.tsx` (Stundensäulen-Hinweis)
- `src/components/TensionNavigator.tsx` (Herkunft-Layer-Note)
- `src/components/Overview.tsx` (Aszendent-Karte „—" + Zeit-unbekannt-Tag)
- `src/components/TimeDependencyNote.tsx` (neue wiederverwendbare Komponente)
- `tests/e2e/` (neuer unknown-time-Spec)
- `scripts/fufire-live-smoke.mts` (unknown-time-Variante)
**OQ-P4-01 RESOLVED [Amendment A] (user-confirmed: Ja, vereinfacht via Council):**
`timeKnown` wird in Supabase persistiert — aber NICHT als neue Spalte/Migration, sondern im bestehenden `birth_data` JSONB-Blob.
- `BirthData` type (types.ts): `timeKnown?: boolean` hinzufügen
- `birth_data`-JSON enthält `timeKnown: false` → wird durch bestehendes BFF POST/GET automatisch round-getripted (kein Serverschema-Change)
- Kein `supabase/migrations/20260612_p4_timeknown.sql` nötig
- `AccountMenu.tsx` / `App.tsx`: `onProfileLoad` liest `birth_data.timeKnown` → propagiert zu InputForm-Checkbox-State
