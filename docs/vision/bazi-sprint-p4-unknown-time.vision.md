# Product Vision: BaZi Sprint P4 — Unknown Birth Time Mode

**Feature-Slug:** `bazi-sprint-p4-unknown-time`
**Status:** user-confirmed
**Erstellt:** 2026-06-12
**Canvas-Link:** [docs/canvas/bazi-sprint-p4-unknown-time.canvas.md](../canvas/bazi-sprint-p4-unknown-time.canvas.md)
**PRD-Link:** [docs/prd/bazi-sprint-p4-unknown-time.prd.md](../prd/bazi-sprint-p4-unknown-time.prd.md)

---

## Vision Statement

Es gibt Menschen, die ihre Geburtszeit schlicht nicht kennen — keine Urkunde mit Uhrzeit, keine Elternerinnerung, keine Krankenhausakte. Bislang schließt New_Bazi genau diese Menschen aus: entweder mit einer harten Blockade am Eingabeformular, oder — schlimmer — indem es ihnen erlaubt, eine Ratezeit einzugeben, die dann stillschweigend als Wahrheit durch das System fließt und Aszendent, Häuser und Stundensäule als echte Aussagen erzeugt, die es nicht sind.

Mit P4 ändert sich das. Eine Nutzerin, die ihre Geburtszeit nicht kennt, erfährt zum ersten Mal: Die App nimmt mich ernst. Sie sagt mir klar, was sie mit meinen Daten bestimmen kann und was nicht — und sie zeigt mir trotzdem das Wesentliche vollständig. Drei BaZi-Säulen, alle Planetenpositionen und -grade, der Wu-Xing-Vektor: das sind die tiefen, datumsstabilen Schichten des Profils. Sie gelten. Was fehlt, wird benannt und erklärt — nicht mit einem Fehlerbalken, nicht mit einer Entschuldigung, sondern mit der Ruhe einer App, die weiß, was sie tut.

Das ist das Versprechen, das P1/P2 aufgebaut haben — „ehrlich, präzise, niemals fake" — endlich auch für den Rand des Datenstands: den Mensch ohne Uhrzeit.

---

## Value Promise (Must Not Break)

**Das eine Versprechen, das unter keinen Umständen gebrochen werden darf:**

Wenn eine Nutzerin angibt, ihre Geburtszeit nicht zu kennen, erscheinen Aszendent, Häuser und Stundensäule niemals als berechnete Fakten — nicht als Näherung ohne Kennzeichnung, nicht als stumme 12:00-Ausgabe, nicht als ausgefüllte Felder mit einem kleinen Hinweis irgendwo unten.

Sie erscheinen als `null`. Sichtbar als Lücke. Ehrlich beschriftet.

Diese Invariante ist technisch abgesichert durch den Normalizer-Test `ascendant === null` und `bazi.pillars.hour === null` bei `timeKnown:false`. Sie ist aber mehr als ein Unit-Test: Sie ist die Aussage, mit der New_Bazi seinem eigenen Markenkern treu bleibt. Wer diesen Test bricht, bricht nicht die Software — er bricht das Vertrauen.

Sekundär, aber ebenfalls nicht verhandelbar: Die 12:00-Konvention ist ein interner Vertrag mit der FuFirE-Engine. Sie erscheint niemals als angezeigte Uhrzeit in der UI. Eine Nutzerin, die keine Zeit eingegeben hat, sieht nirgendwo „12:00" als ihre Geburtszeit.

---

## Done Right Looks Like

Eine Nutzerin ohne bekannte Geburtszeit öffnet das Formular, setzt eine Checkbox — eine einzige, unkomplizierte Geste — und gibt Datum und Ort ein.

Das Ergebnis:

- Ihre drei BaZi-Tagessäulen (Jahr, Monat, Tag) erscheinen vollständig und gleichwertig wie bei jeder anderen Nutzerin. Der Hinweis auf fehlende Zeit wird nicht an diese Säulen geheftet — sie gelten.
- Alle Planetenzeichen und -grade erscheinen vollständig. Wo der Mond nah an einer Zeichengrenze steht (unter 6° Abstand bei der internen 12:00-Berechnung), ist ein ruhiges `(ungefähr)` zu sehen — kein Alarm, nur Genauigkeit.
- Aszendent-Karte: ein sauberes „—" mit dem kleinen Tag „Zeit unbekannt". Kein Leerzeichen, kein Fragezeichen, keine rote Markierung. Neutrales Signal.
- Die `<TimeDependencyNote/>` formuliert in zwei Sätzen: was vollständig gilt, und was fehlt — warum. Der Ton ist der einer App, die sich bewusst ist, was sie tut: klar, ruhig, respektvoll gegenüber der Nutzerin und gegenüber den Grenzen des Wissens.
- Der Wu-Xing-Vektor und der TensionNavigator rendern vollständig. Wenn die Engine Fusion ohne Stundensäule mit reduzierter Qualität markiert, erscheint ein Hinweis — kein Fehler, eine Information.
- Die nächste Session: Checkbox-Zustand ist gespeichert. Die Nutzerin muss nicht erneut erklären, dass sie ihre Zeit nicht kennt.
- Im Paar-Modus mit einem unbekannter-Zeit-Partner: die Synastrie degradiert ruhig — kein Absturz, kein weißes Rechteck, kein leerer Screen. Was berechenbar ist, wird berechnet. Was nicht berechenbar ist, wird benannt.

Die App fühlt sich an wie ein Instrument, das ehrlich mit seinen eigenen Grenzen umgeht. Das ist Stärke, nicht Mangel.

---

## Done Wrong Looks Like

**Produktionsfehler erster Ordnung — stoppt die Auslieferung:**

- Der Normalizer lässt den 12:00-berechneten Aszendenten als Fakt durch. Die Nutzerin sieht einen Aszendenten-Wert — ohne jede Kennzeichnung — obwohl er erfunden ist. Das ist eine Lüge, die das Kernversprechen der App bricht.
- Analog: `bazi.pillars.hour` enthält einen 12:00-berechneten Wert statt `null`. Die Stundensäule erscheint als echte Aussage.
- Die Checkbox existiert, aber das `timeKnown:false`-Flag erreicht den Payload-Mapper nicht. Die Engine wird mit `birth_time_known:true` aufgerufen. Das System verhält sich exakt wie vor P4.
- „12:00" erscheint irgendwo in der UI als angezeigte Geburtszeit der Nutzerin.

**Wertversagen ohne Produktionsabsturz — ebenfalls inakzeptabel:**

- `<TimeDependencyNote/>` zeigt nur „—" ohne Erklärung. Die Nutzerin sieht ein kaputt wirkendes Formular, nicht ein bewusstes partielles Profil. Das Ehrlichkeitsversprechen ist erhalten, das Vertrauenserlebnis zerstört.
- Die Note enthält Entschuldigungssprache, Alarm-Vokabular, oder eine Formulierung, die das Profil als minderwertig markiert statt als partiell. Ton: „Leider konnten wir..." oder „Achtung: Dein Profil ist unvollständig" — das ist falsch.
- Die drei tagesstabilen BaZi-Säulen erhalten einen „Zeit fehlt"-Hinweis, der ihnen nicht gilt. Ruhige Vollständigkeit wird durch unnötige Vorsicht beschädigt.
- Synastrie mit einem `timeKnown:false`-Partner bricht mit einem Laufzeitfehler ab oder rendert eine leere Seite. Die Nutzerin glaubt, die App sei defekt.
- Die Persistenz fehlt: beim nächsten Laden ist die Checkbox leer, das Profil neu berechnet mit `timeKnown:true`, der Aszendent erscheint — als Fakt.

**Verbotene Formulierungen in allen UI-Texten:**
„Coaching", „Therapie", „Diagnose", „Du bist..." als deterministische Charakter-Festlegung, Schicksals-Wording, Ausrufezeichen, „Achtung!"-Stil.

---

## Fulfillment Signals

Diese Signale sind beobachtbar — nicht ableitbar aus grünen Tests allein:

**Technische Invarianten (notwendig, nicht hinreichend):**
- `ascendant === null` bei `timeKnown:false` — zentraler Honesty-Test grün.
- `bazi.pillars.hour === null` bei `timeKnown:false` — zweite Honesty-Invariante grün.
- Paar-Modus-Regressions-Test: Synastrie mit einem `timeKnown:false`-Partner degradiert ohne Laufzeitfehler.
- `npm run lint && npm test && npm run build` — kein Regressionen.
- `npx playwright test` — neuer E2E-Spec grün: Checkbox → Profil rendert → „—" in Aszendent-Karte → 3 BaZi-Säulen → TensionNavigator rendert.
- Profil-Persistenz-Test: `birth_data.timeKnown:false` round-tripped durch Supabase JSONB, Checkbox beim Laden vorausgewählt.
- 6 Live-Fixtures `src/__fixtures__/fufire/unknown-time/*.json` committiert mit Befund-Kommentar.

**Erlebnisqualität (hinreichend für Vision-Erfüllung):**
- Ein Mensch, der die App testet und seine Geburtszeit nicht kennt, sieht ein vollständiges, lesbares Profil — keine Fehlermeldungen, keine Lücken ohne Erklärung, keine Entschuldigungen.
- Der Live-Smoke-Screenshot auf Production zeigt alle degradierten Sektionen sauber und verständlich: „—" mit Tag, `<TimeDependencyNote/>` mit Versicherungstext, 3 vollständige BaZi-Säulen ohne unnötigen Hinweis.
- Kein Text in der UI löst Irritation aus durch Ton oder Formulierung.
- Die FuFirE-Engine-Fixture-Verifikation (REQ-P4-001) ist abgeschlossen und das Engine-Verhalten stimmt mit dem Contract überein — andernfalls ist das eine offene Frage, keine „grüne" Lieferung.

**Das Vision-Gate ist nicht erfüllt, wenn:**
- Tests grün, aber der Live-Smoke zeigt einen Aszendenten-Wert bei `timeKnown:false`.
- `<TimeDependencyNote/>` existiert, aber ihr Text verletzt einen der Ton-Constraints.
- Das `timeKnown`-Flag wird nicht persistiert — beim nächsten Laden ist die Checkbox leer und ein 12:00-Aszendent erscheint.

---

## Out of Scope (Vision Boundary)

Diese Vision ist bewusst auf das Ehrlichkeitsversprechen für unbekannte Geburtszeiten beschränkt. Folgendes ist explizit nicht Teil dieser Vision:

- **Time-Rectification / Zeitfenster-Modus:** Das Berechnen mehrerer Uhrzeiten zur Eingrenzung des möglichen Aszendenten ist ein anderes Produkt — ein Werkzeug für erfahrene BaZi-Praktikerinnen, nicht für neugierige Erwachsene ohne Vorkenntnisse.
- **Präzise astronomische Mondgrenzen-Bestimmung:** Die 6°-Heuristik ist Best-Effort. Astronomisch exakte Grenzberechnungen würden eine andere Engine-Kapazität erfordern.
- **Neues Supabase-Schema oder neue Migration:** Der `timeKnown`-Zustand lebt im bestehenden `birth_data`-JSONB-Blob. Kein Schema-Change, keine neue Spalte, keine Migration.
- **Eigener Auth-Flow oder Registrierungspflicht für unknown-time-Nutzerinnen:** Anonymer Zugang bleibt vollständig erhalten.
- **Separater Paar-Modus-Flow für unbekannte Zeiten:** Synastrie mit einem `timeKnown:false`-Partner nutzt denselben Degradationspfad — keine gesonderte UX.
- **Erklärungsseite oder dedizierter Onboarding-Dialog** für das Thema unbekannte Geburtszeit. Die `<TimeDependencyNote/>` ist das einzige Erklärungsformat in diesem Sprint.
- **Neue npm-Dependencies.**

Die Vision ist erfüllt, wenn eine Nutzerin ohne Geburtszeit ein ehrliches, vollständiges Teilerlebnis erhält — und das Vertrauen in die App durch dieses Erlebnis nicht gemindert, sondern gestärkt wird.
