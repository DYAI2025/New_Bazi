# P5-T2 — Per-Text Semantischer Sign-off (Amendment D)

**Deliverable:** Amendment-D auditierbarer Artefakt — per-Text semantischer Anti-Reifikations-Sign-off
für die 55 `long`-Texte der Content-Registry (`src/content/registry/`).
**Reviewer:** unabhängiger Code-Reviewer + semantisches Anti-Reifikations-Gate (P5-T2).
**Datum:** 2026-06-13.
**Posture (Amendment D):** Geprüft wird die verbotene **Bedeutung**, nicht nur das Regex-Token —
deterministische Charakter-Fixierung ("macht dich zu", "bestimmt/prägt dich"), Schicksals-/Seelenverwandt-Framing,
Coaching-/Therapie-/Diagnose-Register, Health-Claims. Register-Soll: deskriptive dritte Person, edel, ruhig,
präzise — eine Einordnung, kein Urteil. "dein/deinem" nur im literalen `{anchor}`-Datenzeiger erlaubt.

## Maschinell verifizierte Invarianten (unabhängig vom Vitest-Suite-Lauf)

- **Wortband 60–120:** alle 55 `long` im Band (Spanne 86–107 W). 0 Wortzahl-Verstöße.
- **`{anchor}`-Slot:** alle 55 `long` enden mit dem literalen Slot ` {anchor}`.
- **Test-FORBIDDEN-Regex** (`coaching|therapie|diagnose|heilung|schicksal|du bist|du musst|macht dich zu|bestimmt dich|prägt dich`):
  0 Treffer über alle 110 `short`+`long`-Felder.
- **Erweiterter semantischer Scan** (Fate/Schicksal/Bestimmung, Seelenverwandt, Health-Claim, `bist/wirst/sollst du`,
  `deine Natur/Wesen ist`, Garantie/zwangsläufig): 1 Token-Treffer ("Bestimmung" in `stem.jia`) — bei
  Kontextprüfung **clean** (Sinn-für-Zweck-Lesart der Energie, kein Fate-Fixing; siehe Tabelle).

## Anti-Reifikations-Sign-off (id | source | words | reviewed-for-forbidden-meaning)

| id | source | words | reviewed-for-forbidden-meaning |
|----|--------|-------|--------------------------------|
| zodiac.aries | astro-noctum | 91 | ✓ deskriptiv ("Die Sonne im Widder stellt … in den Kern der Identität"); du→dritte Person konvertiert; keine Festlegung. |
| zodiac.taurus | astro-noctum | 93 | ✓ deskriptiv ("verankert die Identität im Sinnlichen"); keine Determinierung. |
| zodiac.gemini | astro-noctum | 97 | ✓ "macht die bewusste Identität zu einem Ort unaufhörlicher Neugier" — Ortsmetapher, KEIN personales "macht dich zu"; deskriptiv. |
| zodiac.cancer | astro-noctum | 90 | ✓ deskriptiv ("verwurzelt den bewussten Willen in Gefühl"); keine Festlegung. |
| zodiac.leo | astro-noctum | 96 | ✓ deskriptiv; "Herausforderung liegt im Vertrauen" als Einordnung, kein Coaching-Imperativ. |
| zodiac.virgo | astro-noctum | 99 | ✓ deskriptiv ("richtet den bewussten Willen auf die Kunst der Unterscheidung"). |
| zodiac.libra | astro-noctum | 97 | ✓ deskriptiv; "braucht Harmonie" als Tendenz-Einordnung, kein Urteil. |
| zodiac.scorpio | astro-noctum | 99 | ✓ deskriptiv ("treibt den bewussten Willen in Tiefen"); kein Fate-Framing. |
| zodiac.sagittarius | astro-noctum | 95 | ✓ deskriptiv; "braucht vor allem Freiheit" als Tendenz, kein Du-Soll. |
| zodiac.capricorn | astro-noctum | 96 | ✓ deskriptiv ("richtet den bewussten Willen auf den langen Aufstieg"). |
| zodiac.aquarius | astro-noctum | 97 | ✓ deskriptiv ("stellt die Kernidentität in den Bereich von Vision"). |
| zodiac.pisces | astro-noctum | 95 | ✓ deskriptiv ("taucht den bewussten Willen in … Fantasie"); keine Festlegung. |
| stem.jia | astro-noctum | 88 | ✓ "klarer Sinn für Bestimmung" = Zweck-/Richtungs-Lesart der Yang-Holz-Energie, NICHT Fate-Fixing/vorbestimmt; deskriptiv über den Stamm ("Jiǎ … ist der aufragende Baum"). |
| stem.yi | astro-noctum | 88 | ✓ deskriptiv ("Yǐ … ist die Ranke"); Wirkung-durch-Anpassung, keine Determinierung. |
| stem.bing | astro-noctum | 89 | ✓ deskriptiv ("Bǐng … ist die Sonne selbst"); keine Festlegung. |
| stem.ding | astro-noctum | 91 | ✓ deskriptiv ("Dīng … ist die Kerzenflamme"); "gilt als außergewöhnlich scharf" als Einordnung. |
| stem.ren | astro-noctum | 97 | ✓ getrimmt (~190→97 W); deskriptiv ("Rén … ist der Ozean"); keine Determinierung. |
| stem.wu | astro-noctum | 94 | ✓ getrimmt (~190→94 W); deskriptiv ("Wù … ist der Berg"); "stabilisierende Gaben" als Einordnung. |
| stem.ji | astro-noctum | 95 | ✓ deskriptiv ("Jǐ … ist der fruchtbare Boden"); keine Festlegung. |
| stem.geng | astro-noctum | 93 | ✓ deskriptiv; "Herausforderung liegt in der Starrheit" als Einordnung, kein Urteil. |
| stem.xin | astro-noctum | 91 | ✓ deskriptiv ("Xīn … ist der polierte Edelstein"); "innerer Kritiker" als Bild, keine Diagnose. |
| stem.gui | astro-noctum | 96 | ✓ deskriptiv ("Guǐ … ist der Morgentau"); leise-Tiefe-Bild, keine Festlegung. |
| branch.zi | astro-noctum | 95 | ✓ deskriptiv ("Der Zweig Zǐ … steht für"); "Menschen mit dieser Zeichnung zeigen oft" = Tendenz, kein Verdikt. |
| branch.chou | astro-noctum | 98 | ✓ deskriptiv; "Menschen dieses Zweiges" + Tendenz-Formulierung, keine Determinierung. |
| branch.yin | astro-noctum | 90 | ✓ deskriptiv; Tiger kanonisch Yǐn 寅; "zeigen oft" = Tendenz, kein Urteil. |
| branch.mao | astro-noctum | 94 | ✓ deskriptiv ("verkörpert als Yin-Holz Anmut"); "gelten als" = Einordnung. |
| branch.chen | astro-noctum | 100 | ✓ deskriptiv; "gilt als günstigstes Zeichen" als kulturelle Einordnung, keine Personenfestlegung. |
| branch.si | astro-noctum | 97 | ✓ deskriptiv; "denken oft gründlich nach" = Tendenz, kein Verdikt. |
| branch.wu | astro-noctum | 97 | ✓ deskriptiv ("verkörpert als Yang-Feuer Freiheit"); Tendenz-Sprache. |
| branch.wei | astro-noctum | 100 | ✓ deskriptiv; "suchen oft Schönheit" = Tendenz, keine Festlegung. |
| branch.shen | astro-noctum | 100 | ✓ deskriptiv; "zeigen oft einen schnellen Verstand" = Tendenz. |
| branch.you | astro-noctum | 100 | ✓ deskriptiv; "zeigen sich oft fleißig" = Tendenz, kein Urteil. |
| branch.xu | astro-noctum | 101 | ✓ deskriptiv; "gelten oft als vertrauenswürdig" = Einordnung; "Integrität", kein Health-/Fate-Claim. |
| branch.hai | astro-noctum | 101 | ✓ deskriptiv; "Vertrauen in die Güte der Welt" als Zug-Einordnung, keine Determinierung. |
| element.holz | astro-noctum | 95 | ✓ explizit reifikations-bewusst ("eine Einordnung dieser Energie und keine feste Zuschreibung"); TCM-Organ-Bezug deskriptiv, kein Health-Claim. |
| element.feuer | astro-noctum | 94 | ✓ "kein abschließendes Urteil über einen Menschen"; Herz/Dünndarm als TCM-Korrespondenz, keine Diagnose. |
| element.erde | astro-noctum | 92 | ✓ "keine festschreibende Zuweisung"; Milz/Magen deskriptiv. |
| element.metall | astro-noctum | 95 | ✓ am stärksten expandiert; "kein Urteil über einen Menschen"; Lunge/Dickdarm + Loslassen-Motiv deskriptiv. |
| element.wasser | astro-noctum | 95 | ✓ "keine feste Zuschreibung"; Nieren/Blase als Ahnen-Energie-Bild, kein Health-Claim. |
| pillar.year | astro-noctum | 91 | ✓ Lebensbereichs-FRAME ("liest sich weniger als festes Urteil … sondern als Einordnung von Herkunft"). |
| pillar.month | astro-noctum | 86 | ✓ FRAME; "weniger eine Charakterfestlegung als vielmehr den Lebensbereich von Arbeit". |
| pillar.day | astro-noctum | 87 | ✓ reiner Selbst-FRAME; "ohne hier ein festes Charakterurteil zu sprechen"; Day-Master-Detail bewusst NICHT dupliziert. |
| pillar.hour | astro-noctum | 92 | ✓ FRAME; "ohne dass damit ein festes Urteil über die Person gefällt würde". |
| house.1 | curated | 102 | ✓ deskriptiv; "beschreibt weniger ein festes Wesen als eine Bühne"; Code-Kommentar zitiert New_Bazi HOUSE_TEMPLATES (nicht AN). |
| house.2 | curated | 98 | ✓ "Als Einordnung verstanden zeigt das zweite Haus eine Beziehung zur eigenen Substanz"; keine Festlegung. |
| house.3 | curated | 101 | ✓ deskriptiv ("regiert … das alltägliche Denken"); "Als Einordnung gelesen". |
| house.4 | curated | 107 | ✓ deskriptiv; "Tiefenschicht des Selbst" als Bild, keine Determinierung. |
| house.5 | curated | 103 | ✓ deskriptiv; "lustvoller Pol des Horoskops", keine Charakterfixierung. |
| house.6 | curated | 105 | ✓ "Verhältnis zur eigenen Gesundheit" = topischer Hausbereich (6. Haus), KEIN Health-Claim/Diagnose; "Als Einordnung gelesen". |
| house.7 | curated | 103 | ✓ deskriptiv; Partnerschaft als Begegnungs-Bereich, kein Seelenverwandt-Framing. |
| house.8 | curated | 97 | ✓ deskriptiv; "Transformation/Loslassen" als Prozess-Bild, keine Determinierung/Fate. |
| house.9 | curated | 102 | ✓ deskriptiv; "geistiger Fernblick", keine Festlegung. |
| house.10 | curated | 100 | ✓ deskriptiv; "Bogen einer Lebensleistung", kein Verdikt. |
| house.11 | curated | 101 | ✓ deskriptiv; Kollektiv/Zukunft, keine Determinierung. |
| house.12 | curated | 99 | ✓ deskriptiv; "auflösender Pol", keine Fate-/Karma-Fixierung (Karma-Begriff bewusst vermieden). |

## Befund

- **Anti-Reifikations-Verstöße (Bedeutung): 0 / 55.** Alle Texte sind deskriptiv-dritte-Person,
  Register edel/ruhig/präzise. Tendenz-Formulierungen ("zeigt oft", "gilt als", "neigt zu") statt Verdikten;
  mehrere Texte (alle 5 elements, alle 4 pillars, house.1) tragen explizite Anti-Reifikations-Klauseln.
- **Wortzahl-Verstöße: 0 / 55** (Band 60–120, Ist-Spanne 86–107).
- **source-Korrektheit:** zodiac/stems/branches/elements/pillars = `astro-noctum` (portiert);
  houses = `curated` mit Code-Kommentar-Zitat der New_Bazi-HOUSE_TEMPLATES-Herkunft (nicht als AN ausgegeben). Korrekt.
- **Register-Konversion:** AN-"du/deine" durchgängig in deskriptive dritte Person überführt; "dein" nur im
  `{anchor}`-Datenzeiger.

## Test-/Build-Status (separat)

Vitest + tsc sind zum Zeitpunkt des Sign-offs **RED** — Ursache ist ein reiner Export-Aliasing-Bug in
`branches.ts` (es fehlt `export const branches = BRANCHES_ENTRIES`, den alle fünf Sibling-Module besitzen),
auf den `index.ts` per `import { branches }` zugreift. Das ist KEIN Content-/Anti-Reifikations-Mangel; der
Content selbst ist semantisch und längenmäßig clean. Behebung durch den gebundenen Fixer, danach GREEN-Erwartung.
