# Product Vision: BaZi Ehrlichkeits-Sprints P1 + P2

**Feature-Slug:** `bazi-sprint-p1-p2-ehrlichkeit`
**Status:** user-confirmed
**Bestätigt von:** Benjamin Pörsch, 2026-06-11
**Canvas:** [docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md](../canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md)
**PRD:** [docs/prd/bazi-sprint-p1-p2-ehrlichkeit.prd.md](../prd/bazi-sprint-p1-p2-ehrlichkeit.prd.md)
**Erstellt:** 2026-06-11

---

## Vision Statement

**New_Bazi zeigt ausschließlich ehrliche, quellenverankerte Daten.**  
Jede angezeigte Zahl hat einen realen Berechnungsanker — fehlt ein Wert, erscheint ein expliziter Missing-State, nie eine erfundene Zahl. Fehlermeldungen sind handlungsleitend. Alle Texte sind dem Entertainment/Reflexions-Framing treu: keine Coaching-, Therapie- oder Diagnosesprache, keine „Du bist…"-Festlegungen.

---

## Zielnutzerin

Neugierige Erwachsene (25–45), keine tiefen BaZi-Vorkenntnisse. Nutzen New_Bazi wie eine tiefgründigere Horoskop-App — zum Erkunden von Mustern, nicht zur Lebensberatung. Erwarten keine therapeutische oder diagnostische Funktion.

---

## Das Problem, das wir lösen

Die App fabriziert an mehreren Stellen Daten (live verifiziert):
- `coherenceIndex: 75` — hartcodierter Platzhalter erscheint als berechneter Wert
- Byte-identische Tages-Texte für alle Elemente und alle Daten — Engine-Output wird ignoriert
- DST-Fehler als generische 502 — Nutzerin weiß nicht, wie sie es löst
- Coaching/Therapie-Wording — Positionierungswiderspruch
- BFF-Dayun-Stub — implementierte Engine-Funktion als fehlend deklariert

Diese Diskrepanz zwischen angezeigtem Wert und echtem Datenzustand untergräbt das Vertrauen und widerspricht dem Kernversprechen des Produkts.

---

## Kernversprechen (darf nicht gebrochen werden)

> Kein angezeigter Wert ist erfunden. Fehlt ein Datum → Missing-State. Fehlt eine Capability → gar nicht anzeigen.

---

## Erfolgssignale

1. Alle 12 Requirements (REQ-P1-001 bis REQ-P2-004) TDD-grün mit RED/GREEN-Beweis.
2. Gate-Zahlen vorher/nachher: vitest, Playwright, pytest — keine Rückschritte.
3. Live-Smoke auf `newbazi-production.up.railway.app` und `api.fufire.space` nach Deploy bestanden.
4. Keine Coaching/Therapie/Diagnose-Strings in P1-Scope-Dateien.
5. Kein hardkodierter `coherenceIndex`-Default in Codebase.
6. Keine neuen Browserfehler in betroffenen Tabs.

---

## Non-Goals (scharf abgegrenzt)

- Keine neuen Features jenseits P1/P2-Scope
- Keine neuen Dependencies
- Kein UX-Redesign
- P3–P12 (Supabase, Voice-Agents, etc.) sind spätere Sprints — kein Scope-Creep
- Kein DataConfidence-Enum-Layer (Council-Challenge zurückgestellt auf P3+, User-Entscheid 2026-06-11 Option A)

---

## Risiken (aus Canvas §8)

- **Zwei-Repo-Scope**: P1 in New_Bazi, P2 primär in FuFirE — Koordination zweier Railway-Services
- **rtk-Hook-Falle**: `python3` → `uv run python3`; Bash-Kommandos werden umgeschrieben
- **Deploy-Frische-Trap**: `online`-Status zeigt auch alten Build; Frische via Asset-Hash prüfen
- **framer-motion v12 + SVG**: NIEMALS motion-Transforms auf SVG-Elementen

---

## Traceability

- Canvas: `docs/canvas/bazi-sprint-p1-p2-ehrlichkeit.canvas.md` (Status: user-confirmed)
- PRD: `docs/prd/bazi-sprint-p1-p2-ehrlichkeit.prd.md`
- MASTER: `docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md`
- P1-Plan: `docs/plans/2026-06-11-sprint-p1-kritische-fixes.md`
- P2-Plan: `docs/plans/2026-06-11-sprint-p2-engine-track.md`
