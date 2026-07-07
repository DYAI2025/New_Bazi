# MASTER: New_Bazi Vollfeature-Roadmap — Steuerdokument für Ausführungs-Agenten

> **Für jeden Ausführungs-Agenten (Codex/Sonnet/etc.): Dieses Dokument ZUERST vollständig lesen, dann den jeweiligen Sprint-Plan. Die Regeln hier sind BINDEND und gelten für jeden Sprint.**

Stand: 2026-06-11. Quelle: `new-bazi-full-feature-validation-and-sprint-plan-v2.md` (Anforderungen) + Live-Verifikationen + Session-Erfahrung aus PRs #10–#17.

---

## 0. Projekt-Topologie (verifiziert)

- **Ziel-Repo:** `DYAI2025/New_Bazi`, lokal `/Users/benjaminpoersch/Projects/New_Bazi`. React 19 + Vite + Tailwind v4 + Express-BFF (`src/server/app.ts`). Tests: vitest (`npm test`, Stand ~223) + Playwright (`npx playwright test`, Stand 15). Gates: `npm run lint` (tsc --noEmit), `npm run build`.
- **Ersatzteillager (READ-ONLY!):** `DYAI2025/Astro-Noctum`, lokal `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum` (+ Arbeitskopie `/Users/benjaminpoersch/Projects/Astro-Noctum`). NIEMALS dort committen — nur lesen/portieren.
- **Engine:** `DYAI2025/FuFirE`, lokal `/Users/benjaminpoersch/Projects/FuFirE`. FastAPI + pytest (`uv run pytest`, ~2526 Tests). Live: `https://api.fufire.space` (Railway-Projekt `FuFire_API`, Service `FuFire`). Auth: `X-API-Key` (ein Enterprise-Key in `FUFIRE_API_KEYS` auf dem Railway-Service).
- **Deploy:** Railway auto-deployt `main` von New_Bazi (Projekt `Bazodiac-App`, Service `New_Bazi`, Domain `newbazi-production.up.railway.app`).
- **Live-Verify-Pflicht (DoD):** Nach Merge die deployte Version prüfen, nicht nur lokal (siehe §3).

## 1. Arbeitsregeln (jeder Sprint, jeder Agent)

1. **Branch-Ritual** (lokale Tracking-Config ist verwaist!):
   ```bash
   cd /Users/benjaminpoersch/Projects/New_Bazi
   git checkout main && git fetch origin && git reset --hard origin/main
   git checkout -b <branch-aus-sprint-plan>
   ```
   Baseline-Gates VOR der Arbeit laufen lassen + Zahlen notieren. Dirty `docs/qa/screenshots/*` vom letzten e2e-Lauf vorher mit `git checkout -- docs/qa/screenshots/` verwerfen.
2. **TDD ohne Ausnahme:** Failing Test zuerst, Red-Beweis im Report, dann Minimal-Implementation, dann Green. Konventionelle Commits (`feat:`/`fix:`/`test:`/`docs:`), klein und häufig.
3. **Gates vor jedem Commit:** `npm run lint && npm test`. Vor PR: zusätzlich `npm run build && npx playwright test`.
4. **Ehrlichkeits-Regeln (test-erzwungen, nicht verhandelbar):**
   - Fehlende Daten → `null`/Missing-State, NIEMALS 0, 75 oder erfundene Defaults.
   - Keine erfundenen Texte, die als personalisiert/Engine-Output erscheinen. Jeder angezeigte Text hat einen Datenanker oder ist als kuratiert/statisch erkennbar.
   - Verbotene Wörter in Produkttexten: „Coaching", „Therapie", „Diagnose", „Heilung", „Du bist …"-Festlegungen. Anti-Reification-Sprache (siehe `docs/concept/spannungsnavigator-grundregeln.md`).
   - Positionierung: Entertainment/Reflexion.
5. **Bekannte technische Fallen:**
   - **rtk-Hook**: Bash-Kommandos werden teils durch `rtk` umgeschrieben; bei Fehlermeldung „Use `rtk ...` instead" exakt so erneut ausführen. `uv run python3` statt `python3`. rtk komprimiert curl-JSON zu Typ-Schemata — kein Parse-Error, `rtk proxy curl` für Rohdaten.
   - **framer-motion v12 + SVG**: erzwingt `transform-box: fill-box` und ignoriert px-`transform-origin` → NIEMALS motion-Transforms auf SVG-Elementen. CSS-Transforms mit `transformBox: "view-box"` oder statische SVG-Attribute.
   - **SVG-viewBox**: muss horizontal symmetrisch um das Ring-Zentrum bleiben, sonst fluchten HTML-Overlays nicht (TensionNavigator: viewBox `-150 0 1020 720`, CX=360).
   - **Playwright-Screenshots**: `fullPage` stitcht den Sticky-Header in die Bildmitte — Container-Screenshots + Viewport groß genug (1280×1600).
   - **Engine-Schemas sind heterogen**: NIE Payload-Shapes raten. `src/__fixtures__/fufire/*.json` = echte Responses; `src/utils/fufirePayloadMappers.ts` = die einzige Stelle für Request-Bau. Neue Endpoints: erst Live-Fixture ziehen (`scripts/fufire-dump-fixtures.mts`-Muster), dann implementieren.
   - **Chart-Route**: `/chart` ist absichtlich NICHT unter `/v1` (Engine-Design). Einzige unprefixed Route.
6. **PR-Disziplin:** Ein PR pro Sprint(-teil), Body mit ehrlicher MISSING-Liste. KEIN Merge ohne Review. PR-Titel konventionell.
7. **Secrets:** nie printen, nie committen. Railway-Vars lesen via `cd /tmp && railway link --project "Bazodiac-App" && railway variables --service New_Bazi --kv` (nur Namen/Längen berichten). `.env` ist gitignored.
8. **Portierungs-Regel:** Aus Astro-Noctum portierter Code braucht im Plan-Report: Quellpfad, Zielpfad, was angepasst wurde, Test. Nichts blind kopieren — New_Bazi-Konventionen (Tailwind-Tokens, ViewModel-Pattern, sendError-Envelope) gelten.

## 2. Sprint-Sequenz, Abhängigkeiten, Fidelity

| # | Plan-Datei (docs/plans/) | Inhalt | Hängt ab von | Fidelity |
|---|---|---|---|---|
| P1 | `2026-06-11-sprint-p1-kritische-fixes.md` | B-001 Coaching-Wording, B-002 Kohärenz-Missing, B-007 Asc/Mond/Haus-Test, B-010 Navigator-Intro, A8 DST-Text, A13 warnings rendern, A14 Einheitstexte | — | A (voll) |
| P2 | `2026-06-11-sprint-p2-engine-track.md` (liegt im FuFirE-Repo-Kontext!) | B-003 Daily-Variation, Issue #133 daily_elemental_comparison, B-012 Dayun, Unknown-Time-Contract | — (parallel zu allem) | A |
| P3 | `2026-06-11-sprint-p3-supabase-foundation.md` | Auth, Schema, RLS, Profil speichern/laden | **Entscheidung E-DB** (§4) | A |
| P4 | `2026-06-11-sprint-p4-unknown-time.md` | UI-Toggle, Validation, Partial-Profile, Degradation | P2 (Engine-Contract) | A |
| P5 | `2026-06-11-sprint-p5-content-layer.md` | Overview-Erklärlayer, Häuser-Vertiefung, BaZi-Säulen-Tiefe, Content-Registry | — (Texte aus Astro-Noctum) | B |
| P6 | `2026-06-11-sprint-p6-wuxing-practical.md` | Praktische Impulse, Feng-Shui-Recherche-Workflow, Design (Pergament/Gold/Partikel, Dark/Light-Kontraste B-011) | — | B |
| P7 | `2026-06-11-sprint-p7-synastrie-completion.md` | West-Interaspekte, BaZi-Säulen-Vergleich, WuXing-Overlay, Paar-Polachsen mit spezifischen Texten | — (besser nach P3 für Partner-Persistenz) | A |
| P8 | `2026-06-11-sprint-p8-quiz-port.md` | 23 Quiz-Definitionen + UI + Scoring + ContributionEvents + Paar-Mechanik (inkl. partner-match-01..03) | P3 | B |
| P9 | `2026-06-11-sprint-p9-daily-hub-rat-der-6.md` | Tagespuls+Navigator ein Hub, Rat der 6 portieren, Aphorismen, Cyan-Linse (N2-Contract!) | P2, P3; Contract: Annex in `2026-06-11-spannungsnavigator-mvp.md` | B |
| P10 | `2026-06-11-sprint-p10-signatur.md` | SignatureState, Sphere-Visual, Spannungs-/Tages-/Reaktions-Modulation | P9 | B |
| P11 | `2026-06-11-sprint-p11-voice-agents.md` | Levi/Eve Tool-Endpoints, Conversation-Memory, Sphere-UI-Stub, Free-Mode-Disabled-State | P3 | B |
| P12 | `2026-06-11-sprint-p12-spaceweather-pdf-beta.md` | Space-Weather-Port, PDF-Report 2.0, Fusion-Narrativ/Onboarding, Beta-Flag-Cut, Prod-Hardening-Checkliste | alles | B |

Fidelity A = Bite-Size-Schritte mit vollständigem Code. Fidelity B = präzise Contracts, Quell-Karten (Datei→Datei), Akzeptanzkriterien, erzwungene Explorations-Schritte — der Executor liest die benannten Quellen, rät nie.

**Parallelisierbar:** P2 immer; P5+P6 untereinander und zu P3; P7 zu P3. **Kritischer Pfad:** P3 → P8/P9/P11.

## 3. Definition of Done (jeder Sprint)

1. Alle Plan-Tasks grün (TDD-Beweise im Report).
2. `npm run lint && npm test && npm run build && npx playwright test` grün; Zahlen vorher/nachher berichtet.
3. PR offen mit ehrlicher MISSING-Liste; Review (Mensch oder starker Agent) vor Merge.
4. Nach Merge + Railway-Deploy: Live-Smoke auf `newbazi-production.up.railway.app` (mind. der neue Pfad + 1 Regression), Ergebnis berichtet. Deploy-Frische via neuem Asset-Bundle-Hash prüfbar.
5. Keine neuen Konsolen-Fehler im Browser auf den betroffenen Tabs (Browser-Check mit Error-Listener via `Page.addScriptToEvaluateOnNewDocument`).

## 4. Offene Entscheidungen (BLOCKER, Benjamin fragen bevor betroffene Sprints starten)

- **E-DB (blockiert P3):** Supabase-Instanz von Astro-Noctum mitnutzen (User + gehärtetes Schema vorhanden, aber Kopplung) ODER frische Instanz für New_Bazi (sauber, getrennte User)?
- **E-KINKY (blockiert Teile von P8):** kinky-01..04 in New_Bazi portieren? Brand-Fit/Altersfrage.
- **E-ELEVEN (P11):** ElevenLabs-Account ist Free-Mode (Hack-Folge) — P11 baut Contract + Disabled-State; Go-Live der Voice braucht Account-Klärung.

## 5. Verifizierte Fakten, auf die sich Pläne stützen (nicht neu prüfen)

- Tagespuls-Texte sind live für 3 verschiedene `targetDate` IDENTISCH (B-003 bestätigt 2026-06-11) → Ursache Engine-seitig.
- `coherenceIndex`-Fallback endet bei `0` (`fufireNormalizer.ts:556-558`); lokaler Fallback nutzt hartes `75` (Z. ~774).
- Astro-Noctum hat exakt 23 Quiz-Definitionen in `packages/shared/src/quizzes/definitions/index.ts` (22 spielbar + conversation-analysis; darunter partner-match-01..03, kinky-01..04).
- Rat der 6 + Aphorismen + 2-Phasen-Tagespuls sind in Astro-Noctum LIVE implementiert (server.mjs ~3058–3380, `server/services/tagespuls.service.mjs`, Supabase-Tabellen `aphorisms`/`daily_pulses`/`daily_interpretations`/`aphorism_usage_events`/`cosmic_weather_snapshots`, Migration `20260509_tagespuls_tables.sql`, 21 Aphorismen geseedet, 1×/Tag-Regel via Migrationen 20260510).
- `signature_blueprint` (seed+visual) kommt im FuFirE-Bootstrap-Response; Astro-Noctum `server.mjs` hat signature-delta-Logik (`computeQuizDimensions`/`projectToRing`).
- N2/N3-Integrations-Contract (Council→Cyan-Linse, Gewichten nur Lesart-Ebene, Marker→Achsen-Mapping) steht BINDEND im Annex von `docs/plans/2026-06-11-spannungsnavigator-mvp.md`.
- FuFirE-Engine-Issue #133 (daily_elemental_comparison) existiert.

## 6. Review-Protokoll für schwache Executor

Nach jedem Sprint-PR, BEVOR gemerged wird: ein separater Review-Agent prüft (a) Spec-Treue gegen den Plan, (b) dass kein Test gelockert wurde, (c) Anti-Reification-Sprache in allen neuen Strings, (d) Gates selbst nachlaufen. Findings → Fix-Runde im selben PR. Erst dann Merge.
