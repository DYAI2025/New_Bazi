# Sprint P4: Unknown Birth Time Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Erst `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md` lesen. Branch-Ritual Master §1.1.
> **ABHÄNGIGKEIT:** P2 Task 4 muss abgeschlossen sein — `docs/contracts/unknown-time.md` im FuFirE-Repo dokumentiert das echte Engine-Verhalten bei `birth_time_known=false`. OHNE diesen Contract NICHT raten: stattdessen die dortigen Explorations-Schritte (Live-Fixtures je Endpoint) zuerst selbst ausführen und den Contract schreiben.

**Goal:** Nutzer ohne bekannte Geburtszeit bekommen ein ehrliches Teilprofil: keine Häuser/Aszendent/Stundensäule als Fakt, klare Missing-Hinweise, alles andere voll nutzbar.

**Architecture:** Ein `timeKnown: boolean` zieht sich durch die ganze Kette: InputForm-Toggle → `birthInputValidation` (Zeit optional wenn false) → `fufirePayloadMappers` (`birth_time_known:false`, Zeit-Feld je Endpoint nach Contract: weglassen oder 12:00-Konvention — DER CONTRACT ENTSCHEIDET, nicht dieser Plan) → Normalizer markiert zeitabhängige Felder als `timeDependent` → UI degradiert pro Sektion. Die Engine kennt das Muster bereits (Landingpage-Horoskop nutzt „assumed 12:00 … indicative only").

**Tech Stack:** bestehende Kette, keine neuen Dependencies.

**Branch:** `feat/sprint-p4-unknown-time`

---

## Task 1: Validation + Typ (TDD)

**Files:** `src/utils/birthInputValidation.ts` (+Test), `src/viewmodels/profileViewModel.ts` (Typ)

**Verhalten:** `ValidatedBirthInput` bekommt `timeKnown: boolean` (default true). Wenn `timeKnown === false`: `birthTime` darf fehlen/leer sein; intern wird `"12:00"` als Rechenzeit gesetzt UND `timeKnown:false` weitergereicht. Wenn `timeKnown === true`: bestehende `HH:mm`-Pflicht unverändert (Regressions-Tests bleiben grün!).

**Failing Tests (vollständig schreiben):** (a) `{timeKnown:false}` ohne birthTime → ok, normalisiert `birthTime:"12:00"`, `timeKnown:false`; (b) `{timeKnown:false, birthTime:"14:30"}` → ok, Zeit bleibt (User kann ungefähre Zeit + Unsicherheit angeben — NEIN: MVP-Entscheidung: timeKnown:false ignoriert eine ggf. eingegebene Zeit NICHT, sie wird verwendet aber als unsicher markiert — Test entsprechend); (c) `{timeKnown:true}` ohne Zeit → Fehler wie bisher.

**Commit:** `feat: timeKnown-Flag in Birth-Validation (12:00-Konvention bei unbekannter Zeit)`

## Task 2: Payload-Mapper nach Contract (TDD)

**Files:** `src/utils/fufirePayloadMappers.ts` (+Test)

**Step 1:** `docs/contracts/unknown-time.md` (FuFirE-Repo) LESEN. Je Endpoint übernehmen, was die Engine erwartet (`birth_time_known:false` + Zeit-Konvention). **Step 2:** Failing Tests je Mapper (chart/western/bazi/wuxing/fusion/bootstrap/daily): bei `timeKnown:false` enthält das Payload `birth_time_known:false` (bzw. die Contract-Variante) — exakte Body-Assertions wie in den bestehenden Mapper-Tests. **Step 3:** Implementierung. **Step 4:** EIN Live-Smoke gegen die echte Engine (Script-Muster `scripts/fufire-live-smoke.mts`): alle Endpoints mit timeKnown:false → 200, Responses als Fixtures `src/__fixtures__/fufire/unknown-time/*.json` committen (Ground Truth für Task 3).

**Commit:** `feat: Payload-Mapper reichen birth_time_known durch (Contract-konform) + Live-Fixtures`

## Task 3: Normalizer-Degradation (TDD gegen die neuen Fixtures)

**Files:** `src/utils/fufireNormalizer.ts` (+Realshapes-Test erweitern)

**Verhalten:** ViewModel bekommt `timeKnown:boolean` + pro betroffener Sektion ehrliche Marker:
- `western.ascendant` → bei timeKnown:false `null` (NICHT der 12:00-Wert als Fakt!) + `western.timeDependentNote` (deutscher Hinweistext, einmal zentral: „Ohne Geburtszeit sind Aszendent und Häuser nicht bestimmbar; Planeten-Positionen gelten für den Tag.")
- `western.houses`/Planeten-`house` → Häuser-Sektion leer + Note; Planeten behalten Zeichen/Grad (tagesstabil genug — Ausnahme MOND: wandert ~13°/Tag → Mondzeichen bekommt `isApproximate:true` und UI-Suffix „(ungefähr)" wenn der 12:00-Mond <6° von einer Zeichengrenze liegt — Grenzlogik testen!)
- `bazi.pillars.hour` → `null` + Note („Stundensäule benötigt die Geburtszeit."); dayMaster bleibt (Tagessäule ist zeitunabhängig… AUSSER nahe Mitternacht: wenn Contract zeigt, dass die Engine das flaggt, übernehmen; sonst Hinweis-Text generisch halten)
- `fusion`/`wuxing`: bleiben, aber `signalLevel`-Badge erhält Zusatz „(ohne Stundensäule)" — Wu-Xing-Vektor ändert sich durch fehlende Hour-Qi-Beiträge; der Contract dokumentiert, ob die Engine das in `calibration.quality:"sparse"` ausdrückt → dann DAS anzeigen.

**Failing Tests:** gegen die unknown-time-Fixtures; jede Degradations-Regel einzeln.

**Commit:** `feat: ehrliche Zeitabhängigkeits-Degradation im ViewModel (Asc/Häuser/Stundensäule/Mond-Näherung)`

## Task 4: UI (InputForm-Toggle + Sektions-Hinweise)

**Files:** `src/components/InputForm.tsx`, `WesternAstrology.tsx`, `BaZiDetail.tsx`, `TensionNavigator.tsx` (Herkunft-Layer-Note), `Overview.tsx`

- InputForm: Checkbox „Geburtszeit unbekannt" neben dem Zeitfeld; aktiviert → Zeitfeld disabled+geleert, Hinweis „Berechnung mit Tagesmitte (12:00); zeitabhängige Teile werden gekennzeichnet."
- Jede betroffene Sektion rendert die Note aus dem ViewModel (EIN wiederverwendbares `<TimeDependencyNote/>`-Snippet, muted, kein Alarm-Stil).
- Overview: Aszendent-Karte zeigt bei null „—" + kleines „Zeit unbekannt"-Tag (klickbar → erklärt warum).

**e2e:** neuer Spec-Fall: Formular mit Checkbox → Profil rendert; Aszendent-Karte zeigt „—"; BaZi-Tab zeigt 3 Säulen + Stundensäulen-Hinweis; Navigator rendert (Fusion funktioniert). Mock braucht ggf. eine unknown-time-Chart-Variante (Mock-Datei erweitern, Muster: PARTNER_CHART-Keying).

**Commit:** `feat: Uhrzeit-unbekannt-Flow in UI mit ehrlicher Sektions-Degradation`

## Task 5: Abschluss
Volle Gates + PR `feat: Unknown Birth Time Mode (ehrliches Teilprofil)` + MISSING-Liste (kein Zeitfenster-/Rectification-Modus; Mond-Näherung heuristisch 6°-Schwelle) + Live-Smoke: echter unknown-time-Durchlauf auf Production inkl. Screenshot der degradierten Sektionen.

## Risiken
- Synastrie + Daily nutzen dieselben Mapper — Regressionstests laufen lassen; Paar-Modus mit einem unknown-time-Partner muss degradieren statt crashen (1 Test).
- KEINE stillen 12:00-Fakten: der Test „ascendant ist null bei timeKnown:false" ist die zentrale Honesty-Assertion dieses Sprints.
