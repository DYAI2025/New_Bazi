# Sprint P8: Quiz-Portierung (23/23) + Quiz-Paar-Mechanik

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Master-Roadmap zuerst. Fidelity B: Quell-Karten + Contracts; der Quiz-CONTENT wird portiert, nie erfunden.
> **ABHÄNGIGKEIT:** P3 (Supabase, Tabelle `nb_contribution_events` existiert). **ENTSCHEIDUNGS-GATE E-KINKY** (Master §4): vor Portierung von kinky-01..04 Benjamin fragen — bis zur Antwort werden sie portiert aber hinter einem Feature-Flag `ENABLE_KINKY_QUIZZES=false` versteckt.

**Goal:** Alle 23 Astro-Noctum-Quiz-Definitionen laufen in New_Bazi (UI, Scoring, ContributionEvents → Supabase), und die Partner-Match-Quizzes + Marker-Profile speisen die Paar-Mechanik (Reibung sichtbar / Harmonie spürbar je Achse).

**Architecture:** Die Quiz-DEFINITIONEN sind Daten (typisiertes Schema) — sie werden 1:1 portiert. Die ENGINE darum (Renderer, Scoring, Event-Bau) wird in New_Bazi NEU und schlank gebaut (Astro-Noctum-Implementierung ist auf deren App-Struktur verwoben; nur die pure-Logik-Teile werden übernommen). Events fließen: Quiz-Ende → Marker → (a) Supabase `nb_contribution_events` (Upsert je user×module), (b) AFFINITY_MAP → 12 Sektoren → ersetzt das heutige `quiz_sectors = soulprint_sectors`-Fallback im Daily-Payload, (c) Marker→Achsen-Evidenz für den Navigator (N3-Contract im Spannungsnavigator-Annex).

**Branch-Familie:** `feat/sprint-p8a-quiz-engine`, `feat/sprint-p8b-quiz-content`, `feat/sprint-p8c-quiz-pair` (3 PRs — der Sprint ist zu groß für einen).

---

## Quell-Karte (verifiziert 2026-06-11)

```
AN=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
$AN/packages/shared/src/quizzes/schema.ts            ← QuizDefinition-Typ (ZUERST LESEN)
$AN/packages/shared/src/quizzes/definitions/index.ts ← 23 Definitionen (22 spielbar + conversation-analysis)
$AN/packages/shared/src/quizzes/definitions/*.ts     ← personality, career-dna, aura-colors, krafttier,
   destiny, charme, eq, spotlight, social-role, blumenwesen, energiestein, celebrity-soulmate, party,
   rpg-identity, love-languages, kinky-01..04, partner-match-01..03, conversation-analysis
$AN/src/lib/fusion-ring/quiz-to-event.ts             ← buildEvent() + Marker-Mapper (sp.contribution.v1)
$AN/src/lib/fusion-ring/  (AFFINITY_MAP suchen)      ← Marker→12-Sektoren-Vektoren
$AN/src/lib/fusion-ring/clusters.ts                  ← 4 Cluster (Naturkind/Mentalist/Stratege/Mystiker)
$AN/src/hooks/useFusionRing.ts                       ← Gated-Cluster-Release-Logik (Referenz)
$AN/server.mjs  (POST /api/contribute suchen)        ← Server-Upsert-Muster
```
**Explorations-Pflicht Task 1:** `schema.ts` + 3 repräsentative Definitionen (score-basiert: personality; profil-basiert: krafttier; partner: partner-match-01) + `quiz-to-event.ts` + AFFINITY_MAP VOLLSTÄNDIG lesen und in `docs/contracts/quiz-port-contract.md` festhalten: exaktes Definition-Schema, Event-Schema, Marker-Konventionen, Sektor-Mathe, was conversation-analysis ist (AI-Quiz → braucht es Gemini? dokumentieren, ggf. als letztes/Flag).

## P8a — Quiz-Engine (1. PR)

1. **Schema + Registry**: `src/quizzes/schema.ts` (Port des AN-Typs, TS-strict), `src/quizzes/registry.ts` (importiert Definitionen, exportiert `QUIZ_REGISTRY`, Cluster-Zuordnung aus clusters.ts portiert). TDD: Registry-Vollständigkeits-Test (23 IDs, je Cluster 3–4, Flag-Filter für kinky).
2. **Scoring-Engine** `src/quizzes/scoring.ts` (pure): score-basierte + profil-basierte Auswertung nach Contract; TDD mit den 3 gelesenen Definitionen (konstruierte Antwort-Sets → erwartete Dimension-Scores/Profile — Erwartungswerte aus der AN-Logik ableiten, im Test dokumentieren).
3. **Event-Bau** `src/quizzes/quizToEvent.ts`: Port der Mapper (`sp.contribution.v1`-Shape exakt beibehalten — N2/N3 + Astro-Noctum-Kompatibilität!), `crypto.randomUUID`, TDD je Mapper-Typ.
4. **Sektor-Projektion** `src/quizzes/affinityMap.ts`: AFFINITY_MAP 1:1 portieren (12-Float-Vektoren — NICHT runden/ändern), `eventsToSectors(events) → number[12]`, TDD (Summen, bekannte Keyword-Zeilen wie empathy→S3-dominant).
5. **Server**: `POST /api/me/quiz-result` (hinter requireUserAuth): validiert Event-Shape, Upsert `nb_contribution_events` (user_id×module_id), Antwort = gespeichertes Event + neuer Sektor-Vektor. `GET /api/me/quiz-state`: alle Events + abgeleitete `quiz_sectors` + Cluster-Fortschritt. TDD mit Supabase-Mock (P3-Muster).
6. **Daily-Integration**: `buildDailyPayload`/bootstrap nutzen `quiz_sectors` aus dem Quiz-State wenn vorhanden (eingeloggt), sonst bisheriges Soulprint-Fallback (Kommentar aktualisieren). 1 Test.

## P8b — Quiz-Content + UI (2. PR)

1. **Definitionen portieren**: alle 23 Dateien nach `src/quizzes/definitions/` — mechanisch, aber: Imports auf New_Bazi-Schema, deutsche Texte UNVERÄNDERT, je Datei `// Quelle: Astro-Noctum packages/shared/.../<file>.ts Stand 2026-06-11`. Registry-Test von P8a zieht jetzt echte 23. kinky-01..04 hinter `isKinkyEnabled()`-Flag (env `VITE_ENABLE_KINKY_QUIZZES`).
2. **Quiz-UI**: `src/components/QuizOverlay.tsx` (Modal über aktueller Seite — AN-Muster, aber New_Bazi-Glass-Stil): Fragen-Stepper, Antwort-Typen die das Schema hergibt (Exploration sagt welche: single-choice/scale/…), Ergebnis-Screen (Profil/Dimensionen + „Was fließt ins Fusionsfeld ein"-Transparenz-Zeile: die Top-Marker MIT Namen — Ehrlichkeit), Event-Submit (eingeloggt) bzw. ehrlicher Hinweis „Ohne Konto fließt das Ergebnis nicht in dein Profil ein" (anonym spielbar, Ergebnis sichtbar, kein Fake-Speichern).
3. **Quiz-Tab**: neuer Tab „Quizzes" (PageShell): Cluster-Karten (4) mit Fortschritt (x/4), Quiz-Liste je Cluster, gespielte markiert (aus quiz-state). Cluster-Energy-ANIMATIONEN aus Paket 5 sind NICHT Teil dieses Sprints (MISSING-Liste) — nur Fortschritt.
4. e2e: ein Quiz vollständig durchspielen (Mock-Login-Stub aus P3), Ergebnis + Event-POST assertiert; Flag-Test kinky unsichtbar.

## P8c — Paar-Mechanik (3. PR)

1. **Partner-Quiz-Flow**: Synastrie-Tab erhält Sektion „Gemeinsam vertiefen": partner-match-01..03 als Paar-Quizzes — Modus: BEIDE beantworten nacheinander am selben Gerät (MVP! Remote-Invite = MISSING) → zwei Antwort-Sets → zwei Marker-Profile.
2. **Achsen-Evidenz** `src/quizzes/markerToAxes.ts`: Marker-Domain→Achse-Mapping AUS DEM BINDENDEN ANNEX (`docs/plans/2026-06-11-spannungsnavigator-mvp.md` §Annex Tabelle 4) implementieren + TDD. Output je Person je Achse: Evidenz-Gewicht + Richtung.
3. **Reibung/Harmonie-Karten**: im Paar-Navigator (TensionNavigator pairMode) erhält jede Achse mit Quiz-Evidenz beider Partner ein Badge: entgegengesetzte Leans → „Reibung sichtbar — Wachstumskante" / gleiche → „Harmonie spürbar — gemeinsame Ressource", + 1 Satz mit Datenanker („Eure Antworten zur Nähe-Frage zeigen…" — Template je Achse, 5×2 Texte im Annex-Stil kuratieren, Anti-Reification-Tests). Quiz-Evidenz GEWICHTET nur die Lesart (Cyan-Schicht-Prinzip), überschreibt NIE die Element-Differenzen — Test erzwingt: tensionPair-Ergebnis identisch mit/ohne Evidenz, nur die Badges/Texte ändern sich.
4. conversation-analysis: NUR Contract-Doku (was es braucht: Gespräochs-Transkript + AI) → eigenes MISSING, Implementation in P11-Nähe (Gemini vorhanden).
5. e2e Paar-Flow.

## Abschluss je PR: Gates + Review (Master §6) + Live-Smoke. Gesamt-MISSING: Cluster-Energy-Visuals, Remote-Paar-Invite, conversation-analysis, Premium-Gating.

## Risiken
- AN-Schema könnte React-Komponenten in Definitionen mischen (Exploration klärt) → dann Definitions-DATEN extrahieren, UI-Anteile verwerfen.
- 23 Dateien Content-Review: Stichprobe reicht NICHT bei kinky/partner-match — die liest der Review-Agent vollständig (Ton/Brand).
- `sp.contribution.v1`-Shape ist der Kompatibilitäts-Anker zu Astro-Noctum — Schema-Drift hier bricht spätere Daten-Migration.
