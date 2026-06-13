# Content Sources — P5-T1 Source-Coverage Gate

**Deliverable:** P5-T1 (`docs/contracts/content-sources.md`)
**Domains:** zodiac (12), stems (10), branches (12), elements (5), pillars (4), houses (12) — **55 Content-Einträge gesamt**
**Status der Recon:** abgeschlossen für alle 6 Domains (je ein Coverage-Report).

## Zweck & Posture (Amendment E — curate-missing)

Dieses Dokument ist das **Quellen-Abdeckungs-Gate** vor T2 (Content-Erstellung). Es klassifiziert jeden der 55
Einträge nach einer von drei Dispositionen und benennt die exakte Quelle (file:line) oder markiert sie als fehlend.

Posture nach **Amendment E (curate-missing)**:

- **`port`** — Es existiert reale, portierbare deutsche Prosa in einer bekannten Quelle (i. d. R. Astro-Noctum).
  Sie wird 1:1 übernommen, ggf. mit leichtem Stil-/Längen-Pass (siehe Notiz je Eintrag).
- **`reuse`** — Es existiert bereits deutsche Basis-Prosa **in New_Bazi selbst**. Sie wird wiederverwendet
  (nicht dupliziert), benötigt aber Längen-/Voice-Kuratierung.
- **`curate`** (Quelle fehlt) — Es existiert **keine** portierbare Quelle. Der Text wird in T2 **neu kuratiert**,
  im Datensatz mit `source: "curated"` markiert.

**Bei fehlender Quelle wird kuratiert — es gibt KEINEN Stop.** Jeder kuratierte Text durchläuft:

1. **Per-Text semantischer Sign-off** (Stil-Bar: deskriptive Platzierung, keine „Du bist…"-Festlegung, keine
   verbotenen Begriffe Coaching/Therapie/Diagnose/Schicksal/Heilung, Längenband 60–120 Wörter).
2. **Benjamin PR-Review** vor Merge.

Diese Posture gilt analog auch für die `reuse`-Einträge: vorhandene New_Bazi-Basis wird wiederverwendet, aber die
Expansions-/Voice-Arbeit darauf folgt demselben Sign-off + PR-Review wie kuratierter Content.

### Hinweise zur ID-Kanonik

- **Hidden-Stems funktionieren bereits** (kein Gate, gemäß korrigiertem Amendment A / REQ-P5-007). Die versteckten
  Stämme stehen kanonisch im Feld `hiddenStems` von `EARTHLY_BRANCHES` in
  `/Users/benjaminpoersch/Projects/New_Bazi/src/utils/astrology.ts:30-41` und benötigen **keinen** eigenen
  Content-Eintrag in diesem Gate.
- **`stem.*`- und `branch.*`-IDs müssen die kanonischen Tabellen referenzieren:**
  `HEAVENLY_STEMS` (`src/utils/astrology.ts:15-26`) und `EARTHLY_BRANCHES` (`src/utils/astrology.ts:29-42`).
  Kanonische Reihenfolge Stämme (Index 0–9): Jiǎ, Yǐ, Bǐng, Dīng, Wù, Jǐ, Gēng, Xīn, Rén, Guǐ.
  Kanonische Reihenfolge Zweige (Index 0–11): Zǐ, Chǒu, Yǐn, Mǎo, Chén, Sì, Wǔ, Wèi, Shēn, Yǒu, Xū, Hài.
- **Pinyin-Abweichung Tiger:** New_Bazi kanonisch `Yǐn` (寅, `astrology.ts:32`); die AN-Quelle nutzt `Yín` —
  identischer Zweig, beim Port die kanonische New_Bazi-Schreibweise verwenden.

---

## Domain: zodiac (12 westliche Tierkreiszeichen) — vollständig

Primärquelle: `…/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/astro-data/zodiacSigns.ts` (`ZODIAC_SIGNS_DATA`).
Drei Kontexte je Zeichen (sun/moon/asc); sun+moon bzw. sun+asc kombiniert trifft das 60–120-Wort-Band.
Identische Zweitkopie in `…/Projects/Astro-Noctum/src/lib/astro-data/zodiacSigns.ts`.

| Entry-ID | Disposition | Quelle (file:line) | Notiz |
|----------|-------------|--------------------|-------|
| zodiac.aries | port | zodiacSigns.ts:34-44 | DE-Prosa (sun/moon/asc); sun+moon/asc kombinieren für 60–120 W. |
| zodiac.taurus | port | zodiacSigns.ts:50-60 | Deskriptiv, keine verbotenen Begriffe. |
| zodiac.gemini | port | zodiacSigns.ts:66-76 | 3 Kontexte vorhanden. |
| zodiac.cancer | port | zodiacSigns.ts:82-92 | DE-Prosa, deskriptive Platzierung. |
| zodiac.leo | port | zodiacSigns.ts:98-108 | sun+moon+asc, deskriptiv. |
| zodiac.virgo | port | zodiacSigns.ts:114-124 | DE-Prosa. |
| zodiac.libra | port | zodiacSigns.ts:130-140 | DE-Prosa. |
| zodiac.scorpio | port | zodiacSigns.ts:146-156 | DE-Prosa. |
| zodiac.sagittarius | port | zodiacSigns.ts:162-172 | DE-Prosa. |
| zodiac.capricorn | port | zodiacSigns.ts:178-188 | DE-Prosa. |
| zodiac.aquarius | port | zodiacSigns.ts:194-204 | DE-Prosa. |
| zodiac.pisces | port | zodiacSigns.ts:210-220 | DE-Prosa. |

**Domain-Befund:** vollständig — 12/12 PORT. Register-Pass: AN nutzt „du/deine", New_Bazi/fufireNormalizer nutzt „Sie";
beim Port ggf. normalisieren, Bedeutung portiert 1:1. New_Bazi `src/utils/astrology.ts:45-55` ist nur Code-Tabelle
(kein Prosa-Reuse).

## Domain: stems (10 Himmlische Stämme) — vollständig

Primärquelle: `…/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/astro-data/heavenlyStems.ts` (Feld `dayMaster.de`).
IDs referenzieren `HEAVENLY_STEMS` (`astrology.ts:15-26`). Verbotene Begriffe (Heilung/Therapie) erscheinen nur im
**nicht** portierten `monthStem`-Feld.

| Entry-ID | Disposition | Quelle (file:line) | Notiz |
|----------|-------------|--------------------|-------|
| stem.jia | port | heavenlyStems.ts:35 (dayMaster.de) | ~90 W „Jiǎ 甲 ist der aufragende Baum…"; leichter Du→deskriptiv-Pass. |
| stem.yi | port | heavenlyStems.ts:47 (dayMaster.de) | ~90 W „Yǐ 乙 ist die Ranke…"; sauber. |
| stem.bing | port | heavenlyStems.ts:59 (dayMaster.de) | ~95 W „Bǐng 丙 ist die Sonne selbst…"; sauber. |
| stem.ding | port | heavenlyStems.ts:71 (dayMaster.de) | ~95 W „Dīng 丁 ist die Kerzenflamme…"; dayMaster sauber. |
| stem.wu | port | heavenlyStems.ts:83 (dayMaster.de) | „Wù 戊 ist der Berg…" ~190 W → auf 60–120 TRIMMEN. |
| stem.ji | port | heavenlyStems.ts:95 (dayMaster.de) | ~90 W „Jǐ 己 ist der fruchtbare Boden…"; sauber. |
| stem.geng | port | heavenlyStems.ts:107 (dayMaster.de) | ~90 W „Gēng 庚 ist die geschmiedete Klinge…"; sauber. |
| stem.xin | port | heavenlyStems.ts:119 (dayMaster.de) | ~90 W „Xīn 辛 ist der polierte Edelstein…"; sauber. |
| stem.ren | port | heavenlyStems.ts:131 (dayMaster.de) | „Rén 壬 ist der Ozean…" ~200 W → TRIMMEN. |
| stem.gui | port | heavenlyStems.ts:143 (dayMaster.de) | ~95 W „Guǐ 癸 ist der Morgentau…"; dayMaster sauber. |

**Domain-Befund:** vollständig — 10/10 PORT. Zwei Trim-Fälle (stem.wu, stem.ren) > 120 W.
**Kein Reuse aus** `fufireNormalizer.ts` `DAY_MASTER_TEXTS` (L60-82): nur 5 Element-Texte, fehlt die Yin/Yang-Granularität
pro Stamm — nicht als Per-Stamm-Quelle geeignet; AN-Per-Stamm-Prosa behalten, Element-Text nicht verbatim kopieren.

## Domain: branches (12 Irdische Zweige) — vollständig

Primärquelle: `…/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/astro-data/earthlyBranches.ts`
(`EARTHLY_BRANCHES[].description.de`). IDs referenzieren `EARTHLY_BRANCHES` (`astrology.ts:29-42`).
Deskriptiv, Element + Yin/Yang, „Menschen dieses Zweiges", keine verbotenen Begriffe.

| Entry-ID | Disposition | Quelle (file:line) | Notiz |
|----------|-------------|--------------------|-------|
| branch.zi | port | earthlyBranches.ts:44 | ~53 W „Die Ratte (Zǐ 子)…"; knapp unter 60 W, leicht erweitern. |
| branch.chou | port | earthlyBranches.ts:59 | ~70 W „Der Büffel (Chǒu 丑)…". |
| branch.yin | port | earthlyBranches.ts:74 | ~65 W „Der Tiger…"; AN `Yín` → kanonisch `Yǐn` 寅. |
| branch.mao | port | earthlyBranches.ts:89 | ~60 W „Der Hase (Mǎo 卯)…". |
| branch.chen | port | earthlyBranches.ts:104 | ~65 W „Der Drache (Chén 辰)…". |
| branch.si | port | earthlyBranches.ts:119 | ~65 W „Die Schlange (Sì 巳)…". |
| branch.wu | port | earthlyBranches.ts:134 | ~65 W „Das Pferd (Wǔ 午)…". |
| branch.wei | port | earthlyBranches.ts:149 | ~70 W „Die Ziege (Wèi 未)…". |
| branch.shen | port | earthlyBranches.ts:164 | ~65 W „Der Affe (Shēn 申)…". |
| branch.you | port | earthlyBranches.ts:179 | ~65 W „Der Hahn (Yǒu 酉)…". |
| branch.xu | port | earthlyBranches.ts:194 | ~80 W „Der Hund (Xū 戌)…". |
| branch.hai | port | earthlyBranches.ts:209 | ~75 W „Das Schwein (Hài 亥)…". |

**Domain-Befund:** vollständig — 12/12 PORT. Nur branch.zi (~53 W) marginal kurz, leicht erweiterbar.
Kein Reuse-Konflikt: New_Bazi hat nur die `EARTHLY_BRANCHES`-Code-Tabelle (`astrology.ts:29-42`), keine Tier-Prosa.

## Domain: elements (5 Wu-Xing-Elemente) — vollständig

Primärquelle: `…/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/astro-data/wuxing.ts`
(`WUXING_ELEMENTS[].description.de`). Neutral-deskriptiv, TCM-Organ-Bezug, Yin/Yang-Bildsprache.

| Entry-ID | Disposition | Quelle (file:line) | Notiz |
|----------|-------------|--------------------|-------|
| element.holz | port | wuxing.ts:40 | 63 W „Holz verkörpert Wachstum…"; Leber/Galle, neutral. |
| element.feuer | port | wuxing.ts:54 | 62 W „Feuer steht für Leidenschaft…"; Herz/Dünndarm. |
| element.erde | port | wuxing.ts:68 | 60 W „Erde steht für Stabilität…"; zentrale vermittelnde Kraft. |
| element.metall | port | wuxing.ts:82 | 54 W „Metall verkörpert Struktur…"; ~6 W expandieren. |
| element.wasser | port | wuxing.ts:96 | 62 W „Wasser symbolisiert Weisheit…"; neutral. |

**Domain-Befund:** vollständig — 5/5 PORT. Nur element.metall (54 W) leicht expandieren.
**Kein Reuse** aus `fufireNormalizer.ts` `ELEMENT_COACHING` (L22-58) — imperativer Coaching-Ton, passt nicht zur
neutralen Element-Erklärung; `DAY_MASTER_TEXTS` (L60-86) ist Day-Master-Pattern-scoped, nicht Element-als-solches.

## Domain: pillars (4 Säulen / Lebensbereiche) — vollständig

Primärquelle: `…/codebase/Bazodiac-WebApp/Astro-Noctum/src/i18n/translations.ts:802-805`
(`pillars.{year,month,day,hour}Desc`); Parallel-Set `BaZiFourPillars.tsx:26-52`.
Deskriptive Eröffnung („Die …-Säule trägt/regiert/ist/offenbart…"), aber nur ~25–30 W → expandieren + Register
softenen (du/deine → neutral).

| Entry-ID | Disposition | Quelle (file:line) | Notiz |
|----------|-------------|--------------------|-------|
| pillar.year | port | translations.ts:802 (yearDesc) | ~26 W; Herkunft/Prägung/Ahnenenergie; auf 60–120 expandieren, „deine"→neutral. |
| pillar.month | port | translations.ts:803 (monthDesc) | ~28 W; Karriere/Umfeld/Jugend; expandieren, Register softenen. |
| pillar.day | port | translations.ts:804 (dayDesc) | ~24 W; Selbst/Kernidentität-FRAME nur. Element-spez. Day-Master-Detail REUSE `fufireNormalizer.ts:60` (`DAY_MASTER_TEXTS`) — NICHT duplizieren. |
| pillar.hour | port | translations.ts:805 (hourDesc) | ~28 W; Vision/Vermächtnis/Kinder/Zukunft; expandieren, „deiner"→neutral. |

**Domain-Befund:** vollständig — 4/4 PORT (Lebensbereichs-Frame). New_Bazi hat keine Per-Säule-Lebensbereich-Prosa
(`BaZiDetail.tsx:78` nur generisch). Hinweis: pillar.day ist nur der Selbst-Frame; das element-spezifische
Day-Master-Detail wird aus `DAY_MASTER_TEXTS` (`fufireNormalizer.ts:60`) **reused**, nicht hier dupliziert.

## Domain: houses (12 westliche Häuser) — fehlt (PORT), reuse aus New_Bazi

**KEINE** deutsche Per-Haus-Prosa in Astro-Noctum (nur i18n-UI-Labels `translations.ts` de.houses L807-811).
PORT-Quelle = **fehlt** für alle 12. Reusable Basis liegt **vollständig in New_Bazi**:
`src/utils/fufireNormalizer.ts` `HOUSE_TEMPLATES` (L7-20) — echte deskriptive DE-Prosa, aber kurz (~25–40 W) und in
„Ihre/Sie"-Anrede. Alle 12 als **reuse** klassifiziert, damit der vorhandene Text nicht dupliziert wird; jeder
benötigt Längen- + Voice-Kuratierung (auf 60–120 W, neutral-deskriptiv).

| Entry-ID | Disposition | Quelle (file:line) | Notiz |
|----------|-------------|--------------------|-------|
| house.1 | reuse | fufireNormalizer.ts:8 | „Das erste Haus (Aszendent)…" ~35 W, „Ihre/Sie"; expandieren + neutralisieren. Keine AN-Prosa. |
| house.2 | reuse | fufireNormalizer.ts:9 | Ressourcen/Talente/Selbstwert; kurz, expandieren. Keine AN-Prosa. |
| house.3 | reuse | fufireNormalizer.ts:10 | Alltagsdenken/Umfeld/Geschwister; expandieren. Keine AN-Prosa. |
| house.4 | reuse | fufireNormalizer.ts:11 | „Das vierte Haus (Imum Coeli)…" Fundament/Familie; expandieren. Keine AN-Prosa. |
| house.5 | reuse | fufireNormalizer.ts:12 | Kreativität/Liebe/inneres Kind; expandieren. Keine AN-Prosa. |
| house.6 | reuse | fufireNormalizer.ts:13 | Routinen/Gesundheit/Arbeitsalltag; expandieren. Keine AN-Prosa. |
| house.7 | reuse | fufireNormalizer.ts:14 | „Das siebte Haus (Deszendent)…" Partnerschaft; expandieren. Keine AN-Prosa. |
| house.8 | reuse | fufireNormalizer.ts:15 | Transformation/Tabus/Erneuerung; expandieren. Keine AN-Prosa. |
| house.9 | reuse | fufireNormalizer.ts:16 | Philosophie/Ethik/Horizont; expandieren. Keine AN-Prosa. |
| house.10 | reuse | fufireNormalizer.ts:17 | „Das zehnte Haus (Medium Coeli)…" Karriere/Status; expandieren. Keine AN-Prosa. |
| house.11 | reuse | fufireNormalizer.ts:18 | Netzwerke/Hoffnungen/Visionen; expandieren. Keine AN-Prosa. |
| house.12 | reuse | fufireNormalizer.ts:19 | Verborgenes/karmische Auflösung/Hingabe; expandieren. Keine AN-Prosa. |

**Domain-Befund:** fehlt — 0/12 PORT (keine portierbare AN-Prosa), 12/12 REUSE aus New_Bazi-Basis + Pflicht-Expansion.

---

## Totals (55 Einträge)

| Disposition | Anzahl | Domains |
|-------------|--------|---------|
| **port** | **43** | zodiac (12), stems (10), branches (12), elements (5), pillars (4) |
| **reuse** | **12** | houses (12) |
| **curate** (Quelle fehlt) | **0** | — |
| **Gesamt** | **55** | |

## Kuratierungs-Last (Effort-Signal für T2)

- **Invent-from-scratch-Count (Disposition `curate` = Quelle fehlt komplett): 0.** Für keinen der 55 Einträge fehlt
  eine Quelle; kein Text wird aus dem Kopf erfunden. **Achtung — zwei verschiedene Achsen:** das Registry-Feld
  `source` ist ein 2-Wert-Enum `{astro-noctum | curated}`. Die 12 **reuse**-Einträge (houses) tragen deshalb
  `source:"curated"` (das Enum hat keinen eigenen `reuse`-Wert) — sie sind New_Bazi-eigene HOUSE_TEMPLATES,
  erweitert/voiced, **nicht** from-scratch erfunden. „0 curate" (Disposition) ≠ „source:curated"-Feld (= 12).
- **Domains, die mehrheitlich/komplett `curate` sind: KEINE.** Die einzige Domain mit `domainQuality: "fehlt"` ist
  **houses**, aber „fehlt" bezieht sich dort nur auf **fehlende AN-PORT-Prosa** — eine vollständige New_Bazi-`reuse`-Basis
  existiert. houses ist damit **reuse-heavy, nicht curate-heavy**.
- **Reale Effort-Verteilung für T2:**
  - **Niedrig (Port 1:1 + Mikro-Pass):** zodiac, branches, elements — 29 Einträge, meist nur Register-/±Wort-Pass.
  - **Mittel (Port + Trim):** stems — 10 Einträge, davon 2 (`stem.wu`, `stem.ren`) auf 60–120 W kürzen.
  - **Mittel (Port + Expand + Soften):** pillars — 4 Einträge, ~25–30 W → 60–120 W, du→neutral.
  - **Hoch (Reuse + Expand + Voice-Shift):** houses — 12 Einträge, ~25–40 W „Ihre/Sie" → 60–120 W neutral-deskriptiv.
    **Dies ist die größte Einzel-Last des Sprints** (12 von 55 Texten brauchen echte Expansions-/Voice-Arbeit).
- **Sign-off-Last (Amendment E):** Jeder der 12 `reuse`-Texte und jeder Port mit substanziellem Pass (stems-Trims,
  alle 4 pillars) durchläuft per-Text semantischen Sign-off + Benjamin PR-Review. Da curate=0, ist **keine** Stop-Bedingung
  ausgelöst — der Sprint läuft als reiner Port-/Reuse-/Kuratierungs-Lauf durch.

## Querverweise (kein eigenes Gate)

- **Hidden-Stems:** funktionieren bereits, kein Content-Gate (Amendment A korrigiert / REQ-P5-007). Kanonisch im
  `hiddenStems`-Feld von `EARTHLY_BRANCHES` (`src/utils/astrology.ts:30-41`).
- **Kanonische ID-Quellen:** `stem.*` → `HEAVENLY_STEMS` (`src/utils/astrology.ts:15-26`);
  `branch.*` → `EARTHLY_BRANCHES` (`src/utils/astrology.ts:29-42`). Beim Port die kanonische New_Bazi-Pinyin-Schreibweise
  verwenden (insb. Tiger `Yǐn`, nicht AN-`Yín`).
