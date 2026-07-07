# Sprint P6: WuXing Practical Layer + Design-QA (Dark/Light, Pergament/Gold)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **BINDEND:** Master-Roadmap zuerst lesen. Fidelity B. POSITIONIERUNG: Entertainment/Reflexion — kein Coaching, keine Therapie, keine Gesundheitsclaims (P1/B-001 hat „Coaching" bereits entfernt; dieser Sprint darf es nicht wieder einführen).

**Goal:** Das WuXing-Rad wird praktischer und lebendiger: kuratierte Alltags-Impulse je Element (Bewegung/Umgebung/Ernährung-als-Kultur/Farbe/Raum/Rhythmus), Feng-Shui-Weisheiten als Reflexions-Kontext — plus der Design-Fix B-011 (Dark/Light-Kontraste, Gold-Betonung, Pergament-Partikel).

**Architecture:** Zwei unabhängige Stränge in einem Sprint: (A) Content — `src/content/registry/elementImpulses.ts` (gleiche Registry-Mechanik wie P5, gleiche Tests) gespeist aus einem RECHERCHE-Task mit Quellen-Doku; (B) Design — Token-basierte Kontrast-Korrektur in `src/index.css` (Tailwind-v4-Theme-Tokens) + Partikel-Hintergrund als CSS/SVG (KEINE Canvas-Lib, YAGNI).

**Branch:** `feat/sprint-p6-wuxing-practical`

---

## Strang A — Praktische Impulse + Feng Shui

### Task A1: Recherche mit Quellen-Doku (PFLICHT vor Texten)

Recherchiere je Element 6–10 Impuls-Kandidaten aus den Kategorien Bewegung / Umgebung-Natur / Ernährung-als-Kulturhinweis / Farbe-Raum / Tagesrhythmus / Feng-Shui-Weisheit. Quellen: klassische Fünf-Elemente-Zuordnungen (TCM-Kulturgut, Jahreszeiten/Geschmäcker/Organ-Uhren NUR als kulturelle Tradition referenziert, NIE als Gesundheitsrat), Feng-Shui-Grundlagen (Bagua-Zonen, Element-Zyklen im Raum). Output: `docs/contracts/wuxing-impulse-quellen.md` — pro Impuls: Text-Entwurf, Kategorie, kulturelle Quelle/Tradition, Risiko-Flag (medizinnah? → raus oder umformulieren).
**Sprach-Schablone (BINDEND):** „<Element>-Qualität lässt sich im Alltag einladen: <Impuls>." / weiche Modalität („kann", „lädt ein", „traditionell wird … zugeordnet") / NIE Imperativ-Befehle, NIE „hilft gegen", NIE Organ-/Heilungs-Claims. Beispiele im Zielton: Holz → „Ein Waldspaziergang gibt der Holz-Qualität Raum — Wachstum braucht Grün und Weite." Wasser → „Traditionell wird dem Wasser das Lauwarme zugeordnet: ein ruhiges Glas Wasser als kleine Geste der Tiefe."

### Task A2: Registry + Tests (TDD)

`src/content/registry/elementImpulses.ts`: pro Element 5 finale Impulse `{category, text, tradition?: string}` + 1 Feng-Shui-Weisheit `{text, context}`. Tests (Muster aus P5-Registry): Vollständigkeit 5×(5+1), Wortgrenzen 10–35 Wörter/Impuls, VERBOTS-Regex erweitert: /coaching|therap|diagnos|heil|hilft gegen|musst|solltest unbedingt|gesundheit/i. Commit je nach Größe in 1–2 Schritten.

### Task A3: UI-Einbindung ins Rad

`src/components/WuXingDetail.tsx`: Die Element-Detail-Spalte (rechts vom Rad — dort wo heute Nährungsstrom/Alltagsimpuls/Nährspeisen stehen) bekommt eine neue Sektion „Impulse für den Alltag": die 5 Impulse des AKTIVEN Elements als kleine Karten mit Kategorie-Icon (lucide: TreePine/Droplets/Flame/Mountain/Coins o.ä. je Element-Bezug), darunter die Feng-Shui-Weisheit als abgesetztes Zitat mit Kontext-Zeile. Rotation: täglich 2 von 5 hervorgehoben (deterministisch, `selectQuestion`-Hash-Muster aus `tensionQuestions.ts` wiederverwenden — Modul referenzieren, nicht duplizieren). Bestehende „Nährspeisen"-Sektion: Texte gegen A1-Quellen prüfen, medizinnahe Formulierungen ersetzen.
e2e: aktives Element wechseln → Impulse wechseln; Verbots-Regex über den gerenderten Tab-Text.

**Commit:** `feat(wuxing): Alltags-Impulse + Feng-Shui-Weisheit je Element (kuratiert, quellendokumentiert)`

## Strang B — Design-QA (B-011)

### Task B1: Kontrast-Audit mit Beweis

Browser-Audit beider Themes (Theme-Toggle finden — Header-Icon in PageShell): Screenshots Overview/WuXing/Fusion/Synastrie je Theme; programmatische Kontrast-Messung der kritischen Paare (getComputedStyle → WCAG-Ratio-Formel, kleines Script): WuXing-Rad-Labels auf Dark-BG, Karten-Rahmen auf Light, Gold-Texte auf Pergament. Output: Tabelle Ist-Ratio vs Ziel (Text ≥4.5:1, große Labels ≥3:1) in `docs/qa/design-kontrast-audit.md`. JEDE Korrektur referenziert eine Messung.

### Task B2: Token-Korrekturen

`src/index.css` (Tailwind-v4 `@theme`-Tokens — exakte Token-Namen im Audit notieren): Dark: Rad-Element-Labels + inaktive Knoten aufhellen bis Ziel-Ratio; Gold-Akzent (`--color-gold-*`) Richtung kräftigeres Orange-Gold verschieben (Benjamin: „Orange-Gold deutlicher betonen") — EIN Token, kein Streuwert. Light: Rahmen-Töne abdunkeln (heute zu hell), Pergament-Grundton behalten. KEINE Komponenten-lokalen Farb-Hacks: nur Tokens + wo nötig Klassen auf Token umstellen.

### Task B3: Pergament-Partikel (Light-Mode)

Dezenter Partikel-Hintergrund für Light: CSS-only (mehrschichtige `radial-gradient`-Dots wie im Spannungsnavigator-Testtool-Muster `stageShell:before` — Code dort abschauen: `docs/concept/spannungsnavigator-testtool.html` Z.12) in warmen Gold/Sepia-Tönen, Opazität ≤0.15, `pointer-events:none`, respektiert `prefers-reduced-motion` (statisch ist ok — keine Animation nötig). Auf den App-Hintergrund (PageShell), nicht pro Karte.

### Task B4: Nachweis
Audit-Script erneut → alle Ziel-Ratios erfüllt; Vorher/Nachher-Screenshots beider Themes committen (`docs/qa/screenshots/design-p6/`); e2e-Smoke beide Themes (keine neuen Konsolen-Fehler).

**Commits:** `fix(design): Dark/Light-Kontraste auf WCAG-Ziel (messbasiert)` / `feat(design): Pergament-Partikel im Light-Mode`

### Task B5: Landing-Entzauberung + Minimalismus (User 2026-06-14) — ✅ UMGESETZT (PR `feat/sprint-p6-fe-landing-entzauberung`)
Esoterische/nebulöse Begriffe aus sichtbarer Copy raus; Startseite minimalistischer + auf Bazodiac/Fusion zentriert. Geändert (TDD, Anti-Eso-Test zuerst RED):
- `InputForm.tsx`: Hero „Metaphysisches Portal" → „Bazodiac" + ein Fusion-Satz (West-Astrologie × BaZi → gemeinsames Bild); FuFirE/Server-Hinweis untergeordnet behalten.
- `Overview.tsx`: „Kollationierte Seelensignatur"→„Signatur geladen"; „Seelenpartner"→„Partner"; „Unterbewusstsein, Seele & Intuition"→„Maske, Auftreten & erster Eindruck"; „Vier Säulen des Schicksals"→„Vier Säulen / BaZi".
- `BaZiDetail.tsx`: „Schicksalssäulen"→„Säulen" (2×); „Repräsentiert Ihre Seele … wahres Ich"→„Tagesmeister — dein Tagesstamm, Kern der BaZi-Analyse".
- `Synastry.tsx`: „Beziehungsresonanz"→„Beziehungsvergleich"; „RESONANZ VERGLEICHEN"→„PARTNER VERGLEICHEN"; „Resonanz"→„Übereinstimmung"; „Harmonie-Resonanz"→„Harmonie-Wert".
- `TensionNavigator.tsx`: „Element-Resonanz"→„Element-Abgleich". `PageShell.tsx`: Footer „DIE METAPHYSISCHE MANUFAKTUR" raus → „© 2026 BAZODIAC". `utils/astrology.ts`: „seelische Resonanz"/„Seelenkonstellation"→„elementare Übereinstimmung"/„Element-Konstellation".
- **Lock:** `wordingHonesty.test.ts` um Eso-Blockliste `/seele|metaphysisch|kollationiert|wahres ich|schicksal|resonanz/i` je Komponente erweitert (Scanner ohne `.test.tsx`; `createPortal`/Schwingung/spirituell bewusst NICHT in der Liste — User-Entscheid).
- User-Entscheid Grenzfälle: „Schwingung*" + „spirituell" BLEIBEN; „Resonanz" + „Schicksalssäulen (四柱)" ersetzt.
- Gates: tsc clean · vitest 514 · build · playwright 35/35.
- **OFFEN (Folge):** tiefere Layout-Minimalisierung der Landing (weniger Karten/Dekoration) falls gewünscht; Eso in Registry-Texten (P5) separat, falls erwünscht.

## Abschluss
Gates + PR `feat: WuXing Practical Layer + Design-QA (Kontraste, Gold, Pergament)` + MISSING (vollständige WCAG-AA-Abdeckung aller Seiten = Folge; Feng-Shui-Vertiefung als eigenes Content-Paket) + Live-Smoke beide Themes.

## Risiken
- Medizin-Nähe ist DIE Falle dieses Sprints: Review-Agent liest jeden Impuls gegen die Verbots-Regex UND semantisch (Regex fängt „stärkt die Nieren" nicht — Mensch/Agent muss es).
- Token-Änderungen wirken global: Screenshot-Diff aller Haupttabs Pflicht, nicht nur WuXing.
