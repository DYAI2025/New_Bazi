# Sprint P5: Content-Layer — Overview-Erklärlayer, Häuser- & BaZi-Vertiefung

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Erst `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md` lesen. Branch-Ritual Master §1.1. Fidelity B: Quell-Karten + Contracts + erzwungene Exploration — Texte werden PORTIERT/KURATIERT, nie vom Executor erfunden.

**Goal:** Jede Overview-Karte öffnet einen Erklär-Layer (Sternzeichen, Mond, Aszendent, BaZi-Tier, Säule, Himmelsstamm, Erdzweig, Element); Häuser- und BaZi-Säulen-Deutungen bekommen Substanz — alles mit Datenanker, nichts generisch.

**Architecture:** Eine zentrale **Content-Registry** (`src/content/registry/`) hält alle kuratierten Texte als typisierte TS-Module (kein CMS, kein Fetch — Build-Time-Content wie `tensionQuestions.ts`). Eine wiederverwendbare `<ExplanationLayer/>`-Komponente (Drawer/Modal im Glass-Card-Stil) rendert Registry-Einträge + die konkreten Profil-Daten des Users (Datenanker!). Texte stammen aus dem Astro-Noctum-Ersatzteillager (bazodiac.space hat sie live eingebunden — Benjamin bestätigt) und werden bei Lücken nach festen Stil-Regeln kuratiert.

**Branch:** `feat/sprint-p5-content-layer`

---

## Task 1: Quell-Exploration (PFLICHT vor jedem Text)

**Quell-Karte (wo die Texte in Astro-Noctum liegen — Executor verifiziert Pfade, Stand kann abweichen):**
```bash
AN=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
# Kandidaten-Suche (genau diese Begriffe):
grep -rln "Widder\|Skorpion" $AN/src --include="*.ts*" | head        # Tierkreis-Texte
grep -rln "Erdzweig\|Himmelsstamm\|hidden stem" $AN/src $AN/packages --include="*.ts*" -i | head
grep -rln "Ratte\|Büffel\|Schwein" $AN/src $AN/packages --include="*.ts*" | head   # Tiere
grep -rln "1. Haus\|erstes Haus\|house.*meaning" $AN/src -i | head   # Häuser
ls $AN/knowledge/bazodiaac-brain/bazodiac_rag_docs/ | head -30        # RAG-Doku als Textquelle
```
**Output dieses Tasks:** `docs/contracts/content-sources.md` — Tabelle: Content-Typ → gefundene Quelldatei(en) → Qualität (vollständig/lückenhaft/fehlt). Für FEHLENDE Typen gilt Kuratierungs-Pflicht nach §Stilregeln (unten). KEIN Text wird „aus dem Kopf" des Executors übernommen, ohne dass er als `curated` markiert ist.

**Stilregeln (BINDEND, in jede Registry-Datei als Kommentar):** Deutsch, Du-Form NUR in Fragen, sonst beschreibend („Der Aszendent Waage zeigt…" nicht „Du bist…"); 60–120 Wörter pro Layer-Text; jede Erklärung endet mit einem konkreten Bezug-Slot (`{anchor}`), den die UI mit dem User-Wert füllt; verboten: Schicksal/Diagnose/Coaching/Heilung; Ton: edel, ruhig, präzise (Konzept-Sprachregeln §11).

## Task 2: Content-Registry-Typen + erste Domäne (TDD)

**Files:** `src/content/registry/types.ts`, `src/content/registry/zodiacSigns.ts` (12), Test `src/content/registry/registry.test.ts`

```ts
// types.ts
export interface ExplanationEntry {
  id: string;             // z.B. "zodiac.gemini", "stem.xin", "branch.hai", "pillar.day", "element.metall", "house.1"
  title: string;          // "Zwillinge"
  symbol: string;         // "♊" / "辛" / "亥"
  short: string;          // 1 Satz für Tooltips/Overview
  long: string;           // 60–120 Wörter, endet mit {anchor}-Slot wo sinnvoll
  source: "astro-noctum" | "curated";
}
```
Tests (für ALLE Domänen wiederverwendbar): Vollständigkeit (12 Zeichen / 10 Stämme / 12 Zweige+Tiere / 5 Elemente / 12 Häuser / 4 Säulen), jede `long` 60–120 Wörter, Anti-Reification-Regex (kein „Du bist", „Schicksal", „musst"), `source` gesetzt. Registry-Domänen-Dateien einzeln committen (Reviewbarkeit): `zodiacSigns.ts`, `stems.ts`, `branches.ts` (Tier+Zweig kombiniert), `elements.ts`, `pillars.ts`, `houses.ts`.

**WICHTIG:** Die chinesischen Tabellen (Stämme/Zweige) MÜSSEN konsistent zu `src/utils/` sein — es existieren dort bereits kanonische `HEAVENLY_STEMS`/`EARTHLY_BRANCHES`-Tabellen (Pinyin/Element/Polarität/Tier, diakritik-tolerant). Registry referenziert deren IDs, dupliziert keine Astro-Logik.

**Commits:** je Domäne `feat(content): Registry <Domäne> (N Einträge, Quelle X)`

## Task 3: `<ExplanationLayer/>` + Overview-Verdrahtung (TDD via e2e)

**Files:** `src/components/ExplanationLayer.tsx`, `src/components/Overview.tsx`

- Drawer (rechts einfahrend, Glass-Card, Esc/Backdrop schließt, `data-testid="explanation-layer"`), Inhalt: symbol groß, title, long-Text mit gefülltem `{anchor}` (z. B. „— in deinem Profil: Sonne 24.1° Zwillinge"), source-Fußnote bei `curated`: „Kuratierte Einordnung".
- Overview: JEDE Karte (Sonne/Mond/Aszendent/4 Säulen/Tagesmeister/dominantes Element) wird klickbar (role=button, focus-visible) → öffnet Layer mit passendem Registry-Eintrag + Anker-Daten aus dem ViewModel. Aszendent bei `null` (P4): Layer erklärt stattdessen, warum er fehlt.
- e2e: Klick auf Sonnen-Karte → Layer mit „Zwillinge" + Anker-Grad; Klick Tagessäule → Layer mit Stamm+Zweig-Erklärung; Esc schließt; KEIN %-Zeichen-Verbot hier (Layer darf Grad/Werte zeigen — Datenanker erwünscht).

**Commit:** `feat: ExplanationLayer + klickbare Overview-Karten mit Datenankern`

## Task 4: Häuser-Vertiefung (B-008 + FR-009)

**Files:** `src/content/registry/houses.ts` (aus Task 2), `src/components/WesternAstrology.tsx`, Normalizer nur falls Felder fehlen

Pro Haus rendert die Häuser-Sektion künftig: (1) Thema (Registry `short`), (2) Zeichen an der Spitze (aus cusps→Zeichen — Helfer existiert via `houseOfLongitude`-Umfeld; wenn nicht: `Math.floor(cuspLon/30)`→WESTERN_ZODIAC), (3) Planeten im Haus (existiert), (4) 2–3 Sätze Interpretation = Registry-`long` des Hauses + EIN zeichen-spezifischer Satz aus einer 12×12-KURZmatrix? — NEIN, YAGNI: MVP = Haus-long + Zeichen-short kombiniert („2. Haus … An der Spitze steht Steinbock: <zeichen.short>"). Volle house×sign-Matrix ist Folge-Iteration (im PR als MISSING listen). (5) P4-Degradation: timeKnown:false → Sektion zeigt nur die Note.
**Klarheits-Regel (B-007-Nachbar):** Aszendent-, Mond- und 1.-Haus-Beschriftungen kommen aus GETRENNTEN Feldern; der P1-Regressionstest bleibt grün.

**Commit:** `feat: Häuser-Sektion mit Thema, Spitzen-Zeichen und substanzieller Deutung`

## Task 5: BaZi-Säulen-Vertiefung (FR-010)

**Files:** `src/components/BaZiDetail.tsx`, Registry `pillars.ts`+`stems.ts`+`branches.ts`

BaZi-Tab pro Säule (Jahr/Monat/Tag/Stunde): Lebensbereich (pillars-Registry: Jahr=Herkunft/Prägung, Monat=Beruf/Eltern, Tag=Selbst/Partnerschaft, Stunde=Kinder/spätes Leben — kuratiert, Quelle prüfen), Stamm mit Element+Polarität+Erklärung (stems-Registry), Zweig mit Tier+Hidden Stems (branches-Registry; Hidden-Stems-LISTE kommt aus den Engine-Daten im ViewModel — verifizieren, welche Felder `bazi.pillars[]` trägt; nur ERKLÄRUNG aus Registry), Tagesmeister-Vertiefung (bestehende A14-Fix-Texte aus P1 wiederverwenden, NICHT duplizieren). Overview behält Kurzform (1 Zeile/Säule), Detail-Tab vertieft — Deep-Link vom Overview-Layer („Im BaZi-Tab vertiefen →").

**Commit:** `feat: BaZi-Säulen-Tiefe (Lebensbereiche, Stamm/Zweig-Erklärungen, Hidden Stems)`

## Task 6: Abschluss
Gates + e2e (alle neuen Interaktionen) + PR `feat: Content-Layer — Erklärlayer, Häuser- und Säulen-Vertiefung` + MISSING-Liste (house×sign-Matrix, Planet-in-Haus-Einzeltexte, Dayun-Erklärungen bis P2/B-012) + Live-Smoke mit Screenshot zweier geöffneter Layer.

## Risiken
- GRÖSSTES RISIKO: Text-Qualität. Der Review-Agent (Master §6) MUSS alle Registry-Texte vollständig lesen (Stilregeln + fachliche Plausibilität). Bei Astro-Noctum-Quelltexten: 1:1 übernehmen schlägt Umformulieren.
- 12+10+12+5+12+4 = 55 Texte à ~90 Wörter — der größte Einzel-Aufwand des Sprints ist Kuratierung, nicht Code. Zeit entsprechend einplanen; notfalls Domänen auf 2 PRs splitten (zodiac+houses zuerst, BaZi-Domänen zweiter PR).
