# Sprint P9: Daily-Tension-Hub + Rat der 6 (N2-Ritual-Verzahnung)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** (1) Master-Roadmap, (2) der N2-INTEGRATIONS-CONTRACT im Annex von `docs/plans/2026-06-11-spannungsnavigator-mvp.md` (Schichtenmodell, Cyan-Linse, GEWICHTEN-Regel: Nutzer-Linse verändert NUR die Lesart-Ebene, nie Modell-Daten), (3) `docs/concept/spannungsnavigator-grundregeln.md`.
> **ABHÄNGIGKEITEN:** P2 (Engine liefert `daily_elemental_comparison` + datums-variable Daily-Texte) und P3 (Supabase, Tabelle `nb_daily_reactions`). Ohne P2: Hub trotzdem bauen, Tages-Achsen-Layer zeigt ehrliches MISSING.

**Goal:** Tagespuls und Spannungsnavigator werden EIN täglicher Hub: Aphorismus → Tagesdeutung → Rat-der-6-Wahl („mit welchem Anteil antwortest du heute?") → sichtbare, selbst ausgelöste Cyan-Bewegung auf dem Navigator. Einmal pro Tag, gespeichert, mit Dopamin-Moment.

**Architecture:** Drei-Schichten-Feld nach Contract: Natal (Gold/Blau, statisch, existiert) + Tag (Gold/Blau, aus `daily_elemental_comparison`, P2) + Nutzer-Antwort (CYAN, aus Rat-der-6-Wahl). Der Rat der 6 wird aus Astro-Noctum PORTIERT (Logik + Aphorismen-Mechanik), aber auf New_Bazi-Verhältnisse übersetzt: Figuren kommen aus dem bestehenden ViewModel (kein astro_profiles-Supabase-Join nötig), Aphorismen als Build-Time-Content (KEINE eigene Supabase-Tabelle im MVP — die 21 kuratierten Aphorismen werden als TS-Registry portiert; DB-Pool = Folge-Iteration), Tageswahl in `nb_daily_reactions` (P3-Schema, unique user×date).

**Branch-Familie:** `feat/sprint-p9a-daily-hub` (Layout-Zusammenführung), `feat/sprint-p9b-rat-der-6` (Ritual). 2 PRs.

---

## Quell-Karte

```
AN=/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
$AN/apps/tagespuls_package/packages/voice/src/tagespuls.ts   ← dayModeFromHarmony, intensity, selectAphorism (FNV-Hash, top-5 nach quality)
$AN/apps/tagespuls_package/packages/api/openapi.yaml          ← Phase-1/2-Contract (daily-pulse / daily-interpretation)
$AN/knowledge/bazodiaac-brain/aphorisms/review/*.md           ← 21 schema-valide Aphorismen (Frontmatter: mode_tags, element_affinity, figure_affinity, quality_rating, texts DE/EN)
$AN/server.mjs (Z. ~3058-3380)                                ← Live-Implementierung Rat der 6 (validateCouncil: EXAKT sonne,mond,aszendent,day_master,jahrestier,wuxing_dom)
$AN/supabase-migrations/20260510_*.sql                        ← 1×/Tag-Regel (unique user×pulse_date, 409 ALREADY_DECIDED)
New_Bazi docs/plans/2026-06-11-spannungsnavigator-mvp.md      ← Annex: Figur→Element-Mapping, Cyan-Regeln
```
**Explorations-Pflicht:** tagespuls.ts + 3 Aphorismen-MD vollständig lesen; Contract-Notizen nach `docs/contracts/rat-der-6-port.md`.

## P9a — Daily-Tension-Hub (1. PR)

1. **Tab-Zusammenlegung**: Tab „Tagespuls" wird „Heute" (Hub). Layout (eine Seite, Reihenfolge = Ritual-Dramaturgie): (1) Tages-Kopf (Datum + Tagesnavigation, aus DailyPulse), (2) Aphorismus-Slot (P9b, vorerst Platzhalter-frei: nicht rendern), (3) die DREI Tageskarten West/Ost/Fusion (aus DailyPulse, kompakter), (4) „Impuls des Tages", (5) **der Spannungsnavigator-Ring** (Komponente wird hier EINGEBETTET — `TensionNavigator` bekommt `compact?`-Prop: kleinerer Ring, Herkunft-Link bleibt), (6) Reaktions-/Rat-Bereich (P9b). Der Fusion-Tab BLEIBT (voller Navigator, Natal-Fokus) — der Hub zeigt die TAGES-Sicht.
2. **Tages-Achsen-Layer**: wenn die Daily-Response `daily_elemental_comparison` enthält (P2): `deriveTension(daily_elemental_comparison, dailySignalLevel)` → der Hub-Navigator zeigt die TAGES-Achse (Kicker „TAGES-SPANNUNG · {datum}"); Natal-Achse als gedimmter Zweitbogen (Vergleich sichtbar: „heute zieht es woanders als grundsätzlich"). Ohne Engine-Feld: Hub-Navigator zeigt Natal-Achse + ehrliche Zeile „Tagesfeld: noch nicht verfügbar (Engine-Erweiterung aktiv)" — KEIN Fake.
3. **Fragen-Quelle**: Tagesfrage = `selectQuestion(tagesAchse, tagesLevel, targetDate)` — die Rotation existiert; jetzt mit echter Tages-Achse.
4. e2e: Hub rendert alle Sektionen; Tagesnavigation wechselt Datum UND (mit P2-Mock-Daten) die Achse; Fusion-Tab-Regression.

**Commit-Familie + PR:** `feat: Daily-Tension-Hub — Tagespuls und Navigator auf einer Seite`

## P9b — Rat der 6 (2. PR)

1. **Council-Ableitung** `src/utils/council.ts` (pure, TDD): aus dem ViewModel die EXAKT sechs Figuren bauen: `sonne` (Zeichen), `mond` (Zeichen, P4: isApproximate-Flag durchreichen), `aszendent` (Zeichen | null bei timeKnown:false → Figur wird als „nicht verfügbar" gerendert, NICHT weggelassen — der Rat bleibt sechs Plätze, einer ehrlich leer), `day_master` (Stamm), `jahrestier` (Branch-Tier), `wuxing_dom` (dominantes Element aus distribution). Je Figur: `{key, displayName, signOrElement, element}` — **element via Annex-Mapping** (Stamm→Element-Tabelle aus `src/utils/`-Konstanten; Zeichen→Wu-Xing via Engine `info/wuxing-mapping` — EINMAL fetchen und als Fixture/Konstante einfrieren, Quelle dokumentieren).
2. **Aphorismen-Registry** `src/content/registry/aphorisms.ts`: die 21 AN-Aphorismen portieren (id, text_de, mode_tags, element_affinity, figure_affinity, quality_rating, author/attribution — NUR verbatim aus den MD-Files; Copyright-Felder mitnehmen). `selectAphorism(mode, dateISO, userSeed, activeElement?)`: Port der FNV-Top-5-Logik + **Achsen-Bias aus dem Annex** (element_affinity ∋ aktives Tages-Element bevorzugt — stabile Sortierung, deterministisch, TDD: gleicher Tag→gleicher Aphorismus; Element-Bias nachweisbar).
3. **Modus**: `dayModeFromHarmony` portieren (h<0.45 spannung / <0.5 pulse / sonst trace; intensity-Formel) — Input: der TAGES-Harmoniewert (P2 liefert ihn mit daily_elemental_comparison; sonst Natal-h_calibrated als dokumentierter Fallback). Modus steuert Aphorismus-mode_tags-Filter + eine Ton-Zeile im Hub.
4. **Das Ritual (UI)**: Unter der Tagesfrage: „Mit welchem Anteil antwortest du heute?" → die 6 Figuren als Karten (displayName + signOrElement + Element-Farbe; aszendent ggf. „ohne Geburtszeit nicht bestimmbar", disabled). Wahl → (a) POST `/api/me/daily-reaction` (P3-Tabelle, unique user×date; 409 → UI zeigt die heutige Wahl read-only: „Heute schon geantwortet — dein Anteil: Mond" — 1×/Tag ist das FEATURE), (b) **Cyan-Bewegung**: der Hub-Navigator zeichnet einen CYAN-Bogen von der Figur-Element-Achse zur Tages-Achse + die Tagesfrage wird aus Sicht der gewählten Linse neu gewählt (questionOffset-Mechanik aus tensionReaction) + Texte: „Du hast mit deinem {Figur}-Anteil geantwortet — der {PolX}-Pol bekommt Gewicht in deiner Lesart." **GEWICHTEN-REGEL test-erzwungen**: derive-Ergebnisse (Modell) identisch vor/nach Wahl; nur Lesart-Ebene (Frage, Cyan-Layer, Texte) ändert sich.
5. **Anonym**: ohne Login funktioniert das Ritual session-lokal (React-State, ehrlicher Hinweis „Ohne Konto wird deine Antwort nicht gespeichert") — kein 409-Schutz, akzeptiert.
6. e2e: kompletter Ritual-Durchlauf (Mock + Login-Stub): Figur wählen → Cyan-Element sichtbar (data-testid) → Frage geändert → Zweitwahl am selben Tag blockiert (Mock-409) → Read-only-Zustand.

**PR:** `feat: Rat der 6 — tägliches Antwort-Ritual mit Cyan-Linse (N2)` + MISSING (Phase-2-LLM-Tagesdeutung aus AN nicht portiert — bewusst: New_Bazi bleibt vorerst LLM-frei im Ritual; Aphorismen-DB-Pool/Curator-Workflow; cooldown_days-Ledger).

## Risiken
- DIE ethische Kante: Cyan-Bewegung darf nie wie Modell-Reaktion aussehen. Farbe (Cyan ≠ Gold/Blau), eigene Legende-Zeile („deine Antwort" vs „Modell") und der Gewichten-Regel-Test sind Pflicht — Review-Agent prüft das zuerst.
- Aphorismen-Copyright: attribution_status der 21 MDs mitnehmen; nur `approved`/`review`-Status mit verifizierter Attribution rendern (Filter testen).
- Tab-Umbau berührt viele e2e-Specs (Tagespuls-Specs zeigen auf alten Tab) — Specs mit-migrieren, nicht löschen.
