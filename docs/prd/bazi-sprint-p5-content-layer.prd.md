# PRD: BaZi Sprint P5 — Content-Layer (Overview-Erklärlayer, Häuser- & BaZi-Vertiefung)

**Feature-Slug:** bazi-sprint-p5-content-layer
**Status:** user-confirmed
<!-- Status: user-confirmed -->
**Confirmed by user:** yes — "GO" (2026-06-13, Vision-GO-Gate; PRD+Vision+Canvas v3 confirmed)
**Erstellt:** 2026-06-13
**Canvas-Link:** docs/canvas/bazi-sprint-p5-content-layer.canvas.md (Status: user-confirmed, v2 re-bestätigt 2026-06-13 post-Council)
**Sprint-Plan:** docs/plans/2026-06-11-sprint-p5-content-layer.md
**Master-Roadmap:** docs/plans/2026-06-11-MASTER-fullfeature-roadmap.md

**True-Line-Note (bindend):** „Nichts ist wahr, bevor es läuft." Ein test-grünes Kriterium beweist nur, dass der Test grün ist — nicht, dass das Feature in Produktion wirkt. Jede REQ trägt in der Traceability-Matrix eine `evidence-class` und ein `wired-in-prod?`-Flag; nur `real-boundary-smoke` oder `production-verified` zählt als „läuft". Kein REQ ist „true", solange seine `true-line-status` nicht auf `lebt-in-prod` steht. Hinweis zu Hidden-Stems: Die ursprünglich vom Council behauptete „immer-leer-in-Prod"-Falle wurde durch direkte Code-Re-Verifikation (spec-auditor, 2026-06-13) widerlegt — Hidden-Stems werden auf Branch-Resolution aus der kanonischen `EARTHLY_BRANCHES`-Tabelle bezogen und sind für jede auflösbare reale Antwort nicht-leer (Beleg in REQ-P5-007). Die echte True-Line-Disziplin bleibt: Belege werden gegen reale Artefakte geprüft, nicht gegen vermutete Premissen — genau das hat hier die falsche Premisse korrigiert.

---

## Zusammenfassung

New_Bazi zeigt in der Overview Karten für Sternzeichen, Mond, Aszendent, BaZi-Tier, Säulen, Himmelsstämme, Erdzweige und dominantes Element — aber jede Karte ist eine abgeschlossene Zahl oder ein Label ohne Erklärung. Nutzerinnen ohne BaZi-Vorwissen erhalten keinerlei Einordnung: was „辛 Metall–" bedeutet oder warum das 2. Haus relevant ist, wird nirgends erklärt. Die Häuser-Sektion und der BaZi-Säulen-Tab liefern Rohdaten ohne Substanz. Das widerspricht dem Entertainment/Reflexion-Anspruch der App.

P5 macht jede Overview-Karte klickbar. Ein Klick öffnet einen `<ExplanationLayer/>` (Drawer im Glass-Card-Stil, Esc/Backdrop schließt, `data-testid="explanation-layer"`), der Symbol, Titel und einen 60–120-Wörter-Erklärtext mit konkretem Datenanker zeigt (z. B. „— in deinem Profil: Sonne 24.1° Zwillinge"). Die Texte liegen in einer typengesicherten Build-Time-Content-Registry (`src/content/registry/`, 55 Einträge: 12 Tierkreis, 10 Stämme, 12 Zweige+Tiere, 5 Elemente, 4 Säulen, 12 Häuser) — kein CMS, kein Fetch, dem Muster von `src/content/tensionQuestions.ts` folgend. Texte werden 1:1 aus dem READ-ONLY Astro-Noctum-Lager portiert, wo vorhanden, sonst nach strikten Stilregeln kuratiert (`source:"curated"`) — NIE vom Executor erfunden. Zusätzlich: vertiefte Häuser-Sektion und vertiefter BaZi-Säulen-Tab.

**Council Amendments (bindend, in dieser PRD vollständig auf REQs/NFRs gemappt):**
- **A — Hidden-Stems (Council-Premisse widerlegt, korrigiert 2026-06-13):** Die Council-Behauptung „hiddenStems immer leer in Prod, weil der Normalizer einen nicht-existenten Payload-Key liest" ist FALSCH (vom spec-auditor refutiert und direkt re-verifiziert). Tatsächlich: `fufireNormalizer.ts:458-460` löst den Zweig via `EARTHLY_BRANCHES[branch_index]` bzw. `lookupBranch(zweig|branch)` (BRANCH_BY_NAME aus der kanonischen Tabelle) auf; `src/utils/astrology.ts:30-41` trägt POPULIERTE `hiddenStems` für ALLE 12 Zweige (z. B. Zǐ→["Guǐ Wasser"], Chǒu→["Jǐ Erde","Guǐ Wasser","Xīn Metall"]); `fufireNormalizer.ts:466,492` spreaden den aufgelösten kanonischen Zweig, sodass `branch.hiddenStems || []` die kanonische Liste liefert — `|| []` greift nur für den echt-unauflösbaren defaultBranch (`:442`, `hiddenStems:[]`). Die Live-Fixture `src/__fixtures__/fufire/bazi.json` trägt `branch_index`/`zweig` (Zweig löst auf), und der bestehende Test `fufireNormalizer.realshapes.test.ts:103` beweist bereits `day.hiddenStems.length > 0` gegen diese Live-Fixture; `BaZiDetail.tsx:163` rendert die Liste bereits. → Hidden-Stems funktionieren in Prod; KEIN Phantom-Bug, KEIN Real-Engine-Verify-Gate, KEINE Vertagung der Hidden-Stems-UI. Adressiert in **REQ-P5-007** (auf gültige Disziplin umgewidmet): P5-T5 baut auf den vorhandenen Hidden-Stems-Daten auf, zitiert den bestehenden `realshapes.test.ts:103`-Beleg als Real-Data-Nachweis; der ehrliche Empty-State gilt NUR für den echt-unauflösbaren defaultBranch (kein leerer Container).
- **B — Engagement-Signal:** leichtes `card_click`/`layer_open`-Analytics-Event (kein Drittanbieter, keine PII), in Task 3 verdrahtet, Beta-Smoke-Ziel ≥1 Layer-Open, Owner = **Benjamin** (User-bestätigt 2026-06-13). Adressiert in **REQ-P5-009** (eigene REQ). Code-Read 2026-06-13: kein Analytics-Mechanismus in `src/` vorhanden (`belegt`) → neues, internes Modul nötig.
- **C — Scope:** volle 55 Texte in EINEM PR (User-Entscheidung, Wedge NICHT adoptiert). Split-PR ist reines Zeitdruck-Ventil. Adressiert in **NFR-08** + REQ-P5-010.
- **D — Anti-Reifikation semantisch:** Review-Agent prüft alle 55 Texte gegen verbotene *Bedeutung* (z. B. „prägt dich", „bestimmt dich"), nicht nur Literal-Token-Regex. Damit die semantische Prüfung auditierbar (statt nur Reviewer-Urteil) ist, erhält jeder der 55 Texte ein explizites „reviewed-for-forbidden-MEANING"-Häkchen in einem per-Text-Sign-off-Log (falsifizierendes Artefakt). Adressiert in **NFR-01** + REQ-P5-002.
- **E — Astro-Noctum-Quell-Posture (User-Entscheidung 2026-06-13):** fehlen Quelltexte (auch für ≥2 Domänen), wird KURATIERT statt gestoppt — jede kuratierte Domäne in `content-sources.md` als `kuratiert` geflaggt, jeder Text `source:"curated"`, durchläuft Per-Text-Semantik-Sign-off (NFR-01/D) + Benjamin-PR-Review. KEIN Pause-Stop, KEIN stilles Umlabeln (Kuratierung ist sichtbar geflaggt + menschlich gegengelesen). Adressiert in **REQ-P5-001** + **NFR-06**.

---

## Anforderungen (REQs)

### REQ-P5-001 — Quell-Exploration: content-sources.md als Pflicht-Gate vor jedem Text (Astro-Noctum-Deckung + Quell-Posture, Amendment E)

**Beschreibung:**
Vor JEDEM Registry-Text wird die Astro-Noctum-Quelldeckung verifiziert. Der Executor verifiziert die Kandidaten-Pfade aus dem Plan (READ-ONLY: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum` und `/Users/benjaminpoersch/Projects/Astro-Noctum`) per `grep -rln` — niemals werden Pfade als Premisse angenommen, ohne sie gegen die reale Datei zu prüfen. Output ist `docs/contracts/content-sources.md`: Tabelle Content-Typ → gefundene Quelldatei(en) → Qualität (`vollständig | lückenhaft | fehlt`). Für FEHLENDE Typen gilt Kuratierungs-Pflicht (`source:"curated"`); kein Text wird „aus dem Kopf" übernommen, ohne als `curated` markiert zu sein.

**Quell-Posture (Amendment E, User-Entscheidung 2026-06-13, bindend):** Fehlen Quelltexte (auch für ≥2 Domänen), wird kuratiert, NICHT gestoppt. Jede kuratierte Domäne ist in `content-sources.md` als `kuratiert` ausgewiesen, jeder Text trägt `source:"curated"`, durchläuft den Per-Text-Semantik-Sign-off (NFR-01/D) und wird von Benjamin im PR gegengelesen. Der Schutz gegen „aus dem Kopf erfinden" ist Flag + Semantik-Review + menschliche PR-Abnahme — kein Pause-Stop.

**Gate-Charakter:** Task 1 ist Hard-Gate vor Task 2 (REQ-P5-002) und allen Texten. Kein Registry-Text-Commit vor committetem `content-sources.md`.

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** die READ-ONLY Astro-Noctum-Repos, **When** der Executor die 6 Domänen durchsucht, **Then** existiert `docs/contracts/content-sources.md` mit einer Zeile pro Content-Typ (zodiac, stems, branches, elements, pillars, houses) mit Spalten Content-Typ → Quelldatei(en) → Qualität. — *Test: Datei-Existenz + Struktur-Check (Doc-Gate, im PR-Review verifiziert).*
- [ ] **Given** ein gefundener Quelltext, **When** er portiert wird, **Then** ist sein verifizierter `grep`-Pfad in `content-sources.md` notiert und der Registry-Eintrag trägt `source:"astro-noctum"`. — *Test: registry.test.ts prüft `source`-Wert; Pfad-Beleg im Doc.*
- [ ] **Given** ein Content-Typ ohne Quelltext, **When** kuratiert wird, **Then** ist er in `content-sources.md` als `fehlt`/`lückenhaft` geführt UND der Eintrag trägt `source:"curated"`. — *Test: registry.test.ts (`source` gesetzt) + Doc-Konsistenz.*
- [ ] **Given** fehlende Quelltexte (eine oder mehrere Domänen), **When** Task 1 das feststellt, **Then** wird jede betroffene Domäne in `content-sources.md` als `kuratiert` markiert, jeder kuratierte Text trägt `source:"curated"` + einen Per-Text-Semantik-Sign-off-Eintrag (NFR-01/D), und Benjamin reviewed alle kuratierten Texte im PR. — *Test (falsifizierend): registry.test.ts prüft `source`-Wert; Sign-off-Log-Vollständigkeit (1 Eintrag je kuratiertem Text) als Doc-Gate; Reviewer falsifiziert durch Abgleich `content-sources.md` `fehlt/kuratiert`-Count gegen das Sign-off-Log.*
- [ ] **Given** kein committetes `content-sources.md`, **When** ein Registry-Text-Commit erfolgt, **Then** ist das ein Prozess-Verstoß (Gate verletzt). — *Test: PR-Review-Gate (Commit-Reihenfolge nachweisbar).*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Karten sind abgeschlossene Zahlen/Labels ohne Erklärung; App ergibt nur Sinn, wenn man die Symbolsysteme bereits kennt"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Texte stammen aus Astro-Noctum (READ-ONLY) und werden bei Lücken kuratiert (source:curated) — nie erfunden"
- canvas-success-signal: "docs/contracts/content-sources.md existiert (Content-Typ → Quelldatei → Qualität)"
- canvas-risk-status: "aligned — fehlende Domänen werden geflaggt kuratiert (source:curated) + semantisch gegengelesen + Benjamin-PR-reviewed (User-Posture 2026-06-13); Risiko durch Flag+Review adressiert, nicht durch Stop"

---

### REQ-P5-002 — Content-Registry: Typen + 6 Domänen-Dateien (55 Einträge, TDD)

**Beschreibung:**
Build-Time-Content-Registry unter `src/content/registry/` nach dem Muster von `src/content/tensionQuestions.ts` (kein CMS, kein Fetch, keine Laufzeit-Abhängigkeit). `types.ts` definiert das `ExplanationEntry`-Interface:

```ts
export interface ExplanationEntry {
  id: string;       // "zodiac.gemini", "stem.xin", "branch.hai", "pillar.day", "element.metall", "house.1"
  title: string;    // "Zwillinge"
  symbol: string;   // "♊" / "辛" / "亥"
  short: string;    // 1 Satz für Tooltips/Overview
  long: string;     // 60–120 Wörter, endet mit {anchor}-Slot wo sinnvoll
  source: "astro-noctum" | "curated";
}
```

Sechs Domänen-Dateien, einzeln committiert (Reviewbarkeit): `zodiacSigns.ts` (12), `stems.ts` (10), `branches.ts` (12, Tier+Zweig kombiniert), `elements.ts` (5), `pillars.ts` (4), `houses.ts` (12) = **55 Einträge gesamt**. `registry.test.ts` ist domänenübergreifend wiederverwendbar.

Der Review-Agent (Master §6) liest **alle 55 Texte vollständig** (Stilregeln + fachliche Plausibilität). Amendment D: semantische Anti-Reifikations-Prüfung gegen verbotene Bedeutung, nicht nur Literal-Token (Detail in NFR-01).

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** die 6 Domänen-Dateien, **When** `registry.test.ts` läuft, **Then** ist die Vollständigkeit bestätigt: 12 + 10 + 12 + 5 + 4 + 12 = 55 Einträge. — *Test: `registry.test.ts` Count-Assertion je Domäne.*
- [ ] **Given** jeder Eintrag, **When** `long` geprüft wird, **Then** liegt die Wortanzahl im Bereich 60–120 (inkl. Grenzfälle 60 und 120). — *Test: `registry.test.ts` Wortanzahl-Bound; Grenzfälle 59/60/120/121.*
- [ ] **Given** jeder Eintrag, **When** die Anti-Reifikations-Regex läuft, **Then** schlägt sie für keinen `long`/`short` an (kein „Du bist", „Schicksal", „musst" — Literal-Token). — *Test: `registry.test.ts` Regex (NFR-01).*
- [ ] **Given** jeder Eintrag, **When** `source` geprüft wird, **Then** ist `source` ∈ `{"astro-noctum","curated"}` gesetzt (nie undefined). — *Test: `registry.test.ts` source-Assertion.*
- [ ] **Given** ein neuer Domänen-Test, **When** er geschrieben wird, **Then** liegt ein RED-Beleg (failing) vor der Implementierung und ein GREEN-Beleg danach vor. — *Test: RED/GREEN-Protokoll im Abschlussbericht.*
- [ ] **Given** jeder Layer-Text mit einem `{anchor}`-Slot, **When** der Layer mit einem realen Profil gerendert wird, **Then** wird der Slot mit einem echten Profilwert befüllt (positiver Anker-Präsenz-Nachweis — Leere/Generik wird mechanisch gefangen, nicht nur über die Wortzahl-Schranke). — *Test: Unit/e2e — Anker-Slot rendert einen nicht-leeren realen Profilwert (kein `{anchor}`-Literal, kein Platzhalter).* — Härtung gegen „Textbuch-Wand".
- [ ] **Given** alle 55 Texte, **When** der Review-Agent die semantische Anti-Reifikations-Prüfung (Amendment D) durchführt, **Then** existiert ein per-Text-Sign-off-Log mit einem expliziten „reviewed-for-forbidden-MEANING"-Häkchen pro Text. — *Test: Doc-Gate — 55 Häkchen, jeder Text einzeln quittiert (auditierbar, nicht nur Reviewer-Pauschalurteil).*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Karten sind abgeschlossene Zahlen/Labels ohne Erklärung"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "55 Einträge in typengesicherter Build-Time-Registry — kein CMS, kein Fetch, kein Laufzeit-Risiko"
- canvas-success-signal: "registry.test.ts grün: 55 Einträge vollständig, jede long 60–120 Wörter, source gesetzt, Anti-Reification-Regex schlägt nicht an"
- canvas-risk-status: "value-risk — Text-Qualität ist GRÖSSTES RISIKO; aligned wenn Review-Agent alle 55 gelesen hat"

---

### REQ-P5-003 — Chinesische-Tabellen-Konsistenz: Registry referenziert kanonische src/utils-Tabellen (keine Astro-Logik-Duplikation)

**Beschreibung:**
Die chinesischen Tabellen (Stämme/Zweige) in `stems.ts`/`branches.ts` MÜSSEN konsistent zu den kanonischen `HEAVENLY_STEMS`/`EARTHLY_BRANCHES` in `src/utils/` sein. Code-Read 2026-06-13 (`belegt`): diese Tabellen liegen in `src/utils/astrology.ts` (und werden von `fufireNormalizer.ts` referenziert), sind Pinyin/Element/Polarität/Tier-tragend und diakritik-tolerant. Die Registry **referenziert deren IDs** und dupliziert keine Astro-Logik — Pinyin/Element/Polarität/Tier werden nicht neu in der Registry geschrieben, sondern müssen mit der kanonischen Tabelle übereinstimmen.

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** `stems.ts`/`branches.ts`, **When** die `stem.*`/`branch.*`-IDs gegen die kanonischen `HEAVENLY_STEMS`/`EARTHLY_BRANCHES` (`src/utils/astrology.ts`) geprüft werden, **Then** erscheint jeder kanonische Pinyin (diakritik-normalisiert) als ID **in kanonischer Reihenfolge**. — *Test (falsifizierend, IMPLEMENTIERT): `registry.test.ts` importiert die kanonischen Tabellen und assertet ID-Menge + Reihenfolge; ein fehlender/falsch geordneter Eintrag lässt den Test fehlschlagen.*
- [ ] **Given** der Registry-Typ `ExplanationEntry` (`id,title,symbol,short,long,source`), **When** auf duplizierte Astro-Logik geprüft wird, **Then** trägt die Registry **kein** Element-/Polaritäts-/Tier-/Pinyin-Datenfeld — diese Werte stammen zur Render-Zeit aus dem ViewModel (kanonischer Normalizer), werden also NICHT in der Registry dupliziert. *Konsequenz (korrigiert nach Gate D): es gibt keinen Element/Polarität/Tier-Wert in der Registry, der gegen `HEAVENLY_STEMS` „driften" könnte; die ID+Reihenfolge-Assertion ist daher die notwendige UND hinreichende Konsistenz-Absicherung (die zuvor formulierte Wert-Vergleichs-AC beschrieb einen Test für Felder, die es bewusst nicht gibt).* — *Beleg: `ExplanationEntry`-Typ in `src/content/registry/types.ts`.*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "BaZi-Säulen liefern Rohdaten ohne Substanz; Symbolik ohne Einordnung"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Registry referenziert kanonische Tabellen, dupliziert keine Astro-Logik (Konsistenz statt Drift)"
- canvas-success-signal: "Chinesische Tabellen konsistent mit src/utils/: Pinyin/Element/Polarität/Tier stimmen überein, keine duplizierten Felder"
- canvas-risk-status: "aligned — Konsistenz test-erzwungen gegen src/utils/astrology.ts"

---

### REQ-P5-004 — ExplanationLayer + klickbare Overview-Karten mit Datenanker (TDD via e2e)

**Beschreibung:**
Neue Komponente `src/components/ExplanationLayer.tsx`: Drawer (rechts einfahrend, Glass-Card-Stil, schließt per Esc UND Backdrop-Klick, `data-testid="explanation-layer"`). Inhalt: Symbol groß, Titel, `long`-Text mit gefülltem `{anchor}`-Slot (z. B. „— in deinem Profil: Sonne 24.1° Zwillinge"), bei `source:"curated"` Fußnote „Kuratierte Einordnung".

`src/components/Overview.tsx` (modifiziert): JEDE Karte (Sonne/Mond/Aszendent/4 Säulen/Tagesmeister/dominantes Element) wird klickbar (`role="button"`, `focus-visible`) → öffnet Layer mit passendem Registry-Eintrag + Anker-Daten aus dem ViewModel. Der Layer darf Grad/Werte zeigen (Datenanker erwünscht — kein %/Zahl-Verbot hier).

**P4-Integration (Aszendent null):** Bei `viewModel.western.ascendant === null` (response-driven, P4) öffnet der Layer trotzdem und erklärt, warum der Aszendent fehlt — kein Fehler, kein leeres Rendering. Der e2e-Test für diesen Fall setzt eine P4-`unknown-time`-Fixture voraus (dokumentierte e2e-Abhängigkeit, kein Blocker für die Komponente).

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** die gerenderte Overview, **When** die Nutzerin auf die Sonnen-Karte klickt, **Then** öffnet der Layer mit Titel „Zwillinge" und Anker-Grad (z. B. „Sonne 24.1° Zwillinge"). — *Test: e2e (Playwright) `tests/e2e/`.*
- [ ] **Given** ein geöffneter Layer, **When** Esc gedrückt wird, **Then** schließt der Layer. — *Test: e2e.*
- [ ] **Given** ein geöffneter Layer, **When** auf den Backdrop geklickt wird, **Then** schließt der Layer. — *Test: e2e.*
- [ ] **Given** die Overview, **When** der Layer offen ist, **Then** ist `data-testid="explanation-layer"` im DOM präsent. — *Test: e2e Selektor.*
- [ ] **Given** `western.ascendant === null` (P4-Fixture), **When** auf die Aszendent-Karte geklickt wird, **Then** zeigt der Layer eine „Aszendent nicht berechenbar"-Erklärung statt eines Fehlers oder leeren Inhalts. — *Test: e2e gegen P4 unknown-time-Fixture.*
- [ ] **Given** ein `curated`-Eintrag, **When** sein Layer geöffnet wird, **Then** erscheint die Fußnote „Kuratierte Einordnung". — *Test: e2e/Unit.*
- [ ] **Given** eine Karte, **When** sie per Tastatur fokussiert wird, **Then** ist sie `role="button"` und `focus-visible`-sichtbar (Zugänglichkeit). — *Test: e2e/Unit Accessibility-Check.*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Karten sind abgeschlossene Zahlen/Labels ohne Erklärung"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Jede Overview-Karte klickbar → Erklär-Layer mit Symbol, Titel, 60–120-Wörter-Text + konkretem Datenanker"
- canvas-success-signal: "e2e grün: Sonnen-Karte öffnet Zwillinge-Text+Anker; Esc schließt; data-testid präsent; Aszendent-null zeigt Erklärung statt Fehler"
- canvas-risk-status: "aligned — P4-Abhängigkeit (Aszendent null) dokumentiert, kein Blocker"

---

### REQ-P5-005 — Häuser-Vertiefung: Thema, Spitzen-Zeichen, substanzielle Deutung (B-008 + FR-009)

**Beschreibung:**
`src/components/WesternAstrology.tsx` rendert pro Haus künftig: (1) Thema (Registry `house.N.short`), (2) Zeichen an der Spitze (aus cusps → Zeichen via `houseOfLongitude`-Umfeld; Fallback `Math.floor(cuspLon/30)` → WESTERN_ZODIAC), (3) Planeten im Haus (existiert bereits), (4) 2–3 Sätze Interpretation = Registry-`house.N.long` + EIN zeichen-spezifischer Satz aus `zodiac.<sign>.short` kombiniert (z. B. „2. Haus … An der Spitze steht Steinbock: <zeichen.short>"). Volle 12×12-house×sign-Matrix ist **Non-Goal** (im PR als MISSING listen). (5) P4-Degradation: `timeKnown:false` → Sektion zeigt nur die `<TimeDependencyNote/>`.

**Klarheits-Regel (B-007-Nachbar, bindend):** Aszendent-, Mond- und 1.-Haus-Beschriftungen kommen aus GETRENNTEN Feldern — der P1-Regressionstest bleibt grün (kein Vermischen der Labels).

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** ein Profil mit Häuserdaten, **When** die Häuser-Sektion rendert, **Then** zeigt jedes Haus Thema (short), Spitzen-Zeichen, Planeten im Haus und kombinierte Interpretation (house.long + zeichen.short). — *Test: e2e/Komponenten-Test, Screenshot im PR.*
- [ ] **Given** `timeKnown:false`, **When** die Häuser-Sektion rendert, **Then** zeigt sie nur die `<TimeDependencyNote/>` statt erfundener Häuser. — *Test: e2e gegen P4-Fixture.*
- [ ] **Given** Aszendent-, Mond- und 1.-Haus-Labels, **When** der P1-Regressionstest läuft, **Then** stammen sie aus getrennten Feldern und der Test bleibt grün. — *Test: P1-Regressionstest (bestehend) bleibt grün.*
- [ ] **Given** der PR, **When** auf Vollständigkeit geprüft wird, **Then** ist die fehlende house×sign-Matrix explizit als MISSING gelistet. — *Test: PR-MISSING-Liste (Doc-Gate).*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Häuser-Sektion ist eine unkommentierte Liste von Zeichen und Planeten ohne Substanz"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Häuser-Sektion erhält Substanz: Thema, Spitzen-Zeichen und kombinierte Interpretation pro Haus"
- canvas-success-signal: "Häuser-Sektion mit substanziellen Deutungen live — Screenshot/Smoke im PR"
- canvas-risk-status: "aligned — house×sign-Matrix als Non-Goal/MISSING geführt, kein stiller Scope-Creep"

---

### REQ-P5-006 — BaZi-Säulen-Vertiefung: Lebensbereiche, Stamm-/Zweig-Erklärungen (FR-010)

**Beschreibung:**
`src/components/BaZiDetail.tsx` rendert pro Säule (Jahr/Monat/Tag/Stunde): Lebensbereich (`pillars.ts`: Jahr=Herkunft/Prägung, Monat=Beruf/Eltern, Tag=Selbst/Partnerschaft, Stunde=Kinder/spätes Leben — kuratiert, Quelle in Task 1 geprüft), Stamm mit Element+Polarität+Erklärung (`stems.ts`), Zweig mit Tier+Erklärung (`branches.ts`), Tagesmeister-Vertiefung (bestehende A14-Fix-Texte aus P1 **wiederverwenden, NICHT duplizieren**). Overview behält die Kurzform (1 Zeile/Säule); der Detail-Tab vertieft. Deep-Link vom Overview-Layer („Im BaZi-Tab vertiefen →").

**Hidden-Stems (funktioniert bereits, KEINE Sperre):** Die Hidden-Stems-Liste wird auf Branch-Resolution aus der kanonischen `EARTHLY_BRANCHES`-Tabelle bezogen (`fufireNormalizer.ts:458-460,466,492` + `astrology.ts:30-41`) und ist für jede auflösbare reale Antwort nicht-leer — bereits bewiesen durch `fufireNormalizer.realshapes.test.ts:103` (`day.hiddenStems.length > 0` gegen Live-Fixture) und bereits gerendert durch `BaZiDetail.tsx:163`. Es gibt KEINE Sperre, KEIN Real-Engine-Gate und KEINE Vertagung: Diese REQ liefert die Stamm-/Zweig-/Säulen-Erklärungen UND verwendet die vorhandenen Hidden-Stems-Daten. Der ehrliche Empty-State (kein leerer Container) gilt NUR für den echt-unauflösbaren defaultBranch (`fufireNormalizer.ts:442`, `hiddenStems:[]`). Stunden-Säule degradiert bei `timeKnown:false` (P4) wie in P4 spezifiziert.

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** ein Profil, **When** der BaZi-Tab rendert, **Then** zeigt jede Säule Lebensbereich, Stamm (Element+Polarität+Erklärung) und Zweig (Tier+Erklärung) aus der Registry. — *Test: e2e (Playwright)/Screenshot.*
- [ ] **Given** ein geöffneter Overview-Layer für die Tagessäule, **When** auf „Im BaZi-Tab vertiefen →" geklickt wird, **Then** öffnet der BaZi-Tab mit der vertieften Säulen-Ansicht. — *Test: e2e Deep-Link.*
- [ ] **Given** die Tagesmeister-Vertiefung, **When** sie rendert, **Then** verwendet sie die bestehenden A14-P1-Texte wieder (kein Duplikat). — *Test: Code-Review/Unit — keine duplizierte Text-Konstante.*
- [ ] **Given** `timeKnown:false`, **When** der BaZi-Tab rendert, **Then** zeigt die Stundensäule die P4-Degradation (kein erfundener Stunden-Stamm/Zweig). — *Test: e2e gegen P4-Fixture.*
- [ ] **Given** ein auflösbarer Zweig (Normalfall), **When** der BaZi-Tab rendert, **Then** zeigt der Zweig seine nicht-leere Hidden-Stems-Liste aus der kanonischen Tabelle (Werte aus ViewModel/Engine, Erklärung aus Registry) — wie durch `realshapes.test.ts:103` belegt und `BaZiDetail.tsx:163` gerendert. — *Test: e2e/Unit — nicht-leere Hidden-Stems-Liste für auflösbaren Zweig; bestehende `realshapes.test.ts:103`-Assertion bleibt grün und wird zitiert.*
- [ ] **Given** ein echt-unauflösbarer Zweig (defaultBranch, `hiddenStems:[]`), **When** der BaZi-Tab rendert, **Then** wird KEIN leerer Hidden-Stems-Container gerendert (ehrlicher Empty-State — gilt NUR für diesen Randfall, nicht generell). — *Test: e2e — Abwesenheit eines leeren Containers nur im defaultBranch-Pfad.*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "BaZi-Säulen-Ansicht liefert Rohdaten, keine Substanz: was ein Himmelsstamm im Kontext der Geburt bedeutet, wird nirgends erklärt"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "BaZi-Säulen-Tab erhält Tiefe: Lebensbereich, Stamm-Erklärung mit Element/Polarität, Zweig-Erklärung mit Tier"
- canvas-success-signal: "BaZi-Säulen-Tab mit Lebensbereichen + Stamm/Zweig-Erklärungen — Playwright-Output/Screenshot"
- canvas-risk-status: "aligned — Hidden-Stems funktionieren bereits (realshapes.test.ts:103 belegt, BaZiDetail.tsx:163 rendert); keine Sperre/Vertagung; A14-Texte wiederverwendet"

---

### REQ-P5-007 — Hidden-Stems aus kanonischer Tabelle (Council-Premisse widerlegt; ehrlicher Empty-State nur für unauflösbaren Zweig)

**Beschreibung:**
**Korrektur einer falschen Council-Premisse (spec-auditor refutiert + direkt re-verifiziert, 2026-06-13):** Die ursprüngliche Behauptung dieser REQ — „`fufireNormalizer.ts` liest `branch.hiddenStems || []` aus einem Payload ohne den Key → in Prod für jeden Nutzer leer" — ist FALSCH und wird hiermit zurückgenommen. Code-Re-Verifikation:
- `fufireNormalizer.ts:458-460` löst den Zweig auf via `EARTHLY_BRANCHES[branch_index]` bzw. `lookupBranch(zweig|branch)` (`BRANCH_BY_NAME` aus der kanonischen Tabelle gebaut).
- `src/utils/astrology.ts:30-41` — `EARTHLY_BRANCHES` trägt POPULIERTE `hiddenStems` für ALLE 12 Zweige (z. B. Zǐ→["Guǐ Wasser"], Chǒu→["Jǐ Erde","Guǐ Wasser","Xīn Metall"]).
- `fufireNormalizer.ts:466` und `:492` spreaden den AUFGELÖSTEN kanonischen Zweig; `branch.hiddenStems || []` liefert damit die kanonische Liste. `|| []` greift NUR für den echt-unauflösbaren defaultBranch (`:442`, `hiddenStems:[]`).
- Die Live-Fixture `src/__fixtures__/fufire/bazi.json` trägt `branch_index` und `zweig` (die echte Engine liefert Branch-Identifier → Zweig löst auf).
- Der bestehende Test `fufireNormalizer.realshapes.test.ts:103` assertet bereits `day.hiddenStems.length > 0` gegen genau diese Live-Fixture.
- `BaZiDetail.tsx:163` rendert `pillar.hiddenStems.map(...)` bereits.

**Schlussfolgerung:** Hidden-Stems funktionieren bereits in Prod. Es gibt KEINEN Phantom-Empty-Bug, KEIN „Real-Engine-Verify-or-Defer-Gate", KEINE MISSING-Pflicht und KEINE Vertagung der Hidden-Stems-UI.

**Gültige Disziplin (umgewidmet):** P5-T5 (REQ-P5-006) baut auf den vorhandenen Hidden-Stems-Daten auf und behält/zitiert die bestehende `realshapes.test.ts:103`-Assertion als Real-Data-Nachweis (real-boundary-grade: Test gegen Live-Fixture mit echten Branch-Identifiern). Der ehrliche Empty-State (kein leerer Container) gilt AUSSCHLIESSLICH für den echt-unauflösbaren defaultBranch-Pfad (`fufireNormalizer.ts:442`). Kein Befund wird als Assumption geforwardet — diese REQ dokumentiert eine gegen reale Artefakte verifizierte Tatsache.

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** ein auflösbarer Zweig (Normalfall, Branch-Identifier vorhanden), **When** `pillars[].hiddenStems` gelesen wird, **Then** ist die Liste nicht-leer und stammt aus der kanonischen `EARTHLY_BRANCHES`-Tabelle. — *Test: bestehende `fufireNormalizer.realshapes.test.ts:103`-Assertion (`day.hiddenStems.length > 0` gegen Live-Fixture) bleibt grün und wird als Beleg zitiert.*
- [ ] **Given** Hidden-Stems gerendert werden, **When** der Zweig auflösbar ist, **Then** kommen die Werte aus dem ViewModel/der Engine (kanonische Tabelle) und nur die ERKLÄRUNG aus der Registry. — *Test: e2e/Unit — Werte aus ViewModel, Text aus Registry; `BaZiDetail.tsx:163` rendert die Liste.*
- [ ] **Given** ein echt-unauflösbarer Zweig (defaultBranch, `hiddenStems:[]`), **When** die UI rendert, **Then** wird KEIN leerer Hidden-Stems-Container gezeigt (ehrlicher Empty-State — NUR dieser Randfall). — *Test (falsifizierend): Unit gegen `hiddenStems:[]`-defaultBranch-Pfad + e2e-Abwesenheit eines leeren Containers nur in diesem Fall.*
- [ ] **Given** die Hidden-Stems-Belege, **When** ihre `evidence-class` geprüft wird, **Then** zählt der bestehende Live-Fixture-Test (`realshapes.test.ts:103`) als real-boundary-grade Beleg (Test gegen reale Branch-Identifier-Shape), nicht als Phantom-Bug-Gate. — *Test: True-Line-Status-Spalte in der Matrix verweist auf `realshapes.test.ts:103`.*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "BaZi-Säulen-Symbolik ohne Einordnung; Hidden-Stems-Liste ohne Erklärung (NICHT: leer in Prod — Council-Premisse widerlegt)"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Hidden-Stems aus kanonischer Tabelle (nicht-leer für auflösbaren Zweig, bereits belegt+gerendert); ehrlicher Empty-State nur für unauflösbaren defaultBranch"
- canvas-success-signal: "realshapes.test.ts:103 (day.hiddenStems.length > 0 gegen Live-Fixture) grün + BaZiDetail.tsx:163 rendert die Liste; kein leerer Container im defaultBranch-Pfad"
- canvas-risk-status: "aligned — Premisse korrigiert; Hidden-Stems funktionieren, keine Sperre; nur defaultBranch-Empty-State test-erzwungen"

---

### REQ-P5-008 — Honesty/Empty-State: fehlende Daten → null/ehrlicher Empty-State, nie 0 oder erfundener Default

**Beschreibung:**
Jeder Daten-getriebene Layer-/Sektions-Pfad respektiert die App-Invariante: fehlende Daten erscheinen als `null`/expliziter Empty-State, NIE als `0`, leerer-aber-gültig-wirkender Wert oder erfundener Default. Konkret für P5: Aszendent-`null` (P4) → Layer zeigt Erklärung statt Fehler/leer (REQ-P5-004); `timeKnown:false` → Häuser/Stundensäule degradieren ehrlich (REQ-P5-005/006); leere Hidden-Stems → kein Rendering (REQ-P5-007); fehlende Registry-Daten → der Layer rendert nicht mit Platzhalter-Müll, sondern unterlässt das Öffnen oder zeigt ehrlichen Empty-State.

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** ein `null`-Profilwert (z. B. Aszendent), **When** der zugehörige Layer/Sektion rendert, **Then** erscheint ein ehrlicher Empty-/Erklär-State, kein `0`, kein erfundener Default. — *Test: e2e/Unit gegen P4-null-Fixture.*
- [ ] **Given** ein fehlender Registry-Eintrag für eine Karte, **When** geklickt wird, **Then** rendert kein Platzhalter-Müll (definiertes ehrliches Verhalten). — *Test: Unit/e2e Negativ-Fall.*
- [ ] **Given** der Datenanker `{anchor}`, **When** der Profilwert fehlt, **Then** wird der Anker nicht mit erfundenem Wert befüllt (kein Fake-Grad). — *Test: Unit Anker-Befüllung.*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Missing-Daten dürfen nicht als 0/erfundener Default erscheinen (App-Ehrlichkeitsversprechen aus P1/P2)"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Datenanker zeigt echte Profilwerte; fehlende Daten ehrlich als null/Empty-State, nie erfunden"
- canvas-success-signal: "Aszendent null (P4-Integration): Layer öffnet und zeigt 'Aszendent nicht berechenbar'-Erklärung statt Fehler"
- canvas-risk-status: "aligned — Honesty-Invariante test-erzwungen"

---

### REQ-P5-009 — Engagement-Signal: card_click/layer_open-Analytics-Event (Amendment B, eigene REQ)

**Beschreibung:**
Code-Read 2026-06-13 (`belegt`): kein Analytics-/Tracking-Mechanismus existiert in `src/`. P5 führt ein **leichtes, internes** `card_click`/`layer_open`-Event ein (z. B. `src/utils/analytics.ts` neu — der Executor verifiziert zuerst, ob bereits ein interner Mechanismus existiert; dieser Read bestätigt: nein). **Constraints (bindend, NFR-04):** kein Drittanbieter-Tracker, keine PII, kein Netzwerk-Beacon zu externem Dienst. Das Event macht messbar, ob der Erklär-Layer überhaupt genutzt wird (sonst beweisen die 55 Texte nur ihre Existenz, nicht ihren Nutzen).

**Beta-Smoke-Ziel:** Der Beta-Smoke zeigt ≥1 Layer-Open (Verhaltens-Smoke, nicht nur Existenz). **Owner: Benjamin** (User-bestätigt 2026-06-13) — im PR/Abschlussbericht namentlich festzuhalten (Team-Lücke geschlossen).

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** die Overview, **When** eine Karte geklickt / ein Layer geöffnet wird, **Then** feuert ein `card_click`/`layer_open`-Event. — *Test: Unit (Spy auf Event-Emitter) + e2e.*
- [ ] **Given** das Event, **When** sein Payload geprüft wird, **Then** enthält es keine PII und ruft keinen Drittanbieter-Tracker auf. — *Test (falsifizierend): Unit — Payload-Shape-Assertion + Code-Review/Grep auf externe Tracker.*
- [ ] **Given** der Beta-Smoke nach Deploy, **When** ein Layer geöffnet wird, **Then** zeigt der Smoke ≥1 Layer-Open. — *Test: real-boundary-Smoke nach Deploy (Screenshot/Log-Beleg).*
- [ ] **Given** der PR/Abschlussbericht, **When** das Engagement-Signal beschrieben wird, **Then** ist ein benannter Owner notiert. — *Test: Doc-Gate (Owner-Name vorhanden).*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Alle Erfolgssignale waren test-grün; nichts misst, ob Karten geklickt werden"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Leichtes card_click/layer_open-Event macht messbar, ob der Erklär-Layer genutzt wird (Nutzen, nicht nur Existenz)"
- canvas-success-signal: "card_click/layer_open feuert beim Layer-Open; Beta-Smoke zeigt ≥1 Layer-Open; Engagement-Signal hat benannten Owner"
- canvas-risk-status: "value-risk — Engagement ungemessen ohne dieses Event; aligned wenn Event feuert + Owner benannt + Smoke ≥1"

---

### REQ-P5-010 — Gates, Scope-Disziplin, PR + Live-Smoke (Task 6)

**Beschreibung:**
Abschluss-Gate: `npm run lint && npm test && npm run build && npx playwright test` — Zahlen vorher/nachher dokumentiert, keine Regressionen, P1-Regressionstests bleiben grün. PR `feat: Content-Layer — Erklärlayer, Häuser- und Säulen-Vertiefung` mit MISSING-Liste (house×sign-Matrix, Planet-in-Haus-Einzeltexte, Dayun-Erklärungen bis P2/B-012). (Hidden-Stems-UI ist NICHT MISSING/vertagt — sie funktioniert bereits, siehe REQ-P5-007.) **Scope C (Amendment C):** volle 55 Texte in EINEM PR (Default); Split-PR (zodiac+houses zuerst, BaZi-Domänen zweiter PR) ist reines Zeitdruck-Ventil, kein Qualitätsverzicht. Live-Smoke mit Screenshot zweier geöffneter Layer auf `newbazi-production.up.railway.app`.

**Akzeptanzkriterien (Given/When/Then):**
- [ ] **Given** der fertige Branch, **When** `npm run lint && npm test && npm run build && npx playwright test` läuft, **Then** ist alles grün und Vorher/Nachher-Zahlen sind dokumentiert (keine Regression). — *Test: Gate-Output im Abschlussbericht.*
- [ ] **Given** die P1-Regressionstests, **When** sie nach P5-Änderungen laufen, **Then** bleiben sie grün (Anti-Reification + Klarheits-Regel). — *Test: P1-Suite grün.*
- [ ] **Given** der Default-Pfad, **When** der PR erstellt wird, **Then** enthält er alle 55 Texte (Scope C); ein Split-PR ist nur bei dokumentiertem Zeitdruck zulässig. — *Test: PR-Review (55-Count) / Split-Begründung.*
- [ ] **Given** der Deploy, **When** der Live-Smoke läuft, **Then** existiert ein Screenshot zweier geöffneter Layer auf der Prod-URL. — *Test: real-boundary-Smoke (Screenshot).*
- [ ] **Given** der PR, **When** auf Vollständigkeit geprüft wird, **Then** ist die MISSING-Liste (house×sign-Matrix, Planet-in-Haus, Dayun) explizit enthalten (Hidden-Stems-UI gehört NICHT dazu — sie funktioniert bereits, REQ-P5-007). — *Test: PR-MISSING-Liste (Doc-Gate).*

**Traceability:**
- canvas-link: docs/canvas/bazi-sprint-p5-content-layer.canvas.md
- canvas-problem: "Sprint-Abschluss muss verifiziert in Prod laufen, nicht nur test-grün sein"
- canvas-target-user: "Neugierige Erwachsene 25–45, keine tiefen BaZi-Vorkenntnisse, Entertainment/Reflexion"
- canvas-value-claim: "Volle 55 Texte in einem PR (Scope C); Live-Smoke beweist, dass Layer in Prod öffnen"
- canvas-success-signal: "npm run lint && npm test && npm run build && npx playwright test grün; Live-Smoke mit Screenshot zweier geöffneter Layer"
- canvas-risk-status: "aligned — Split-PR nur als Zeitdruck-Ventil, kein Qualitätsverzicht"

---

## Nicht-funktionale Anforderungen (NFRs)

### NFR-01 — Anti-Reifikation: Regex UND semantisch (Amendment D)

- **Regex-Schicht (Literal-Token):** `registry.test.ts` enthält eine Regex, die für keinen der 55 Texte anschlägt — verbotene Token u. a. „Du bist", „Schicksal", „musst", „vorherbestimmt", „Heilung", „Diagnose", „Therapie", „Coaching".
- **Semantische Schicht (Amendment D, bindend):** Der Review-Agent (Master §6) liest alle 55 Texte vollständig und prüft gegen verbotene *Bedeutung* — weich-deterministische Formulierungen wie „prägt dich", „bestimmt dich", die die Literal-Regex NICHT fängt. Ein Text mit reifizierender Bedeutung ist auch ohne Token-Treffer ein Verstoß.
- **Falsifizierendes Artefakt (Audierbarkeit):** Die semantische Prüfung darf nicht nur als Pauschal-Urteil des Reviewers existieren. Es wird ein per-Text-Sign-off-Log geführt: jeder der 55 Texte erhält ein explizites „reviewed-for-forbidden-MEANING"-Häkchen. Fehlt ein Häkchen, ist NFR-01 für diesen Text nicht erfüllt. (Doc-Gate, REQ-P5-002.)
- **Anker-Präsenz (positiver Anti-Leere-Anker):** Jeder Layer-Text mit `{anchor}`-Slot muss beim Rendern einen echten Profilwert tragen (test-erzwungen, REQ-P5-002) — Generik/Leere wird mechanisch gefangen, nicht nur über die Wortzahl-Schranke.
- Alle Schichten sind verpflichtend; eine grüne Regex ohne semantischen Review (mit Sign-off-Log) und ohne Anker-Präsenz-Nachweis erfüllt NFR-01 nicht.

### NFR-02 — Stil-Constraints: 60–120 Wörter, Du-Form nur in Fragen, edler Ton

- Jede `long`-Eigenschaft: 60–120 Wörter (Grenzfälle 60 und 120 inklusive; test-erzwungen).
- Deutsch; Du-Form NUR in Fragen, sonst beschreibend („Der Aszendent Waage zeigt…", nicht „Du bist…").
- Jede Erklärung endet mit einem konkreten Bezug-Slot (`{anchor}`), den die UI mit dem User-Wert füllt.
- Ton: edel, ruhig, präzise (Konzept-Sprachregeln §11). Kein Alarm-Vokabular.

### NFR-03 — Keine verbotenen Wörter in UI-Texten

- Verboten in allen UI-Texten dieser PRD (Registry-Texte, Layer-Fußnoten, Häuser-/BaZi-Sektionstexte, Empty-States): „Coaching", „Therapie", „Diagnose", „Du bist…"-Festlegungen, Schicksals-Wording, Heilungs-Wording.
- Positionierung explizit NICHT Coaching/Therapie/Diagnose — test-erzwungen (registry.test.ts + P1-Regressionstest).

### NFR-04 — Engagement-Event: kein Drittanbieter, keine PII, kein Secret-Leak (Amendment B)

- `card_click`/`layer_open` ist ein internes, leichtes Event — kein Drittanbieter-Tracker, kein externer Beacon, keine PII im Payload.
- Kein Secret im Code/Bundle. Nur `VITE_*`-prefixed Env-Variablen gelangen ins Browser-Bundle (bestehende Regel).

### NFR-05 — Keine neuen npm-Dependencies

- Alle Implementierungen nutzen die bestehende Tech-Stack-Kette (React 19 + Vite + TS + Express BFF). Keine neuen `npm install`-Abhängigkeiten. Ein etwaiger Bedarf wäre explizit zu begründen und vom User zu bestätigen (sonst BLOCKER).

### NFR-06 — Astro-Noctum READ-ONLY + Quell-Posture (Amendment E)

- Die Astro-Noctum-Repos (`/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum`, `/Users/benjaminpoersch/Projects/Astro-Noctum`) sind READ-ONLY: nur lesen/portieren, NIE committen.
- Quell-Pfade werden vor jedem Portieren per `grep -rln` verifiziert (kein angenommener Pfad als Premisse).
- Quell-Posture (User-Entscheidung 2026-06-13): fehlende Quelltexte → Kuratierung (kein Stop); jede kuratierte Domäne als `kuratiert` geflaggt, `source:"curated"`, Per-Text-Semantik-Sign-off (NFR-01/D) + Benjamin-PR-Review. Kein stilles Umlabeln. Verankert in REQ-P5-001.

### NFR-07 — Chinesische-Tabellen-Konsistenz mit src/utils/

- `stems.ts`/`branches.ts` referenzieren die kanonischen `HEAVENLY_STEMS`/`EARTHLY_BRANCHES` aus `src/utils/astrology.ts` (Pinyin/Element/Polarität/Tier, diakritik-tolerant). Keine Duplikation von Astro-Logik. Test-erzwungen (REQ-P5-003).

### NFR-08 — Scope-Disziplin (Amendment C)

- Nur die in „Erlaubte Dateien" gelisteten Dateien werden geändert/erstellt. Kein Scope-Creep in andere Komponenten.
- Volle 55 Texte in EINEM PR (Default). Split-PR ist reines Zeitdruck-Ventil, kein Qualitätsverzicht und nicht der Default.

### NFR-09 — Build-Time-Content: kein CMS, kein Fetch, kein Laufzeit-Risiko

- Die Registry ist statischer, typengesicherter TS-Build-Time-Content (Muster: `src/content/tensionQuestions.ts`). Kein CMS, kein API-Fetch, kein Laufzeit-Datenpfad für die Texte.

### NFR-10 — TDD-Protokoll + True-Line-Disziplin

- Für jede neue Implementierungseinheit: RED (failing) vor der Implementierung, dann GREEN; Protokoll im Abschlussbericht.
- True-Line: ein test-grünes Kriterium beweist nicht „läuft". Jede REQ trägt `evidence-class` + `wired-in-prod?` + `true-line-status`. Hidden-Stems (REQ-P5-007) sind durch den bestehenden Live-Fixture-Test `fufireNormalizer.realshapes.test.ts:103` (real-boundary-grade gegen reale Branch-Identifier-Shape) + `BaZiDetail.tsx:163`-Rendering belegt; ein zusätzliches Phantom-Bug-Gate ist nicht erforderlich.

---

## Risiken

### R-01 — Text-Qualität (GRÖSSTES RISIKO)
55 Texte à ~90 Wörter sind der größte Einzelaufwand. **Mitigierung:** Review-Agent liest alle 55 vollständig (Stil + fachliche Plausibilität); Astro-Noctum-Quelltexte 1:1 übernehmen schlägt Umformulieren; nichts „aus dem Kopf" ohne `curated`-Markierung. Verankert in REQ-P5-002 + NFR-01.

### R-02 — Hidden-Stems-„leer-in-Prod"-Risiko (Council-Premisse widerlegt, AUFGELÖST)
Die Council-Annahme „`fufireNormalizer.ts:492` `branch.hiddenStems || []` erzeugt eine leere Liste, Fixtures tragen keinen Wert → leer in Prod" wurde durch direkte Code-Re-Verifikation (spec-auditor, 2026-06-13) WIDERLEGT: Der Zweig wird via `fufireNormalizer.ts:458-460` aus der kanonischen `EARTHLY_BRANCHES`-Tabelle (`astrology.ts:30-41`, populierte `hiddenStems` für alle 12 Zweige) aufgelöst und `:466`/`:492` spreaden ihn — `|| []` greift nur für den unauflösbaren defaultBranch. Beleg: bestehender Test `fufireNormalizer.realshapes.test.ts:103` (`day.hiddenStems.length > 0` gegen Live-Fixture) ist bereits grün; `BaZiDetail.tsx:163` rendert die Liste. **Status:** kein offenes Risiko — Hidden-Stems funktionieren in Prod. Restrisiko nur: leerer Container im echt-unauflösbaren defaultBranch-Fall → durch REQ-P5-007-Empty-State-Kriterium abgedeckt.

### R-03 — Astro-Noctum-Deckungslücke als stiller Erfind-Sprint (Amendment E)
Fehlen Quelltexte, droht „Executor kuratiert aus dem Kopf" = Erfind-durch-Umlabeln. **Mitigierung (User-Posture 2026-06-13):** REQ-P5-001 — kuratierte Texte sind als `source:"curated"` + `kuratiert`-Domäne geflaggt, durchlaufen den Per-Text-Semantik-Sign-off (NFR-01/D) und Benjamins PR-Review; Sichtbarkeit + menschliche Abnahme statt stillem Umlabeln.

### R-04 — Anti-Reifikation nur Regex-tief (Amendment D)
55 persönlichkeitsnahe Absätze sind die dichteste Fläche für weich-deterministische Formulierungen, die die Regex nicht fängt. **Mitigierung:** NFR-01 semantische Review-Schicht.

### R-05 — Engagement ungemessen (Amendment B)
Ohne Event beweisen die Texte nur Existenz, nicht Nutzen. **Mitigierung:** REQ-P5-009 (Event + Beta-Smoke ≥1 + benannter Owner).

### R-06 — Chinesische-Tabellen-Drift
Registry dupliziert Astro-Logik und driftet von `src/utils/`. **Mitigierung:** REQ-P5-003/NFR-07 test-erzwungene Konsistenz gegen `src/utils/astrology.ts`.

### R-07 — P4-Abhängigkeit (Aszendent null)
Der e2e-Test für den null-Aszendent-Layer setzt eine P4-`unknown-time`-Fixture voraus. **Mitigierung:** dokumentierte e2e-Abhängigkeit; die Komponente selbst braucht nur einen Null-Check (kein Blocker).

---

## Scope-Grenzen (explizit Out-of-Scope / Non-Goals)

- Keine volle house×sign-Matrix (12×12 Kombinationstexte) — MVP = Haus-long + Zeichen-short kombiniert; volle Matrix als MISSING im PR.
- Keine Planet-in-Haus-Einzeltexte — Folge-Iteration.
- Kein CMS, kein API-Fetch — Build-Time-Content ausschließlich.
- Keine Dayun-Erklärungen — folgt mit P2/B-012.
- Kein Neuschreiben der A14-P1-Tagesmeister-Texte (wiederverwenden, nicht duplizieren).
- Kein Commit ins Astro-Noctum-Repo (READ-ONLY).
- Keine neuen npm-Dependencies.
- Kein Drittanbieter-Tracker, keine PII im Engagement-Event.
- Hidden-Stems-UI ist NICHT Out-of-Scope und NICHT vertagt: sie funktioniert bereits (kanonische Tabelle, `realshapes.test.ts:103` belegt, `BaZiDetail.tsx:163` rendert). Out-of-Scope ist lediglich das Rendern eines leeren Hidden-Stems-Containers im echt-unauflösbaren defaultBranch-Fall (ehrlicher Empty-State).

---

## Erlaubte Dateien (vollständige Liste)

Nur diese Dateien dürfen in P5 geändert oder neu erstellt werden:

- `src/content/registry/types.ts` (neu)
- `src/content/registry/zodiacSigns.ts` (12 Einträge)
- `src/content/registry/stems.ts` (10 Einträge)
- `src/content/registry/branches.ts` (12 Einträge, Tier+Zweig)
- `src/content/registry/elements.ts` (5 Einträge)
- `src/content/registry/pillars.ts` (4 Einträge)
- `src/content/registry/houses.ts` (12 Einträge)
- `src/content/registry/registry.test.ts` (neu)
- `src/components/ExplanationLayer.tsx` (neu)
- `src/components/Overview.tsx` (modifiziert — Karten klickbar)
- `src/utils/analytics.ts` (neu — leichtes card_click/layer_open-Event; Executor verifiziert zuerst, ob bestehender Mechanismus existiert — Code-Read 2026-06-13: keiner vorhanden; kein Drittanbieter, keine PII)
- `src/components/WesternAstrology.tsx` (Häuser-Sektion Vertiefung)
- `src/components/BaZiDetail.tsx` (Säulen-Vertiefung)
- `docs/contracts/content-sources.md` (neu, Task-1-Output)
- `tests/e2e/` (neue Spec für click-to-open + Aszendent-null + Deep-Link)
- (nur falls Häuser-Felder fehlen) `src/utils/fufireNormalizer.ts` — minimal, nur Feldzugriff Häuser-cusps; keine neue Astro-Logik

---

## Atomarer Task-Breakdown (aligned zu Plan-Tasks 1–6)

| Task | REQ-IDs | Beschreibung | Gate |
|---|---|---|---|
| **Task 1** | REQ-P5-001 | Quell-Exploration: `content-sources.md` (Quell-Mapping je Domäne, `grep`-verifiziert) + Astro-Noctum-Quell-Posture (fehlende Domänen → geflaggt kuratiert + Per-Text-Semantik-Sign-off + Benjamin-PR-Review, kein Stop). (Hidden-Stems brauchen KEIN Real-Engine-Gate — bereits durch `realshapes.test.ts:103` belegt, siehe REQ-P5-007.) | **HARD GATE vor Task 2 und jedem Text** |
| **Task 2** | REQ-P5-002, REQ-P5-003 | Registry-Typen (`types.ts`) + 6 Domänen-Dateien (55 Einträge, einzeln committet) + `registry.test.ts` (Vollständigkeit, 60–120 Wörter, Anti-Reification-Regex, source, Tabellen-Konsistenz). TDD RED→GREEN | registry.test.ts grün |
| **Task 3** | REQ-P5-004, REQ-P5-008, REQ-P5-009 | `ExplanationLayer.tsx` + klickbare `Overview.tsx` (Datenanker, Esc/Backdrop, data-testid, role=button) + Honesty-Empty-State + `analytics.ts` card_click/layer_open-Event. TDD via e2e | e2e grün; Event feuert |
| **Task 4** | REQ-P5-005 | Häuser-Vertiefung in `WesternAstrology.tsx` (Thema, Spitzen-Zeichen, kombinierte Deutung, P4-Degradation, B-007-Klarheits-Regel) | Häuser-Sektion live (Screenshot) |
| **Task 5** | REQ-P5-006, REQ-P5-007 | BaZi-Säulen-Vertiefung in `BaZiDetail.tsx` (Lebensbereiche, Stamm/Zweig-Erklärungen, A14-Reuse, Deep-Link); Hidden-Stems aus kanonischer Tabelle (bereits belegt, `realshapes.test.ts:103` bleibt grün); leerer Container nur im unauflösbaren defaultBranch-Fall unterdrückt | BaZi-Tab vertieft (Playwright); `realshapes.test.ts:103` grün |
| **Task 6** | REQ-P5-010 | Gates (`lint && test && build && playwright`), PR (55 Texte, Scope C), MISSING-Liste, Live-Smoke (Screenshot zweier geöffneter Layer auf Prod) | Alle Gates grün + Live-Smoke |

---

## Traceability-Matrix

| REQ-ID | test | task | evidence | wired-in-prod? | evidence-class | canvas-link | canvas-problem | canvas-target-user | canvas-value-claim | canvas-success-signal | canvas-risk-status | vision-link | value-check-id | true-line-status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REQ-P5-001 | content-sources.md Struktur + `kuratiert`-Flag + Sign-off-Log | Task 1 | committetes `docs/contracts/content-sources.md` (Typ→Quelle→Qualität, kuratierte Domänen geflaggt) + Per-Text-Sign-off-Log | nein (Doc-Gate) | integration-fake | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Karten ohne Erklärung; App nur mit Vorwissen sinnvoll | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Texte aus Astro-Noctum portiert/kuratiert, nie erfunden | content-sources.md existiert (Typ→Quelle→Qualität) | aligned | TBD | VC-P5-01 | offen |
| REQ-P5-002 | registry.test.ts (55 Count, 60–120 W, Regex, source) | Task 2 | RED/GREEN-Protokoll, registry.test.ts grün, 6 Domänen-Commits | ja (Build-Time-Bundle) | unit-fake | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Karten ohne Erklärung | Neugierige Erwachsene 25–45, Entertainment/Reflexion | 55 Einträge in typengesicherter Build-Time-Registry | registry.test.ts grün: 55 vollständig, 60–120 W, source, Regex sauber | value-risk | TBD | VC-P5-02 | offen |
| REQ-P5-003 | registry.test.ts Konsistenz gegen HEAVENLY_STEMS/EARTHLY_BRANCHES | Task 2 | Import + Mismatch-Assertion gegen src/utils/astrology.ts | ja (Build-Time-Bundle) | unit-fake | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | BaZi-Säulen Rohdaten ohne Substanz | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Registry referenziert kanonische Tabellen, dupliziert keine Astro-Logik | Chinesische Tabellen konsistent mit src/utils/, keine duplizierten Felder | aligned | TBD | VC-P5-03 | offen |
| REQ-P5-004 | e2e: Klick→Layer, Esc/Backdrop schließt, data-testid, Aszendent-null | Task 3 | Playwright-Output, data-testid="explanation-layer" | ja (UI live) | real-boundary-smoke | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Karten ohne Erklärung | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Jede Karte klickbar → Erklär-Layer mit Symbol/Titel/Text/Datenanker | e2e grün: Sonnen-Karte öffnet Zwillinge+Anker; Esc schließt; data-testid; Aszendent-null zeigt Erklärung | aligned | TBD | VC-P5-04 | offen |
| REQ-P5-005 | e2e/Komponenten-Test Häuser-Sektion + P4-Degradation + P1-Regression | Task 4 | Screenshot/Smoke, P1-Regressionstest grün | ja (UI live) | real-boundary-smoke | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Häuser-Sektion unkommentierte Liste ohne Substanz | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Häuser-Sektion erhält Substanz: Thema, Spitzen-Zeichen, Interpretation | Häuser-Sektion mit substanziellen Deutungen live (Screenshot/Smoke) | aligned | TBD | VC-P5-05 | offen |
| REQ-P5-006 | e2e BaZi-Tab Säulen + Deep-Link + A14-Reuse + P4-Degradation | Task 5 | Playwright-Output/Screenshot | ja (UI live) | real-boundary-smoke | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | BaZi-Säulen liefern Rohdaten, keine Substanz | Neugierige Erwachsene 25–45, Entertainment/Reflexion | BaZi-Säulen-Tab erhält Tiefe: Lebensbereich, Stamm/Zweig-Erklärung | BaZi-Säulen-Tab mit Lebensbereichen + Stamm/Zweig-Erklärungen | aligned | TBD | VC-P5-06 | offen |
| REQ-P5-007 | bestehende fufireNormalizer.realshapes.test.ts:103 (day.hiddenStems.length>0 gegen Live-Fixture) + e2e: kein leerer Container nur im defaultBranch-Fall | Task 5 | realshapes.test.ts:103 grün; BaZiDetail.tsx:163 rendert; astrology.ts:30-41 populiert; fufireNormalizer.ts:458-460,466,492 löst auf | ja (UI live, bereits gerendert) | real-boundary-smoke | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Hidden-Stems-Liste ohne Erklärung (NICHT leer in Prod — Council-Premisse widerlegt) | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Hidden-Stems aus kanonischer Tabelle, nicht-leer für auflösbaren Zweig; ehrlicher Empty-State nur für unauflösbaren defaultBranch | realshapes.test.ts:103 grün + BaZiDetail.tsx:163 rendert; kein leerer Container im defaultBranch-Pfad | aligned | TBD | VC-P5-07 | offen — belegt durch realshapes.test.ts:103 (real-boundary-grade) |
| REQ-P5-008 | e2e/Unit Honesty: null→Empty-State, kein 0/Fake-Anker | Task 3 | Negativ-Fall-Tests gegen null-Fixtures | ja (UI live) | real-boundary-smoke | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Missing-Daten dürfen nicht als 0/erfundener Default erscheinen | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Datenanker zeigt echte Werte; fehlende Daten ehrlich null/Empty-State | Aszendent null: Layer zeigt 'Aszendent nicht berechenbar' statt Fehler | aligned | TBD | VC-P5-08 | offen |
| REQ-P5-009 | Unit Event-Spy + e2e + Beta-Smoke ≥1 Layer-Open + Owner-Doc | Task 3 | Event-Spy-Test, real-boundary-Beta-Smoke (≥1), Owner-Name im PR | ja (Event live) | real-boundary-smoke | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Alle Erfolgssignale test-grün; nichts misst, ob Karten geklickt werden | Neugierige Erwachsene 25–45, Entertainment/Reflexion | card_click/layer_open misst, ob Layer genutzt wird (Nutzen, nicht Existenz) | Event feuert; Beta-Smoke ≥1 Layer-Open; Owner = Benjamin | value-risk→aligned wenn Event live | TBD | VC-P5-09 | Owner=Benjamin (2026-06-13); Event in T3 |
| REQ-P5-010 | lint && test && build && playwright + Live-Smoke (2 Layer) | Task 6 | Gate-Zahlen vorher/nachher, Prod-Screenshot zweier Layer | ja (Prod) | production-verified | docs/canvas/bazi-sprint-p5-content-layer.canvas.md | Sprint-Abschluss muss in Prod laufen, nicht nur test-grün | Neugierige Erwachsene 25–45, Entertainment/Reflexion | Volle 55 Texte in einem PR (Scope C); Live-Smoke beweist Prod-Funktion | lint/test/build/playwright grün; Live-Smoke Screenshot zweier Layer | aligned | TBD | VC-P5-10 | offen |

**canvas-link (alle REQs):** docs/canvas/bazi-sprint-p5-content-layer.canvas.md

---

## Amendment-Mapping (Council A–E → REQ/NFR)

| Amendment | Encode in |
|---|---|
| **A — Hidden-Stems (Premisse widerlegt, umgewidmet)** | REQ-P5-007 (Hidden-Stems aus kanonischer Tabelle, bereits belegt; ehrlicher Empty-State nur für unauflösbaren defaultBranch); R-02 (aufgelöst); NFR-10 (Beleg via realshapes.test.ts:103) |
| **B — Engagement-Signal** | REQ-P5-009 (eigene REQ; card_click/layer_open + Beta-Smoke ≥1 + Owner); NFR-04 |
| **C — Scope (55 in einem PR)** | NFR-08; REQ-P5-010 (Akzeptanzkriterium Default vs. Split-Ventil) |
| **D — Anti-Reifikation semantisch** | NFR-01 (semantische + Regex-Schicht); REQ-P5-002 |
| **E — Astro-Noctum-Quell-Posture** | REQ-P5-001 (fehlende Domänen → kuratieren, `source:curated` + Sign-off + PR-Review); NFR-06 |

---

## Offene Punkte / Definition of Ready

**Diese PRD bleibt `draft`, bis die folgenden product-kritischen Punkte mit dem User geklärt sind (Gap-Regel: keine eigene Vermutung, kein stilles ASSUMPTION):**

1. **REQ-P5-009 — Owner des Engagement-Signals: GELÖST.** Owner = **Benjamin** (User-bestätigt 2026-06-13).
2. **REQ-P5-001 — Astro-Noctum-Quell-Posture (GELÖST per User-Entscheidung 2026-06-13):** Fehlende Quelltexte (auch ≥2 Domänen) → KURATIEREN statt Stoppen; jede kuratierte Domäne in `content-sources.md` als `kuratiert` geflaggt, jeder Text `source:"curated"` + Per-Text-Semantik-Sign-off (NFR-01/D) + Benjamin-PR-Review. Task-1-Coverage wird trotzdem `grep`-verifiziert und NICHT vorab geraten; vorläufige Read-Only-Recon deutet auf Häuser ohne Quellprosa + mehrere Domänen nur als Code-Tabellen hin → Kuratierungsaufwand entsprechend hoch, aber kein Stop. *(Hinweis: Das frühere Hidden-Stems-Real-Engine-Gate (Amendment A) ist AUFGELÖST — Code-Re-Verifikation belegt, dass Hidden-Stems aus der kanonischen Tabelle nicht-leer geliefert werden, siehe REQ-P5-007.)*
3. **Plan-Aussage „bazodiac.space hat sie live eingebunden — Benjamin bestätigt" bleibt user-attribuiert:** Diese Aussage wird NICHT als etablierte Tatsache restated, sondern als Aussage des Users geführt, bis unabhängig verifiziert.

**Phase 0 ist nicht abgeschlossen, bevor diese PRD UND die Product Vision (`docs/vision/bazi-sprint-p5-content-layer.vision.md`, vom Product Owner) vom User bestätigt sind.**

---

## Handoff

- **An `product-owner` (Vision-Gate):** PRD-Pfad `docs/prd/bazi-sprint-p5-content-layer.prd.md`; REQ-IDs REQ-P5-001…010; Akzeptanzkriterien je REQ; Non-Goals (s. o.); GELÖSTE User-Entscheidungen (Engagement-Owner = Benjamin, REQ-P5-009; Astro-Noctum-Quell-Posture = kuratieren-mit-Flag+Sign-off+PR-Review, REQ-P5-001); korrigierte Premisse (Hidden-Stems funktionieren bereits — Council-Behauptung widerlegt, REQ-P5-007); user-attribuierte Aussage (bazodiac.space live, Benjamin); customer/user (neugierige Erwachsene 25–45, Entertainment/Reflexion); Value-Claims/Erfolgssignale (s. canvas-success-signal je REQ).
- **An `spec-auditor` (Phase 0.5) + `planner`/`tester`:** frozen PRD + Matrix nach User-Bestätigung.
- **An `context-keeper`:** `state.md`, `decision-log.md`, ADRs konsistent zur Matrix halten (insb. ADR-Kandidat: `analytics.ts` neu vs. bestehender Mechanismus — Code-Read bestätigt: keiner vorhanden).
