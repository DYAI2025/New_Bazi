# PRD: BaZi Sprint P4 — Unknown Birth Time Mode

**Feature-Slug:** bazi-sprint-p4-unknown-time
**Status:** user-confirmed
**Erstellt:** 2026-06-12
**Canvas-Link:** docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
**Sprint-Plan:** docs/plans/2026-06-11-sprint-p4-unknown-time.md

---

## Zusammenfassung

New_Bazi macht die Geburtszeit heute zum Pflichtfeld. Nutzerinnen ohne Zeitwissen werden blockiert oder geben stillschweigend 12:00 ein — Aszendent, Häuser und Stundensäule erscheinen dann als korrekte Fakten, obwohl sie es nicht sind. Das verletzt das Ehrlichkeitsversprechen der App (etabliert in P1/P2).

P4 beseitigt dieses Problem mit einem einzigen UI-Toggle: Checkbox „Geburtszeit unbekannt" → alle tagesstabilen Werte erscheinen vollständig (Tagessäulen, Planetenzeichen/-grade, Wu-Xing-Analyse); zeitabhängige Felder (Aszendent, Häuser, Stundensäule, ggf. Mondzeichen bei Grenzlage) werden als nicht bestimmbar markiert — niemals als stille 12:00-Fakten.

Die technische Kette: `InputForm`-Checkbox → `birthInputValidation` (Zeit optional bei `timeKnown:false`, intern 12:00-Konvention) → `fufirePayloadMappers` (4 hardcodierte `birth_time_known:true` → Flag durchreichen) → `fufireNormalizer` (response-driven null-checks gegen Engine-Felder) → UI-Sektionen degradieren pro Komponente. Das `timeKnown`-Flag wird im bestehenden `birth_data`-JSONB-Blob in Supabase persistiert — keine neue Spalte, keine Migration (Council Amendment A).

**Council Amendments (bindend, in dieser PRD vollständig umgesetzt):**
- **A:** `timeKnown?: boolean` in `birth_data` JSONB — kein neues Supabase-Spalten/Migration.
- **B:** `<TimeDependencyNote/>` trägt Versicherungssprache: was weiterhin gilt + was fehlt und warum.
- **C:** REQ-P4-001 ist der Engine-Spike — Gate vor allen anderen REQs.

---

## Anforderungen (REQs)

### REQ-P4-001 — Engine Spike: FuFirE-Verhalten bei birth_time_known:false verifizieren

**Beschreibung:**
Vor jeder Implementierung muss das tatsächliche Verhalten der FuFirE-Engine bei `birth_time_known:false` durch Live-Calls verifiziert werden. Alle 6 Endpoints werden mit `birth_time_known:false` und Placeholder-Zeit `12:00:00` aufgerufen. Die Responses werden als JSON-Fixtures committiert. Nur wenn das Engine-Verhalten exakt zum Contract in `/Users/benjaminpoersch/Projects/FuFirE/docs/contracts/unknown-time.md` passt, darf die Implementierung fortgesetzt werden. Bei Abweichung: STOP und User-Report.

Der Contract definiert (aktualisiert nach Live-Spike 2026-06-12):
- `POST /v1/calculate/bazi` → 200, `precision.provisional_fields=["hour"]`; `pillars.hour` ist NICHT null in der Engine-Response — Normalizer muss aus `provisional_fields` auf null setzen (F-02)
- `POST /v1/calculate/western` → 200, `precision.provisional_fields=["ascendant","houses","mc"]`; `angles.Ascendant` ist NON-null (12:00-Wert) — Normalizer muss short-circuiten (F-01)
- `POST /v1/calculate/fusion` → 200, `precision.provisional_fields=["signature","hour","ascendant","houses"]`; `calibration.quality="ok"` (nicht "sparse")
- `POST /v1/experience/bootstrap` → 200; kein `chart_type_quality`-Feld auf Top-Level; `profile.ascendant_sign` ist mit 12:00-Wert befüllt ("Jungfrau" o.ä.) — Normalizer muss `profile.ascendant_sign` auf null setzen wenn `timeKnown:false`
- `POST /v1/experience/daily` → 200, `quality_flags.chart_type_quality="assumed_day"` ✓ (funktioniert korrekt)
- `POST /v1/calculate/bazi/dayun` → 200; Dayun degradiert NICHT bei `birth_time_known:false` — 大運 sind datumsbasiert, nicht zeitbasiert; Engine echot `precision.birth_time_known=true` (Engine-Bug, aber Verhalten korrekt); Dayun pass-through ohne Degradation
- Fehlendes `time`-Feld: Engine akzeptiert date-only-String mit 200 (kein 422); 422-Validierung liegt im BFF, nicht Engine

Zusätzlich verifizieren: Wird `hour_pillar` in der BaZi-Response tatsächlich `null`? Wird `ascendant` in der Western-Response tatsächlich `null` oder nur `provisional` markiert? Gibt Fusion `calibration.quality:"sparse"` aus? Flaggt die Engine BaZi-Tagessäulen-Mitternachts-Edge-Cases?

**Akzeptanzkriterien:**
- [ ] Script `scripts/fufire-live-smoke.mts` enthält eine `unknown-time`-Variante, die alle 6 Endpoints aufruft.
- [ ] Fixtures `src/__fixtures__/fufire/unknown-time/bazi.json`, `western.json`, `fusion.json`, `bootstrap.json`, `daily.json`, `dayun.json` sind committiert und enthalten vollständige echte Engine-Responses.
- [ ] Jede Fixture enthält einen kurzen Befund-Kommentar (oder eine README-Datei im Fixture-Ordner), der dokumentiert, welche Felder tatsächlich null/provisional sind.
- [ ] Contract-Verifikationsmatrix: Für jeden Endpoint explizit bestätigt oder Abweichung gemeldet.
- [ ] Gate: Wenn Engine-Verhalten vom Contract abweicht → Implementierung stoppt, User-Report mit konkreter Abweichung.
- [ ] Gate: Wenn `birth_time_known:false` ohne `time`-Feld → HTTP 422 bestätigt (nicht implementiert).

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "GATE — Engine-Abweichung vom Contract stoppt Implementierung; Risk aligned wenn Gate passiert"

---

### REQ-P4-002 — BirthData-Typ und birthInputValidation: Zeit optional bei timeKnown:false

**Beschreibung:**
`ValidatedBirthInput` (und `BirthData` in `src/types.ts`) erhält das Feld `timeKnown?: boolean` (default: `true`). Die Validierungslogik in `src/utils/birthInputValidation.ts` verhält sich wie folgt:

- `timeKnown === true` (oder undefined): `birthTime` ist Pflichtfeld im Format `HH:mm`. Bestehende Validierungspfade bleiben unverändert (Regressionstests grün).
- `timeKnown === false`: `birthTime` darf fehlen oder leer sein. Intern wird `"12:00"` als Rechenzeit gesetzt UND `timeKnown:false` in `ValidatedBirthInput` weitergereicht. Wenn eine Zeit angegeben ist (User gibt ungefähre Zeit an), wird diese verwendet — aber `timeKnown:false` bleibt gesetzt (partiell bekannte Zeit ist dennoch unsicher).
- Das `timeKnown`-Flag wird nicht verworfen — es wird durch die gesamte Kette bis zum Payload-Mapper weitergeleitet.

`src/viewmodels/profileViewModel.ts` wird um das `timeKnown`-Feld auf der ViewModel-Ebene erweitert, sodass UI-Komponenten darauf reagieren können.

**Akzeptanzkriterien:**
- [ ] `src/types.ts`: `BirthData` enthält `timeKnown?: boolean`.
- [ ] `birthInputValidation.ts`: `{timeKnown:false}` ohne `birthTime` → Validierung ok, normalisiertes Objekt enthält `birthTime:"12:00"`, `timeKnown:false`.
- [ ] `birthInputValidation.ts`: `{timeKnown:false, birthTime:"14:30"}` → Validierung ok, Zeit bleibt `"14:30"`, `timeKnown:false` gesetzt.
- [ ] `birthInputValidation.ts`: `{timeKnown:true}` ohne Zeit → Validierungsfehler wie bisher (Regressions-Test grün).
- [ ] `birthInputValidation.ts`: `{timeKnown:true, birthTime:"14:30"}` → Validierung ok wie bisher.
- [ ] Unit-Tests: RED (failing) geschrieben vor Implementierung, dann GREEN nach Implementierung.
- [ ] Alle bestehenden Unit-Tests für `birthInputValidation.ts` bleiben grün (kein Regressionen).

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "aligned"

---

### REQ-P4-003 — fufirePayloadMappers: timeKnown durch alle 4 hardcodierten Stellen durchfädeln

**Beschreibung:**
In `src/utils/fufirePayloadMappers.ts` ist `birth_time_known: true` aktuell an 4 Stellen hardcodiert:
- `WesternRequestPayload`-Mapper
- `BaziRequestPayload`-Mapper
- `FusionRequestPayload`-Mapper
- `BirthInput`-Mapper (für bootstrap/daily/dayun)

Jede dieser 4 Stellen wird so geändert, dass der `timeKnown`-Flag aus dem `ValidatedBirthInput` gelesen und als `birth_time_known` in das Payload eingesetzt wird. Es wird keine neue Abstraktion/Layer eingeführt — nur die 4 hardcodierten `true`-Werte werden durch `input.timeKnown ?? true` (oder äquivalentes sicheres Lesen) ersetzt.

Das Placeholder-Zeit-Feld (`12:00:00`) wird immer gesetzt — der FuFirE-Contract verlangt das Zeitfeld als Required (fehlend → 422). Die 12:00-Konvention ist intern; sie erscheint niemals als angezeigte Uhrzeit in der UI.

**Akzeptanzkriterien:**
- [ ] Alle 4 Mapper-Stellen: `birth_time_known` liest aus `input.timeKnown ?? true` statt hardcodiert `true`.
- [ ] Unit-Tests: Bei `timeKnown:false` enthält jedes der 4 Payloads `birth_time_known:false` — exakte Body-Assertions.
- [ ] Unit-Tests: Bei `timeKnown:true` (oder undefined) enthält jedes Payload `birth_time_known:true` — Regressionstests grün.
- [ ] Zeitfeld ist in jedem Payload present (nie weggelassen) — kein `422`-Risiko durch fehlendes Zeitfeld.
- [ ] Bestehende Mapper-Tests für Synastrie (Paar-Modus) und Daily bleiben grün.
- [ ] RED-vor-GREEN-TDD-Beleg für jede neue Assertion.

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "aligned"

---

### REQ-P4-004 — fufireNormalizer: Response-driven Degradation (null-checks gegen Engine-Response-Felder)

**Beschreibung:**
`src/utils/fufireNormalizer.ts` normalisiert die Engine-Responses in das ViewModel. Die Degradation ist response-driven: der Normalizer prüft tatsächliche Engine-Response-Felder (z. B. `result.bazi?.hourPillar === null`), nicht ein prop-gedrilltes `timeKnown`-Flag durch den Komponentenbaum.

Folgende Degradationsregeln werden implementiert (Ground Truth: die in REQ-P4-001 committierten Fixtures):

**BaZi — [F-02 FIX]:**
- `precision.provisional_fields` enthält `"hour"` → `bazi.pillars.hour` im ViewModel auf `null` setzen + `bazi.timeDependentNote` = „Stundensäule benötigt die Geburtszeit."
- **BEKANNTE TRIP-GEFAHR:** `fufireNormalizer.ts` Zeile ~458 enthält `rawBazi.hour || { stem: defaultStem, branch: defaultBranch }`. Wenn die Engine `hour: null` zurückgibt, feuert dieser `||`-Fallback und erzeugt ein Non-null-Objekt. **Der Implementer MUSS diesen Fallback entfernen oder durch eine explizite `provisional_fields`-Prüfung ersetzen**: `const hourPillar = provisionalFields.includes("hour") ? null : (rawBazi.hour ?? null)`. Ohne diese Änderung verletzt REQ-P4-004 die Honesty-Invariante trotz grüner Tests.
- Tagessäulen-Mitternachts-Edge-Case: wenn Engine diesen Fall flaggt (aus Fixture), wird er übernommen; sonst bleibt der Hinweistext generisch.

**Western — [F-01 FIX]:**
- `precision.provisional_fields` enthält `"ascendant"` → `western.ascendant` auf `null` setzen.
- **BEKANNTE TRIP-GEFAHR:** `fufireNormalizer.ts` Zeile ~315–318 enthält eine mehrstufige Fallback-Kette: `rawWest.ascendant || angles.Ascendant → signName || houseCusps[0] → signName || "Unbekannt"`. Wenn die Engine `ascendant: null` in einer `provisional_fields`-Response zurückgibt, kann `angles.Ascendant` trotzdem mit 12:00-berechnetem Wert befüllt sein. **Der Implementer MUSS die gesamte Fallback-Kette short-circuiten**: wenn `provisional_fields` enthält `"ascendant"` → `western.ascendant = null`, kein Durchlauf durch `angles.Ascendant` oder `houseCusps[0]`. Ein Testfall muss explizit `angles.Ascendant !== null` in der Fixture haben und trotzdem `western.ascendant === null` im ViewModel nachweisen.
- `precision.provisional_fields` enthält `"houses"` → `western.houses` leer setzen, `planeten[].house` auf `null`.
- `western.timeDependentNote` = „Ohne Geburtszeit sind Aszendent und Häuser nicht bestimmbar; Planetenpositionen gelten für den Tag."
- Mond-Näherungsheuristik: wenn der 12:00-Mond weniger als 6° von einer Zeichengrenze entfernt ist → `western.moon.isApproximate = true`. Die 6°-Schwelle wird als Unit-Test verifiziert (Grenzfall: genau 6°, unter 6°, über 6°).
- Planeten-Zeichen und -Grade (außer Mond bei Grenzlage) bleiben vollständig — sie sind tagesstabil.

**Fusion/Wu-Xing — [F-04 FIX]:**
- Wenn Fusion-Response `precision.provisional_fields` enthält `"signature"` oder `"hour"` → `fusion.signalLevelSuffix = "(ohne Stundensäule)"` oder äquivalentes Badge-Feld.
- `calibration.quality:"sparse"` — **OFFENE HYPOTHESE (nicht im Contract belegt):** Wenn REQ-P4-001-Spike bestätigt, dass die Engine dieses Feld ausgibt, implementieren; andernfalls bleibt dieser Pfad inaktiv. Kein Produktionsfehler wenn absent.

**westernContributors — [F-06 FIX]:**
- `fufireNormalizer.ts` enthält einen Fallback `westernContributors: rawFusion.westernContributors || [\`Sonne in ${sunSign}\`, \`Mond in ${moonSign}\`, \`Aszendent in ${ascendant}\`]`. Wenn `timeKnown:false` und `ascendant === null`, darf der `Aszendent in ...`-Template-String nicht erscheinen. **Constraint:** wenn `provisional_fields` enthält `"ascendant"` → `westernContributors`-Fallback ersetzt `Aszendent in ${ascendant}` durch keinen Eintrag (oder explizit `"Aszendent nicht berechenbar"`). Unit-Test verifiziert diesen Pfad.

**Bootstrap — [F-05 FIX — Spike-Befund 2026-06-12]:**
- `bootstrap.profile.ascendant_sign` ist mit 12:00-berechnetem Wert befüllt (z.B. "Jungfrau") auch wenn `birth_time_known:false`. Normalizer muss `profile.ascendant_sign → null` wenn `timeKnown:false`. Selbe F-01-Logik: Engine gibt Wert zurück, Normalizer nullt ihn.
- `chart_type_quality` ist NICHT auf Top-Level in bootstrap — kein `chart_type_quality`-Gate für bootstrap.

**Daily:**
- `quality_flags.chart_type_quality === "assumed_day"` → ViewModel-Feld `chartQuality: "assumed_day"` setzen (für UI-Hinweis verwendbar). Kanonisches Signal auf Daily-Response ✓.

**Dayun:**
- Dayun-Response pass-through: keine Degradation bei `timeKnown:false`. 大運 sind datumsbasiert. Normalizer lässt Dayun unverändert.

Das ViewModel trägt außerdem `timeKnown: boolean` als Top-Level-Feld, gesetzt aus dem Eingabe-Flag (nicht aus der Engine-Response).

**Akzeptanzkriterien:**
- [ ] Unit-Tests für jeden Degradationspfad, geschrieben gegen die REQ-P4-001-Fixtures (TDD).
- [ ] Test: `result.bazi.pillars.hour === null` wenn Engine `provisional_fields` enthält `"hour"` — **Fixture muss `rawBazi.hour: null` enthalten; der `||`-Fallback darf nicht feuern**.
- [ ] Test: `result.western.ascendant === null` wenn Engine `provisional_fields` enthält `"ascendant"` — **Fixture muss `angles.Ascendant` mit einem Non-null-12:00-Wert enthalten, um zu beweisen, dass die Fallback-Kette short-circuited wurde und nicht `angles.Ascendant` zurückgibt**.
- [ ] Test: `result.western.houses` leer wenn `provisional_fields` enthält `"houses"`.
- [ ] Test: `result.western.moon.isApproximate:true` bei Mondposition < 6° von Zeichengrenze; `isApproximate:false` bei >= 6°.
- [ ] Test: `westernContributors` enthält keinen `"Aszendent in ..."` Eintrag wenn `provisional_fields` enthält `"ascendant"`.
- [ ] Test: Synastrie (Paar-Modus) mit einem `timeKnown:false`-Partner: Normalizer wirft keinen Error, ViewModel enthält sinnvolle Degradation.
- [ ] Bestehende Normalizer-Tests bleiben grün.

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "KRITISCH — zentraler Honesty-Test; ein Bug, der 12:00-Aszendent durchlässt, ist Produktionsfehler erster Ordnung"

---

### REQ-P4-005 — TimeDependencyNote: Versicherungskomponente mit Klartext-Narrativ

**Beschreibung:**
Neue Komponente `src/components/TimeDependencyNote.tsx`. Sie wird an allen Stellen eingesetzt, wo zeitabhängige Felder fehlen (Aszendent, Häuser, Stundensäule), sowie einmalig als zentraler Hinweis wenn `timeKnown:false`.

**Versicherungssprache (Amendment B — bindend):** Die Komponente darf nicht nur „—" oder einen nackten Fehltext zeigen. Sie muss explizit formulieren:
1. Was weiterhin funktioniert: „Deine drei Tagessäulen (Jahr, Monat, Tag), alle Planetenzeichen und -grade sowie deine Wu-Xing-Analyse sind vollständig bestimmt."
2. Was fehlt und warum: „Aszendent, Häuser und Stundensäule erfordern die genaue Geburtszeit und können ohne sie nicht berechnet werden."
3. Keine Diagnose, kein Schicksal-Wording, kein Alarm-Stil.

Der Ton ist edel, ruhig, klar — das Produkt wirkt bewusst und ehrlich, nicht kaputt.

Die Komponente akzeptiert optionale Props, um kontextspezifisch zu variieren:
- `missingFields: string[]` — welche Felder konkret fehlen (z. B. `["Aszendent", "Häuser"]` vs. `["Stundensäule"]`)
- `workingFields?: string[]` — welche Felder weiterhin gelten (optional, für Kontext)
- `variant?: "full" | "inline"` — `full` für prominenten Hinweis oben, `inline` für kurzen Begleittext direkt neben dem „—"-Platzhalter

**Akzeptanzkriterien:**
- [ ] Komponente `src/components/TimeDependencyNote.tsx` existiert.
- [ ] Rendert Versicherungstext mit expliziter „Was funktioniert"-Aussage UND „Was fehlt warum"-Aussage.
- [ ] Enthält keines der verbotenen Wörter: „Coaching", „Therapie", „Diagnose", keine „Du bist…"-Festlegungen.
- [ ] Ton: kein Ausrufezeichen, kein Alarm-Vokabular, keine Entschuldigungen.
- [ ] Props: `missingFields` und `variant` funktionieren korrekt (Unit-Test oder Snapshot-Test).
- [ ] Komponente ist wiederverwendbar in allen Sektionen (Overview, WesternAstrology, BaZiDetail, TensionNavigator).

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "aligned"

---

### REQ-P4-006 — UI-Degradation: InputForm, Overview, WesternAstrology, BaZiDetail, TensionNavigator

**Beschreibung:**
Alle betroffenen UI-Komponenten erhalten ehrliche Darstellung fehlender Zeitdaten. Keine Komponente außerhalb des definierten Scopes wird verändert.

**InputForm (`src/components/InputForm.tsx`):**
- Checkbox „Geburtszeit unbekannt" neben dem Zeitfeld.
- Checkbox aktiviert → Zeitfeld wird disabled und geleert; Hinweistext erscheint: „Berechnung mit Tagesmitte (12:00); zeitabhängige Teile werden gekennzeichnet."
- Checkbox deaktiviert → Zeitfeld wieder aktiv, normales Verhalten.
- Das `timeKnown`-Flag wird als State gepflegt und an die Validation / den Submit-Handler übergeben.

**Overview (`src/components/Overview.tsx`):**
- Aszendent-Karte: zeigt bei `ascendant === null` (response-driven) „—" + kleines Tag „Zeit unbekannt".
- Das Tag ist klickbar/hoverable und zeigt eine kurze Erklärung (kann ein Tooltip oder eine modale Erklärung sein — Implementierung wählt einfachste Option).

**WesternAstrology (`src/components/WesternAstrology.tsx`):**
- Aszendent-Sektion: zeigt `<TimeDependencyNote missingFields={["Aszendent","Häuser"]} />` wenn `western.ascendant === null`.
- Häuser-Sektion: leer + Note wenn Häuser fehlen.
- Mond-Näherung: zeigt `(ungefähr)` Suffix wenn `western.moon.isApproximate === true`.

**BaZiDetail (`src/components/BaZiDetail.tsx`):**
- Stundensäule: zeigt Platzhalter „—" + `<TimeDependencyNote missingFields={["Stundensäule"]} variant="inline" />` wenn `bazi.pillars.hour === null`.
- Die übrigen 3 Säulen (Jahr, Monat, Tag) werden vollständig angezeigt — kein Hinweis auf fehlende Zeit bei diesen.

**TensionNavigator (`src/components/TensionNavigator.tsx`):**
- Wenn Fusion-ViewModel `signalLevelSuffix` enthält → Badge zeigt „(ohne Stundensäule)" oder äquivalenten Hinweis.
- Fusion selbst bleibt funktional und wird dargestellt — der Hinweis kommuniziert reduzierte Präzision, kein Fehler.

**E2E-Spec (`tests/e2e/`):**
- Neuer Spec: Formular mit Checkbox → Checkbox aktivieren → Profil absenden → Aszendent-Karte zeigt „—" + Tag → BaZi-Tab zeigt 3 Säulen + Stundensäulen-Hinweis → TensionNavigator rendert ohne Error.
- Mock-Datei erhält eine `unknown-time`-Chart-Variante (nach Muster der bestehenden `PARTNER_CHART`-Keying-Struktur).

**Akzeptanzkriterien:**
- [ ] InputForm: Checkbox vorhanden, Zeitfeld wird disabled/enabled korrekt.
- [ ] InputForm: `timeKnown:false` erreicht den Submit-Handler.
- [ ] Overview: Aszendent-Karte zeigt „—" + „Zeit unbekannt"-Tag wenn `ascendant === null`.
- [ ] WesternAstrology: `<TimeDependencyNote/>` erscheint wenn `western.ascendant === null`.
- [ ] WesternAstrology: Mondzeichen zeigt `(ungefähr)` wenn `isApproximate === true`.
- [ ] BaZiDetail: 3 vollständige Säulen + Stundensäulen-Platzhalter + Note wenn `pillars.hour === null`.
- [ ] TensionNavigator: rendert ohne Error bei Fusion-Daten ohne Stundensäule.
- [ ] E2E-Spec: `npx playwright test` neuer Spec grün.
- [ ] Keine der definierten verbotenen Begriffe in UI-Texten.

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "aligned"

---

### REQ-P4-007 — Supabase JSONB-Persistenz: timeKnown im birth_data-Blob

**Beschreibung:**
Das `timeKnown`-Flag wird im bestehenden `birth_data`-JSONB-Blob in Supabase persistiert. Es wird keine neue Supabase-Spalte angelegt und keine Migration erstellt (Council Amendment A — bindend).

**Mechanismus:**
- `src/types.ts`: `BirthData.timeKnown?: boolean` (bereits in REQ-P4-002 definiert, hier für Persistenzkontext relevant).
- BFF (`POST`-Endpunkt für Profil-Speicherung): round-trippt `birth_data` als JSON; `timeKnown` ist Teil dieses JSON-Blobs → wird automatisch persistiert ohne Code-Änderung am BFF.
- BFF (`GET`-Endpunkt für Profil-Laden): liefert `birth_data` zurück; `timeKnown` ist darin enthalten.
- `src/components/AccountMenu.tsx` und/oder `src/App.tsx` (`onProfileLoad`): liest `birth_data.timeKnown` aus dem geladenen Profil und propagiert es zum InputForm-Checkbox-State.
- Default: wenn `birth_data.timeKnown` undefined oder `true` → Checkbox nicht gesetzt (normaler Modus).
- Wenn `birth_data.timeKnown === false` → Checkbox „Geburtszeit unbekannt" ist beim Laden vorausgewählt.

**Akzeptanzkriterien:**
- [ ] `BirthData` type enthält `timeKnown?: boolean`.
- [ ] Nach Profil-Speicherung mit `timeKnown:false` und erneutem Laden: `birth_data.timeKnown` ist `false`.
- [ ] `AccountMenu.tsx` / `App.tsx`: `onProfileLoad` liest `birth_data.timeKnown` und setzt Checkbox-State korrekt.
- [ ] Kein neues Supabase-Migration-File vorhanden (Invariante: kein `supabase/migrations/` file mit P4-Timestamp).
- [ ] Bestehende Profil-Lade/Speichern-Tests bleiben grün (keine Regression durch neues optionales Feld).
- [ ] Profil mit fehlendem `timeKnown`-Feld (alter Datensatz) wird korrekt behandelt: Checkbox nicht gesetzt (default `true`).
- [ ] **[F-07] BFF-JSONB-Strip-Check:** Nach Speichern + Laden bestätigt der Test, dass `birth_data.timeKnown:false` im geladenen Objekt vorhanden ist (BFF parsiert `birth_data` nicht durch einen Schema-Validator, der unbekannte Felder verwirft). Wird in REQ-P4-001-Spike oder dediziertem BFF-Test verifiziert.

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
- canvas-problem: "Nutzerinnen ohne Geburtszeit werden blockiert oder erhalten stille 12:00-Fakten"
- canvas-target-user: "Neugierige Erwachsene 25–45, Entertainment/Reflexion"
- canvas-value-claim: "Checkbox 'Geburtszeit unbekannt' → ehrliches partielles Profil; zeitabh. Felder null, nie als Fakten"
- canvas-success-signal: "ascendant===null && pillars.hour===null bei timeKnown:false; Synastrie-Regression grün"
- canvas-risk-status: "aligned — kein Schema-Change, rückwärtskompatibel durch optionales Feld"

---

## Nicht-funktionale Anforderungen (NFRs)

### NFR-01 — Sicherheit: Kein Secret-Leak

- `SUPABASE_SERVICE_ROLE_KEY` darf niemals in Logs, Konsole, Error-Responses, oder ins Browser-Bundle.
- Nur `VITE_SUPABASE_ANON_KEY` (mit `VITE_`-Prefix) gelangt ins Browser-Bundle — niemals der Service-Role-Key.
- Kein Secret wird committiert. Wenn ein `.env`-File versehentlich in den Staging-Area gelangt, schlägt der Commit fehl (Pre-Commit-Hook, falls vorhanden) oder muss manuell gestoppt werden.
- `VITE_*`-Prefix-Regel gilt ohne Ausnahme für alle Browser-seitig zugänglichen Env-Variablen.

### NFR-02 — Datenhonestigkeit: Keine stummen Defaults

- Fehlende Daten werden als `null` oder expliziter Missing-State dargestellt — niemals als `0`, als leerer String der als gültiger Wert wirkt, oder als erfundener Default.
- Insbesondere: `ascendant === null` bei `timeKnown:false` ist unveränderlicher Honesty-Invariante. Kein Normalizer-Pfad darf einen 12:00-berechneten Aszendenten als echten Fakt durchlassen.
- `bazi.pillars.hour === null` bei `timeKnown:false` ist eine gleichwertige Honesty-Invariante.

### NFR-03 — Sprachliche Constraints für UI-Texte

Verbotene Wörter und Formulierungen in allen UI-Texten dieser PRD (TimeDependencyNote, InputForm-Hinweistexte, Overview-Tags, Tooltip-Texte):
- „Coaching", „Therapie", „Diagnose"
- „Du bist…"-Festlegungen (deterministische Charakter-Aussagen)
- Schicksals-Wording (z. B. „Dein Schicksal", „vorherbestimmt")
- Alarm-Vokabular (Ausrufezeichen, „Achtung!", „Warnung:")

Gebotener Ton für `<TimeDependencyNote/>` (Amendment B): edel, ruhig, klar. Das Produkt wirkt bewusst und partiell, nicht defekt.

### NFR-04 — Regressionssicherheit: Synastrie und Daily bleiben stabil

- Synastrie/Paar-Modus-Tests bleiben grün nach allen Mapper- und Normalizer-Änderungen.
- Daily-Mapper-Tests bleiben grün.
- Mindestens ein expliziter Regressions-Test: Paar-Modus mit einem `timeKnown:false`-Partner muss degradieren statt crashen.
- `npm run lint && npm test && npm run build` — kein neuer Fehler.

### NFR-05 — Keine neuen Dependencies

Alle Implementierungen nutzen die bestehende Tech-Stack-Kette. Keine neuen `npm install`-Abhängigkeiten werden eingeführt.

### NFR-06 — Scope-Disziplin

Nur die in Abschnitt „Scope-Grenzen" explizit erlaubten Dateien werden geändert. Keine anderen Komponenten, Services, oder Konfigurationsdateien werden im Zuge von P4 angefasst.

### NFR-07 — TDD-Protokoll

Für jede neue Implementierungseinheit gilt: Failing Test (RED) wird vor der Implementierung geschrieben, dann Green. Das RED/GREEN-Protokoll wird im Sprint-Abschlussbericht dokumentiert.

---

## Risiken

### R-01 — Engine-Abweichung vom Contract (KRITISCH)
**Beschreibung:** Die FuFirE-Engine verhält sich bei `birth_time_known:false` anders als im Contract dokumentiert. Beispiel: `hour_pillar` ist nicht `null`, sondern mit einem 12:00-Wert befüllt; oder `ascendant` ist im Western-Response vorhanden statt provisional.
**Mitigierung:** REQ-P4-001 (Engine Spike) ist das Gate. Bei Abweichung: Implementierung stoppt, User-Report mit konkreter Abweichung. Kein Normalizer-Code wird auf Basis von Annahmen geschrieben.
**Eintrittswahrscheinlichkeit:** gering (Contract ist durch P2 bereits verifiziert), aber Konsequenz hoch.

### R-02 — Stiller 12:00-Fakt (KRITISCH)
**Beschreibung:** Ein Normalizer-Bug lässt den 12:00-berechneten Aszendenten oder die 12:00-Stundensäule als scheinbaren Fakt in die UI durch.
**Mitigierung:** Der Test `ascendant === null` bei `timeKnown:false` und `bazi.pillars.hour === null` bei `timeKnown:false` sind zentrale Honesty-Assertions in REQ-P4-004. Diese Tests schlagen fehl, bevor das Produkt ausgeliefert wird.

### R-03 — Synastrie/Daily Mapper-Regression
**Beschreibung:** Die Änderungen an `fufirePayloadMappers.ts` brechen bestehende Synastrie- oder Daily-Calls.
**Mitigierung:** Expliziter Regressions-Test (Paar-Modus mit unknown-time-Partner). Mapper-Änderung ist rückwärtskompatibel (`timeKnown ?? true`-Default).

### R-04 — Mondzeichen-Grenzlogik ist heuristisch
**Beschreibung:** Die 6°-Schwelle für `isApproximate` ist ein Best-Effort-Wert, keine astronomisch exakte Grenzberechnung.
**Mitigierung:** Als explizite Einschränkung in der UI kommuniziert (Non-Goal: Mond-Näherungsheuristik ist nicht präzise astronomisch). Der Test verifiziert nur die interne Logik, nicht die astronomische Korrektheit.

### R-05 — BaZi Tagessäulen-Mitternachts-Edge-Case
**Beschreibung:** Tagessäule kann nahe Mitternacht ambivalent sein. Ob die Engine diesen Fall in der Response flaggt, ist von der Live-Fixture abhängig.
**Mitigierung:** REQ-P4-004 enthält explizite Anweisung: wenn Engine flaggt, übernehmen; sonst generischer Hinweistext. Entscheidung nach REQ-P4-001-Spike.

### R-06 — Wu-Xing/Fusion-Sparse-Quality-Signal
**Beschreibung:** Ob die Engine `calibration.quality:"sparse"` ausgibt, ist contract-abhängig und in den Live-Fixtures zu verifizieren.
**Mitigierung:** REQ-P4-001 verifiziert dies. Wenn Engine das Signal nicht liefert, bleibt der Normalizer-Pfad für dieses Feld inaktiv.

---

## Scope-Grenzen (explizit Out-of-Scope)

- Kein Zeitfenster-Modus / Time-Rectification (Berechnung mehrerer Uhrzeiten zur Eingrenzung des möglichen Aszendenten).
- Mond-Näherungsheuristik (6°-Schwelle) ist Best-Effort — keine präzise astronomische Grenzberechnung.
- Keine neue Supabase-Spalte, keine neue Migration für `timeKnown` (Amendment A: JSONB-Blob-Persistenz, nicht Schema-Change).
- Keine neuen npm-Dependencies.
- Keine Komponenten außerhalb des definierten Scope-Fensters werden angefasst.
- Kein separater UI-Dialog oder dedicated Erklärungsseite für unbekannte Geburtszeit.
- Kein Paar-Modus-eigener `timeKnown`-Flow — Synastrie mit einem unknown-time-Partner nutzt denselben Degradationspfad.
- Kein separater Registrierungs- oder Auth-Flow für unknown-time-Nutzerinnen.

---

## Erlaubte Dateien (vollständige Liste)

Nur diese Dateien dürfen in P4 geändert oder neu erstellt werden:

- `src/types.ts` — `BirthData.timeKnown?: boolean`
- `src/utils/birthInputValidation.ts` + zugehöriger Test
- `src/viewmodels/profileViewModel.ts` — Typ-Erweiterung
- `src/utils/fufirePayloadMappers.ts` + zugehöriger Test
- `src/utils/fufireNormalizer.ts` + zugehöriger Test
- `src/__fixtures__/fufire/unknown-time/*.json` — neue Live-Fixtures (REQ-P4-001)
- `src/components/InputForm.tsx`
- `src/components/TimeDependencyNote.tsx` — neue Komponente
- `src/components/TimeDependencyNote.test.tsx` — Test für Props/Versicherungstext
- `src/components/WesternAstrology.tsx`
- `src/components/BaZiDetail.tsx`
- `src/components/TensionNavigator.tsx`
- `src/components/Overview.tsx`
- `src/components/AccountMenu.tsx`
- `src/App.tsx` — nur `onProfileLoad`-Propagation
- `tests/e2e/` — neuer unknown-time-Spec
- `scripts/fufire-live-smoke.mts` — unknown-time-Variante

---

## Traceability-Matrix

| REQ-ID | Akzeptanztest | Impl-Datei(en) | Pass-Evidence |
|---|---|---|---|
| REQ-P4-001 | Live-Fixtures je Endpoint vorhanden + Contract-Verifikationsmatrix | `scripts/fufire-live-smoke.mts`, `src/__fixtures__/fufire/unknown-time/` | 6 Fixture-JSON-Files committiert, Befund-Kommentar |
| REQ-P4-002 | Unit-Tests `birthInputValidation.test.ts` (3 neue Cases) | `src/utils/birthInputValidation.ts`, `src/types.ts` | RED/GREEN-Protokoll, alle bestehenden Tests grün |
| REQ-P4-003 | Mapper-Unit-Tests: 4 Payloads bei `timeKnown:false` enthalten `birth_time_known:false` | `src/utils/fufirePayloadMappers.ts` | RED/GREEN, Synastrie-Regressions-Tests grün |
| REQ-P4-004 | Normalizer-Unit-Tests gegen Fixtures: `ascendant===null`, `pillars.hour===null`, Mond-Grenzlogik | `src/utils/fufireNormalizer.ts` | RED/GREEN, Paar-Modus-Test grün |
| REQ-P4-005 | Komponenten-Test/Snapshot: Versicherungstext vorhanden, verbotene Wörter absent | `src/components/TimeDependencyNote.tsx` | Test-Output, Text-Review |
| REQ-P4-006 | E2E-Spec: Checkbox → Profil rendert → „—" in Aszendent → 3 BaZi-Säulen → Navigator rendert | Alle UI-Komponenten in Scope | `npx playwright test` grün |
| REQ-P4-007 | Profil-Lade-Test: `birth_data.timeKnown:false` → Checkbox vorausgewählt | `src/components/AccountMenu.tsx`, `src/App.tsx` | Test-Output, kein neues Migration-File |

**canvas-link (alle REQs):** docs/canvas/bazi-sprint-p4-unknown-time.canvas.md
