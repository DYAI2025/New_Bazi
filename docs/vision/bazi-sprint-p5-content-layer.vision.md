# Product Vision: BaZi Sprint P5 — Content-Layer (Erklärlayer, Häuser- & Säulen-Vertiefung)

**Feature-Slug:** `bazi-sprint-p5-content-layer`
**Status:** user-confirmed
<!-- Status: user-confirmed -->
**Confirmed by user:** yes — "GO" (2026-06-13, Vision-GO-Gate)
**Erstellt:** 2026-06-13
**Canvas-Link:** [docs/canvas/bazi-sprint-p5-content-layer.canvas.md](../canvas/bazi-sprint-p5-content-layer.canvas.md) (Status: user-confirmed, v2 re-bestätigt 2026-06-13 post-Council)
**PRD-Link:** [docs/prd/bazi-sprint-p5-content-layer.prd.md](../prd/bazi-sprint-p5-content-layer.prd.md)
**Vorgänger-Vision:** [docs/vision/bazi-sprint-p4-unknown-time.vision.md](./bazi-sprint-p4-unknown-time.vision.md)

---

## Vision Statement

Eine neugierige Erwachsene öffnet ihr Profil und sieht „辛 Metall–", „2. Haus", „Aszendent Waage", „Tagessäule 亥 Schwein". Sie hat keine BaZi-Ausbildung, kein Astrologie-Studium — sie wollte nur wissen, was die App über ihre Muster sagt. Bislang steht sie vor einer Wand aus Zeichen und Zahlen, die nur dann Sinn ergeben, wenn man die Symbolsysteme bereits kennt. Genau die, die das nicht tut, lässt die App allein. Sie wechselt in einen externen Tab, sucht „Metall Yin Bedeutung" auf einer x-beliebigen Horoskop-Seite — oder sie schließt das Profil und kommt nicht wieder.

Mit P5 ändert sich das. Jede Karte in der Overview wird zu einer Tür. Ein Klick — und ein ruhiger Erklär-Layer fährt ein, der drei Dinge tut: er zeigt das Symbol groß, er benennt es klar, und er erklärt in 60–120 Wörtern, was dieses Symbol bedeutet — und zwar nicht im luftleeren Raum, sondern endend mit einem konkreten Anker in IHR Profil: „— in deinem Profil: Sonne 24.1° Zwillinge". Die Nutzerin liest keinen Lehrbuchabsatz über „die Zwillinge im Allgemeinen". Sie liest etwas, das mit ihr beginnt und mit ihrem eigenen Datenpunkt endet. Sie versteht das Symbol, weil es an ihr verankert ist.

Das ist das Versprechen, das die Entertainment/Reflexion-Positionierung erst einlöst: New_Bazi wird verständlich, ohne den Charakter eines Lehrbuchs anzunehmen — und ohne zur Coaching-, Therapie- oder Schicksals-App zu werden. Die App erklärt, sie diagnostiziert nicht. Sie ordnet ein, sie legt nicht fest. P5 ist die Schicht, die aus rohen Symbolen ein lesbares, ehrliches, eigenes Profil macht.

---

## Value Promise (Must Not Break)

**Das eine Versprechen, das unter keinen Umständen gebrochen werden darf:**

Eine Nutzerin ohne Vorkenntnisse klickt auf ein Symbol und versteht in einem ruhigen, kurzen Moment, was es für IHR Profil bedeutet — verankert an ihrem echten Datenpunkt, in einem Ton, der einordnet statt festlegt.

Dieses Versprechen hat zwei untrennbare Hälften, die beide gelten müssen:

1. **Verständlichkeit ohne Lehrbuch-Gefühl.** Der Erklärtext ist 60–120 Wörter lang — kurz genug, um in einem Atemzug gelesen zu werden, lang genug, um echte Substanz zu tragen. Er endet an einem konkreten Profil-Anker. Eine wall-of-text, ein Glossar-Eintrag, ein Lexikon-Absatz erfüllt dieses Versprechen NICHT, auch wenn er fachlich korrekt ist.

2. **Ehrlichkeit über jeden Daten-Anker.** Der Anker zeigt einen echten Profilwert oder gar nichts. Fehlt der Wert (Aszendent `null` aus P4, leere Hidden-Stems aus der Engine), wird der Anker NIEMALS mit einem erfundenen Grad, einer stillen `0` oder einem leeren-aber-gültig-wirkenden Platzhalter befüllt. Lieber kein Anker als ein gelogener.

Sekundär, aber ebenfalls nicht verhandelbar: Kein Text — von keiner der 55 Registry-Einträge, keiner Layer-Fußnote, keinem Häuser- oder Säulen-Absatz — legt die Nutzerin als Person fest. Die Anti-Reifikation gilt auf zwei Ebenen: kein verbotenes Wort (Token-Regex) UND keine verbotene Bedeutung (semantisch: „prägt dich", „bestimmt dich", „macht dich zu…"). Ein Text ohne Treffer in der Regex, der trotzdem deterministisch über den Charakter der Nutzerin spricht, bricht dieses Versprechen.

Wer diese Hälften bricht, bricht nicht die Software — er bricht den Grund, warum eine neugierige Erwachsene ohne Vorwissen der App überhaupt vertraut.

---

## Done Right Looks Like

Eine Nutzerin berechnet ihr Profil und sieht die Overview wie immer — nur dass jede Karte jetzt einlädt, angetippt zu werden (sichtbar fokussierbar, `role="button"`, Tastatur-erreichbar).

Das Erlebnis:

- Sie klickt auf die Sonnen-Karte. Ein Glass-Card-Drawer fährt von rechts ein, zeigt „♊" groß, den Titel „Zwillinge", einen 60–120-Wörter-Text in edlem, ruhigem Ton — und darunter „— in deinem Profil: Sonne 24.1° Zwillinge". Sie schließt per Esc oder Klick auf den Backdrop. Die Geste ist leicht, der Inhalt sitzt.
- Sie klickt auf die Tagessäule. Der Layer zeigt die Himmelsstamm-Erklärung (Element + Polarität) und die Erdzweig-Erklärung (Tier), und einen Deep-Link „Im BaZi-Tab vertiefen →". Sie folgt ihm und findet im BaZi-Tab den Lebensbereich der Säule, die Stamm- und Zweig-Deutung — der Layer war der Einstieg, der Tab die Vertiefung.
- Die Häuser-Sektion ist keine unkommentierte Zeichenliste mehr: pro Haus ein Thema, das Spitzen-Zeichen, die Planeten im Haus und 2–3 Sätze kombinierte Deutung. Substanz statt Rohdaten.
- Bei einem `curated`-Text steht eine kleine, ehrliche Fußnote „Kuratierte Einordnung" — die Nutzerin sieht, dass dieser Text bewusst formuliert und nicht aus einer Quelle portiert wurde. Transparenz statt unsichtbarer Herkunft.
- Sie hat ihre Geburtszeit nicht angegeben (P4): sie klickt auf die Aszendent-Karte, und der Layer öffnet trotzdem — und erklärt ruhig, warum der Aszendent nicht berechenbar ist. Kein Fehler, kein leeres Rechteck, keine Entschuldigung.
- Im Hintergrund, für sie unsichtbar, feuert beim Öffnen ein leichtes `layer_open`-Event — kein Drittanbieter, keine PII. Das Team kann zum ersten Mal sehen, ob die Türen, die P5 gebaut hat, überhaupt geöffnet werden. Der Beta-Smoke zeigt mindestens einen echten Layer-Open.
- Wo die Engine keine Hidden-Stems liefert, fehlt der Hidden-Stems-Block ganz — nicht als leere Liste, nicht als „keine vorhanden", sondern ehrlich abwesend, mit einem dokumentierten MISSING-Eintrag und einer auf einen Engine-Sprint vertagten UI. Die Stamm-, Zweig- und Säulen-Texte liefern trotzdem.

Die App fühlt sich an wie eine ruhige Erklärerin neben einem — die nur so viel sagt, wie stimmt, und nie mehr behauptet, als sie weiß.

---

## Done Wrong Looks Like

**Produktionsfehler erster Ordnung — stoppt die Auslieferung:**

- **Leere Hidden-Stems-Liste in Prod (Amendment A, KRITISCH).** Die UI rendert einen Hidden-Stems-Container, der für jeden echten Nutzer leer ist, weil `fufireNormalizer.ts:492` `branch.hiddenStems || []` still eine leere Liste erzeugt und kein Fixture einen Wert trägt. Test-grün gegen Fixture, leer in Prod. Das ist die klassische „passt-gegen-ein-Fake-berührt-nie-die-Realität"-Falle — und sie ist als BLOCKER zu behandeln, nicht als bekannte Einschränkung. Nur ein Real-Engine-Beleg (`pillars[].hiddenStems.length > 0`, `evidence-class: real-boundary-smoke`) darf die Hidden-Stems-UI freischalten; sonst MISSING + vertagt.
- **Erfundener Daten-Anker.** Der Layer befüllt „— in deinem Profil: …" mit einem Wert, den die Nutzerin nicht hat — ein Aszendenten-Grad bei unbekannter Zeit, eine stille `0`, ein Default. Das bricht die App-Ehrlichkeits-Invariante aus P1/P2/P4.
- **Aszendent-`null`-Layer wirft einen Fehler oder rendert leer**, statt die Erklärung „Aszendent nicht berechenbar" zu zeigen.

**Wertversagen ohne Produktionsabsturz — ebenfalls inakzeptabel:**

- **Lehrbuch-Wall-of-Text.** Ein Layer-Text liest sich wie ein Lexikon-Eintrag oder ein Wikipedia-Absatz: generisch, ohne Anker, ohne Bezug zur Nutzerin, sprengend über 120 Wörter oder dürr unter 60. Fachlich korrekt, aber er verrät die Entertainment/Reflexion-Positionierung und lässt die App akademisch und kalt wirken. Das ist ein Vision-Verstoß, auch wenn jeder Test grün ist.
- **Reifikations-Creep (Amendment D).** Ein Text legt die Nutzerin fest — „dieses Zeichen prägt dich", „dein Tagesmeister bestimmt, wer du bist", „du musst…". Auch ohne Treffer in der Token-Regex ist die reifizierende *Bedeutung* ein Verstoß. 55 persönlichkeitsnahe Absätze sind die dichteste Fläche dafür; jeder einzelne muss semantisch geprüft sein.
- **Erfundene Texte als portiert getarnt (Amendment E).** Fehlen für ≥2 ganze Domänen die Astro-Noctum-Quelltexte und der Sprint läuft trotzdem still als „Executor kuratiert 50 Texte aus dem Kopf" weiter — ohne User-Eskalation, ohne ehrliche `source:"curated"`-Markierung. Das ist Erfinden-durch-Umlabeln und ein „nicht wie spezifiziert fortfahren"-Zustand.
- **Tote Türen.** Die 55 Texte existieren in der Registry und sind test-grün — aber keine Karte ist tatsächlich verdrahtet, kein Klick öffnet einen echten Layer in Prod, und nichts misst, ob je ein Layer geöffnet wird. Die Texte beweisen ihre Existenz, nicht ihren Nutzen. (Genau hier greift das Engagement-Signal, Amendment B.)
- **Chinesische-Tabellen-Drift.** Die Registry dupliziert Pinyin/Element/Polarität/Tier statt die kanonischen `HEAVENLY_STEMS`/`EARTHLY_BRANCHES` zu referenzieren — und driftet still von `src/utils/astrology.ts` weg.

**Verbotene Formulierungen in allen UI-Texten:**
„Coaching", „Therapie", „Diagnose", „Du bist…" als deterministische Charakter-Festlegung, Schicksals-Wording, Heilungs-Wording, Alarm-Vokabular/Ausrufezeichen-Stil — UND deren semantische Äquivalente ohne die wörtlichen Token.

---

## Value Checks (VCHK) — woran der Build gemessen wird

Diese Checks sind das Vision-Gate. Sie sind orthogonal zu „Tests grün": eine grüne Suite ist notwendig, nicht hinreichend. Jeder VCHK ist gegen das ausgelieferte, laufende Profil zu beurteilen, nicht nur gegen einen Unit-Test.

- **VCHK-P5-01 — Verständlichkeit verankert:** Eine Nutzerin ohne Vorwissen klickt eine Karte und liest einen 60–120-Wörter-Text, der mit einem konkreten Profil-Anker (ihr echter Wert) endet. Der Text liest sich wie eine Einordnung, nicht wie ein Lexikon-Eintrag. (PRD: REQ-P5-002, REQ-P5-004; NFR-02)
- **VCHK-P5-02 — Kein Lehrbuch-Gefühl:** Kein Layer-Text überschreitet die Wortgrenzen, keiner ist generisch-anker-los, keiner liest sich akademisch/kalt. Der Ton ist edel, ruhig, präzise. (PRD: NFR-02; canvas-value-claim)
- **VCHK-P5-03 — Anti-Reifikation auf zwei Ebenen (Amendment D):** Keiner der 55 Texte legt die Nutzerin als Person fest — weder per verbotenem Token (Regex) noch per verbotener Bedeutung (semantischer Review aller 55 Texte). (PRD: NFR-01, NFR-03, REQ-P5-002)
- **VCHK-P5-04 — Ehrlicher Daten-Anker / Degradation:** Fehlt ein Wert (Aszendent `null`, `timeKnown:false`), zeigt der Layer/die Sektion einen ehrlichen Erklär-/Empty-State — nie `0`, nie erfundenen Default, nie gelogenen Anker. (PRD: REQ-P5-004, REQ-P5-008)
- **VCHK-P5-05 — Honest-Degradation Hidden-Stems (Amendment A):** Hidden-Stems werden NUR gerendert, wenn eine echte Engine-Antwort sie liefert (`length > 0`, `real-boundary-smoke`-belegt). Ist die Liste leer, rendert KEIN leerer Hidden-Stems-Container in Prod; der Befund steht als MISSING + „UI vertagt" in `content-sources.md`; ein `unit-fake`-Beleg zählt NICHT. (PRD: REQ-P5-007; NFR-10)
- **VCHK-P5-06 — Engagement messbar (Amendment B):** Beim Öffnen eines Layers feuert ein leichtes, internes `card_click`/`layer_open`-Event (kein Drittanbieter, keine PII); der Beta-Smoke zeigt ≥1 echten Layer-Open; das Engagement-Signal hat einen namentlich benannten Owner. (PRD: REQ-P5-009; NFR-04)
- **VCHK-P5-07 — Quell-Ehrlichkeit & Pivot-Gate (Amendment E):** `content-sources.md` existiert mit Quell-Mapping je Domäne; jeder Text trägt `source` ∈ {astro-noctum, curated}; bei ≥2 fehlenden Domänen wurde an den User eskaliert statt still zu erfinden. (PRD: REQ-P5-001; NFR-06)
- **VCHK-P5-08 — Türen wirklich verdrahtet (Reality-Check):** Auf der Prod-URL öffnet ein realer Klick reale Layer (Live-Smoke-Screenshot zweier geöffneter Layer). Die Texte sind in die laufende Overview/BaZi-/Häuser-UI verdrahtet, nicht nur in der Registry vorhanden. (PRD: REQ-P5-004, REQ-P5-010)
- **VCHK-P5-09 — Konsistenz statt Drift:** `stems.ts`/`branches.ts` referenzieren die kanonischen `HEAVENLY_STEMS`/`EARTHLY_BRANCHES` aus `src/utils/astrology.ts` (diakritik-tolerant); keine duplizierte Astro-Logik. (PRD: REQ-P5-003; NFR-07)
- **VCHK-P5-10 — Vertiefung mit Substanz:** Häuser-Sektion (Thema, Spitzen-Zeichen, kombinierte Deutung) und BaZi-Säulen-Tab (Lebensbereich, Stamm-/Zweig-Erklärung) liefern echte Einordnung; die A14-P1-Tagesmeister-Texte werden wiederverwendet, nicht dupliziert; house×sign-Matrix ist als MISSING geführt. (PRD: REQ-P5-005, REQ-P5-006)

---

## Fulfillment Signals

Diese Signale sind beobachtbar — nicht ableitbar aus grünen Tests allein:

**Technische Invarianten (notwendig, nicht hinreichend):**
- `registry.test.ts` grün: 55 Einträge (12+10+12+5+4+12), jede `long` 60–120 Wörter (Grenzfälle 60/120), `source` gesetzt, Anti-Reifikations-Regex schlägt für keinen Eintrag an.
- Chinesische-Tabellen-Konsistenz test-erzwungen gegen `src/utils/astrology.ts`.
- e2e (Playwright) grün: Sonnen-Karte → Zwillinge-Text + Anker-Grad; Tagessäule → Stamm+Zweig; Esc/Backdrop schließt; `data-testid="explanation-layer"` präsent; Aszendent-`null` → Erklärung statt Fehler.
- `npm run lint && npm test && npm run build && npx playwright test` — Vorher/Nachher-Zahlen, keine Regressionen, P1-Regressionstests (Anti-Reifikation + Klarheits-Regel) bleiben grün.
- `docs/contracts/content-sources.md` existiert mit Quell-Mapping-Tabelle und dem schriftlichen Hidden-Stems-Real-Engine-Befund.

**Erlebnisqualität (hinreichend für Vision-Erfüllung):**
- Ein Mensch ohne BaZi-Vorwissen klickt eine Karte, liest den Layer und sagt: „Ah — DAS bedeutet das bei MIR." Kein Reflex, eine externe Suche zu öffnen.
- Der Live-Smoke-Screenshot auf Production zeigt zwei geöffnete Layer mit gefülltem Anker, ruhigem Ton, ohne Lehrbuch-Schwere.
- Kein Layer-Text löst Irritation durch Ton, Festlegung oder akademische Schwere aus.
- Der Beta-Smoke zeigt ≥1 echten Layer-Open — die Türen werden geöffnet, nicht nur gebaut.

**Das Vision-Gate ist NICHT erfüllt, wenn:**
- Tests grün, aber ein Layer rendert einen Lehrbuch-Wall-of-Text statt einer verankerten Einordnung (VCHK-P5-01/02).
- Tests grün, aber die Hidden-Stems-UI rendert eine leere Liste in Prod ohne Real-Engine-Beleg (VCHK-P5-05) — dies bleibt ein BLOCKER und darf nicht eigenmächtig zur „bekannten Einschränkung" herabgestuft werden; nur der User entscheidet das.
- Texte existieren in der Registry, aber keine Karte ist in Prod verdrahtet / kein Layer-Open ist je messbar (VCHK-P5-06/08).
- Ein Text legt die Nutzerin per Bedeutung fest, obwohl die Token-Regex grün ist (VCHK-P5-03).
- ≥2 Domänen-Quelltexte fehlten und der Sprint lief still als Erfind-Sprint weiter statt zu eskalieren (VCHK-P5-07).

---

## Out of Scope (Vision Boundary)

Diese Vision ist bewusst auf die Verständlich-machende Erklär-Schicht beschränkt. Folgendes ist explizit NICHT Teil dieser Vision:

- **Volle house×sign-Matrix (12×12 Kombinationstexte):** MVP ist Haus-`long` + Zeichen-`short` kombiniert; die volle Matrix ist als MISSING im PR zu führen, nicht zu bauen.
- **Planet-in-Haus-Einzeltexte:** Folge-Iteration.
- **Dayun-Erklärungen:** folgen mit P2/B-012.
- **Hidden-Stems-UI bei leerer Engine-Antwort:** vertagt auf einen Engine-Sprint — diese Vision rendert sie NICHT, solange kein Real-Engine-Beleg vorliegt.
- **CMS, API-Fetch, Laufzeit-Content-Pfad:** ausschließlich Build-Time-Content (Muster `src/content/tensionQuestions.ts`).
- **Drittanbieter-Tracking / Analytics-Plattform:** das Engagement-Event ist intern, leicht, PII-frei — keine externe Tracking-Infrastruktur.
- **Neuschreiben der A14-P1-Tagesmeister-Texte:** wiederverwenden, nicht duplizieren.
- **Commit ins Astro-Noctum-Repo:** READ-ONLY — nur lesen/portieren.
- **Neue npm-Dependencies.**
- **Eigener Onboarding-/Tutorial-Flow für die Erklär-Schicht:** der Layer selbst ist die Erklärung; keine separate Lern-Seite.

Die Vision ist erfüllt, wenn eine neugierige Erwachsene ohne Vorwissen ein angezeigtes Symbol antippt und in einem ruhigen, kurzen, ehrlich verankerten Moment versteht, was es für IHR Profil bedeutet — ohne das Gefühl, ein Lehrbuch aufgeschlagen zu haben, und ohne dass die App ihr je etwas vormacht, das sie nicht weiß.
